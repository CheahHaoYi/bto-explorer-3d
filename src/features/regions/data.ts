import type { MultiPolygon } from 'geojson'
import type { RegionDataset, RegionRecord, RegionalHdbRecord } from './types'

const REGION_DATA_URL = `${import.meta.env.BASE_URL}data/regions/hdb-by-region.json`
const FOOTPRINT_ASSET_BY_REGION: Record<string, string> = {
  CR: 'buildings/cr.geojson',
  ER: 'buildings/er.geojson',
  NR: 'buildings/nr.geojson',
  NER: 'buildings/ner.geojson',
  WR: 'buildings/wr.geojson',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPosition(value: unknown): value is number[] {
  return Array.isArray(value) && value.length >= 2 &&
    isFiniteNumber(value[0]) && value[0] >= -180 && value[0] <= 180 &&
    isFiniteNumber(value[1]) && value[1] >= -90 && value[1] <= 90
}

function isRing(value: unknown): value is number[][] {
  if (!Array.isArray(value) || value.length < 4 || !value.every(isPosition)) return false
  const first = value[0]
  const last = value[value.length - 1]
  return first[0] === last[0] && first[1] === last[1]
}

function isPolygonCoordinates(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && value.every((ring) => isRing(ring))
}

function isMultiPolygonCoordinates(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && value.every(isPolygonCoordinates)
}

function parseBuilding(value: unknown): RegionalHdbRecord | null {
  if (!isRecord(value) || typeof value.buildingId !== 'string' || value.buildingId.length === 0 ||
      typeof value.blockNumber !== 'string' || value.blockNumber.length === 0 ||
      typeof value.postalCode !== 'string' || value.postalCode.length === 0 ||
      !(typeof value.streetCode === 'string' || value.streetCode === null) ||
      !isFiniteNumber(value.longitude) || value.longitude < -180 || value.longitude > 180 ||
      !isFiniteNumber(value.latitude) || value.latitude < -90 || value.latitude > 90) return null
  return {
    buildingId: value.buildingId,
    blockNumber: value.blockNumber,
    postalCode: value.postalCode,
    streetCode: value.streetCode,
    longitude: value.longitude,
    latitude: value.latitude,
  }
}

export function parseRegionDataset(payload: unknown): RegionDataset {
  if (!isRecord(payload) || payload.schemaVersion !== 1 || !isRecord(payload.metadata) || !Array.isArray(payload.regions)) {
    throw new Error('Region HDB data has an unsupported or invalid format.')
  }
  const metadata = payload.metadata
  if (!isRecord(metadata.hdbSource) || !isRecord(metadata.regionSource) ||
      typeof metadata.license !== 'string' || typeof metadata.crsAssumption !== 'string' ||
      typeof metadata.assignmentMethod !== 'string' || !isRecord(metadata.counts) ||
      !Array.isArray(metadata.hdbSource.sourceFields) || !Array.isArray(metadata.regionSource.sourceFields) ||
      !isRecord(metadata.counts.hdbByRegion)) {
    throw new Error('Region HDB data is missing required provenance or count metadata.')
  }

  const seenRegionCodes = new Set<string>()
  const seenBuildingIds = new Set<string>()
  const regions: RegionRecord[] = []
  for (const rawRegion of payload.regions) {
    if (!isRecord(rawRegion) || typeof rawRegion.code !== 'string' || rawRegion.code.length === 0 ||
        typeof rawRegion.name !== 'string' || rawRegion.name.length === 0 ||
        !isRecord(rawRegion.geometry) || rawRegion.geometry.type !== 'MultiPolygon' ||
        !isMultiPolygonCoordinates(rawRegion.geometry.coordinates) ||
        !Number.isInteger(rawRegion.buildingCount) || (rawRegion.buildingCount as number) < 0 ||
        !Array.isArray(rawRegion.buildings) ||
        rawRegion.footprintsAsset !== FOOTPRINT_ASSET_BY_REGION[rawRegion.code] ||
        seenRegionCodes.has(rawRegion.code)) {
      throw new Error('Region HDB data contains an invalid or duplicate region.')
    }
    seenRegionCodes.add(rawRegion.code)
    const buildings: RegionalHdbRecord[] = []
    for (const rawBuilding of rawRegion.buildings) {
      const building = parseBuilding(rawBuilding)
      if (!building || seenBuildingIds.has(building.buildingId)) {
        throw new Error(`Region ${rawRegion.code} contains an invalid or duplicate HDB record.`)
      }
      seenBuildingIds.add(building.buildingId)
      buildings.push(building)
    }
    if (buildings.length !== rawRegion.buildingCount) {
      throw new Error(`Region ${rawRegion.code} building count does not match its HDB list.`)
    }
    regions.push({
      code: rawRegion.code,
      name: rawRegion.name,
      geometry: { type: 'MultiPolygon', coordinates: rawRegion.geometry.coordinates } as MultiPolygon,
      buildingCount: rawRegion.buildingCount as number,
      buildings,
      footprintsAsset: rawRegion.footprintsAsset,
    })
  }

  const counts = metadata.counts as Record<string, unknown>
  if (!Number.isInteger(counts.regions) || counts.regions !== regions.length ||
      !Number.isInteger(counts.validAssignedHdbFeatures) || counts.validAssignedHdbFeatures !== seenBuildingIds.size ||
      !Number.isInteger(counts.hdbSourceFeatures) || !Number.isInteger(counts.skippedInvalidHdbFeatures) ||
      !Number.isInteger(counts.skippedUnassignedOrAmbiguousHdbFeatures)) {
    throw new Error('Region HDB data totals do not match its records.')
  }

  const hdbSource = metadata.hdbSource as Record<string, unknown>
  const regionSource = metadata.regionSource as Record<string, unknown>
  for (const source of [hdbSource, regionSource]) {
    if (typeof source.name !== 'string' || typeof source.url !== 'string') {
      throw new Error('Region HDB data source metadata is incomplete.')
    }
  }
  const hdbSourceFields = hdbSource.sourceFields as unknown[]
  const regionSourceFields = regionSource.sourceFields as unknown[]
  const hdbByRegionSource = counts.hdbByRegion as Record<string, unknown>
  if (!(hdbSource.localSnapshotDate === null || typeof hdbSource.localSnapshotDate === 'string') ||
      !(regionSource.localRetrievalDate === null || typeof regionSource.localRetrievalDate === 'string') ||
      typeof regionSource.coverage !== 'string' ||
      !hdbSourceFields.every((field) => typeof field === 'string') ||
      !regionSourceFields.every((field) => typeof field === 'string')) {
    throw new Error('Region HDB data provenance fields are invalid.')
  }

  const hdbByRegion: Record<string, number> = {}
  for (const [code, count] of Object.entries(hdbByRegionSource)) {
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
      throw new Error('Region HDB data has an invalid per-region count.')
    }
    hdbByRegion[code] = count
  }
  if (regions.some((region) => hdbByRegion[region.code] !== region.buildingCount)) {
    throw new Error('Region HDB data per-region counts do not match its lists.')
  }

  return {
    schemaVersion: 1,
    metadata: {
      hdbSource: {
        name: hdbSource.name as string,
        url: hdbSource.url as string,
        localSnapshotDate: hdbSource.localSnapshotDate as string | null,
        sourceFields: hdbSourceFields as string[],
      },
      regionSource: {
        name: regionSource.name as string,
        url: regionSource.url as string,
        coverage: regionSource.coverage as string,
        localRetrievalDate: regionSource.localRetrievalDate as string | null,
        sourceFields: regionSourceFields as string[],
      },
      license: metadata.license,
      crsAssumption: metadata.crsAssumption,
      assignmentMethod: metadata.assignmentMethod,
      counts: {
        hdbSourceFeatures: counts.hdbSourceFeatures as number,
        validAssignedHdbFeatures: counts.validAssignedHdbFeatures as number,
        skippedInvalidHdbFeatures: counts.skippedInvalidHdbFeatures as number,
        skippedUnassignedOrAmbiguousHdbFeatures: counts.skippedUnassignedOrAmbiguousHdbFeatures as number,
        regions: counts.regions as number,
        hdbByRegion,
      },
    },
    regions,
  }
}

