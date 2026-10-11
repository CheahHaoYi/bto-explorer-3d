import type { BuildingGeometry } from '../../shared/contracts'

type FootprintCollection = Map<string, BuildingGeometry>

const footprintPromises = new Map<string, Promise<FootprintCollection>>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validPosition(value: unknown): value is number[] {
  return Array.isArray(value) && value.length >= 2 &&
    typeof value[0] === 'number' && Number.isFinite(value[0]) && value[0] >= -180 && value[0] <= 180 &&
    typeof value[1] === 'number' && Number.isFinite(value[1]) && value[1] >= -90 && value[1] <= 90
}

function validRing(value: unknown): value is number[][] {
  if (!Array.isArray(value) || value.length < 4 || !value.every(validPosition)) return false
  const first = value[0]
  const last = value[value.length - 1]
  return first[0] === last[0] && first[1] === last[1]
}

function validPolygonCoordinates(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && value.every(validRing)
}

function parseGeometry(value: unknown): BuildingGeometry | null {
  if (!isRecord(value)) return null
  if (value.type === 'Polygon' && validPolygonCoordinates(value.coordinates)) {
    return { type: 'Polygon', coordinates: value.coordinates as number[][][] }
  }
  if (value.type === 'MultiPolygon' && Array.isArray(value.coordinates) &&
      value.coordinates.length > 0 && value.coordinates.every(validPolygonCoordinates)) {
    return { type: 'MultiPolygon', coordinates: value.coordinates as number[][][][] }
  }
  return null
}

function parseFootprints(payload: unknown, expectedRegionCode: string): FootprintCollection {
  if (!isRecord(payload) || payload.type !== 'FeatureCollection' || !isRecord(payload.metadata) ||
      payload.metadata.region_code !== expectedRegionCode ||
      payload.metadata.source !== 'HDB Existing Building — Housing & Development Board' ||
      payload.metadata.source_url !== 'https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view' ||
      !Array.isArray(payload.features) ||
      payload.metadata.feature_count !== payload.features.length) {
    throw new Error(`The ${expectedRegionCode} HDB footprint file has an invalid format.`)
  }

  const footprints = new Map<string, BuildingGeometry>()
  for (const feature of payload.features) {
    if (!isRecord(feature) || feature.type !== 'Feature' || typeof feature.id !== 'string' ||
        !isRecord(feature.properties) || feature.properties.building_id !== feature.id ||
        typeof feature.properties.block_number !== 'string' || footprints.has(feature.id)) {
      throw new Error(`The ${expectedRegionCode} HDB footprint file contains an invalid or duplicate feature.`)
    }
    const geometry = parseGeometry(feature.geometry)
    if (!geometry) throw new Error(`The ${expectedRegionCode} HDB footprint file contains invalid polygon coordinates.`)
    footprints.set(feature.id, geometry)
  }
  return footprints
}

export function loadRegionFootprints(regionCode: string): Promise<FootprintCollection> {
  const code = regionCode.trim().toUpperCase()
  if (!/^[A-Z]+$/.test(code)) return Promise.reject(new Error('The selected HDB block has no valid region code.'))
  const existing = footprintPromises.get(code)
  if (existing) return existing

  const promise = (async () => {
    const url = `${import.meta.env.BASE_URL}data/regions/footprints/${code.toLowerCase()}.geojson`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HDB footprint data returned HTTP ${response.status}.`)
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new Error('HDB footprint data is not valid JSON.')
    }
    return parseFootprints(payload, code)
  })().catch((error: unknown) => {
    footprintPromises.delete(code)
    throw error
  })
  footprintPromises.set(code, promise)
  return promise
}

export async function loadBuildingFootprint(regionCode: string, buildingId: string): Promise<BuildingGeometry> {
  const footprints = await loadRegionFootprints(regionCode)
  const geometry = footprints.get(buildingId)
  if (!geometry) throw new Error('The source footprint for this HDB block is not available.')
  return geometry
}