export async function loadRegionDataset(): Promise<RegionDataset> {
  const response = await fetch(REGION_DATA_URL)
  if (!response.ok) throw new Error(`Region HDB data returned HTTP ${response.status}.`)
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error('Region HDB data is not valid JSON.')
  }
  return parseRegionDataset(payload)
}

export async function loadRegionFootprints(region: RegionRecord, signal: AbortSignal): Promise<GeoJSON.FeatureCollection> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/regions/${region.footprintsAsset}`, { signal })
  if (!response.ok) throw new Error(`${region.name} footprint data returned HTTP ${response.status}.`)
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(`${region.name} footprint data is not valid JSON.`)
  }
  if (!isRecord(payload) || payload.type !== 'FeatureCollection' || !Array.isArray(payload.features) ||
      !isRecord(payload.metadata) || payload.metadata.regionCode !== region.code ||
      payload.metadata.featureCount !== region.buildingCount || payload.features.length !== region.buildingCount ||
      typeof payload.metadata.source !== 'string' || typeof payload.metadata.sourceUrl !== 'string' ||
      typeof payload.metadata.regionSource !== 'string' || typeof payload.metadata.regionSourceUrl !== 'string' ||
      typeof payload.metadata.license !== 'string' || typeof payload.metadata.crsAssumption !== 'string' ||
      typeof payload.metadata.geometryTransformation !== 'string') {
    throw new Error(`${region.name} footprint data does not match the regional index.`)
  }
  const knownBuildings = new Map(region.buildings.map((building) => [building.buildingId, building]))
  const seen = new Set<string>()
  const features: GeoJSON.Feature[] = []
  for (const feature of payload.features) {
    if (!isRecord(feature) || feature.type !== 'Feature' || typeof feature.id !== 'string' ||
        !isRecord(feature.properties) || feature.properties.building_id !== feature.id ||
        !knownBuildings.has(feature.id) || seen.has(feature.id) || !isRecord(feature.geometry)) {
      throw new Error(`${region.name} footprint data contains an invalid or duplicate HDB feature.`)
    }
    const geometry = feature.geometry
    const validGeometry = (geometry.type === 'Polygon' && isPolygonCoordinates(geometry.coordinates)) ||
      (geometry.type === 'MultiPolygon' && isMultiPolygonCoordinates(geometry.coordinates))
    if (!validGeometry) throw new Error(`${region.name} footprint data contains an invalid HDB geometry.`)
    const indexRecord = knownBuildings.get(feature.id)!
    if (feature.properties.block_number !== indexRecord.blockNumber ||
        feature.properties.postal_code !== indexRecord.postalCode ||
        feature.properties.street_code !== indexRecord.streetCode ||
        feature.properties.longitude !== indexRecord.longitude || feature.properties.latitude !== indexRecord.latitude) {
      throw new Error(`${region.name} footprint properties do not match the regional HDB list.`)
    }
    seen.add(feature.id)
    features.push(feature as unknown as GeoJSON.Feature)
  }
  return { type: 'FeatureCollection', features }
}
