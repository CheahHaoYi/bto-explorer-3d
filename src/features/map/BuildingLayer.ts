import * as L from 'leaflet'
import type {
  BuildingFeature,
  BuildingFeatureCollection,
  BuildingLayerState,
  BuildingMetadata,
} from '../buildings/types'

const DATA_URL = `${import.meta.env.BASE_URL}data/under-construction/buildings.geojson`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPosition(value: unknown): value is number[] {
  return Array.isArray(value) && value.length >= 2 && value.slice(0, 2).every(
    (coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate),
  )
}

function isRing(value: unknown): value is number[][] {
  if (!Array.isArray(value) || value.length < 4 || !value.every(isPosition)) return false
  const first = value[0]
  const last = value[value.length - 1]
  return first[0] === last[0] && first[1] === last[1]
}

function isPolygonCoordinates(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && value.every(isRing)
}

function isMultiPolygonCoordinates(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && value.every(isPolygonCoordinates)
}

function isBuildingFeature(value: unknown): value is BuildingFeature {
  if (!isRecord(value) || value.type !== 'Feature' || !isRecord(value.geometry) || !isRecord(value.properties)) return false
  const geometry = value.geometry
  const polygonal =
    (geometry.type === 'Polygon' && isPolygonCoordinates(geometry.coordinates)) ||
    (geometry.type === 'MultiPolygon' && isMultiPolygonCoordinates(geometry.coordinates))
  const properties = value.properties
  return polygonal &&
    typeof properties.building_id === 'string' && properties.building_id.length > 0 &&
    value.id === properties.building_id &&
    (typeof properties.block_number === 'string' || properties.block_number === null) &&
    (typeof properties.postal_code === 'string' || properties.postal_code === null) &&
    typeof properties.longitude === 'number' && Number.isFinite(properties.longitude) && properties.longitude >= -180 && properties.longitude <= 180 &&
    typeof properties.latitude === 'number' && Number.isFinite(properties.latitude) && properties.latitude >= -90 && properties.latitude <= 90 &&
    typeof properties.data_source === 'string' &&
    typeof properties.source_properties === 'object' && properties.source_properties !== null && !Array.isArray(properties.source_properties)
}

function parseFeatureCollection(payload: unknown): {
  collection: BuildingFeatureCollection | null
  sourceFeatureCount: number
  skippedFeatureCount: number
  invalidCollection: boolean
} {
  if (!isRecord(payload) || payload.type !== 'FeatureCollection' || !Array.isArray(payload.features)) {
    return { collection: null, sourceFeatureCount: 0, skippedFeatureCount: 0, invalidCollection: true }
  }
  const sourceFeatureCount = payload.features.length
  const seenIds = new Set<string>()
  const features = payload.features.filter((value): value is BuildingFeature => {
    if (!isBuildingFeature(value) || seenIds.has(value.properties.building_id)) return false
    seenIds.add(value.properties.building_id)
    return true
  })
  if (features.length === 0) {
    return { collection: null, sourceFeatureCount, skippedFeatureCount: sourceFeatureCount, invalidCollection: sourceFeatureCount > 0 }
  }
  return {
    collection: { type: 'FeatureCollection', features },
    sourceFeatureCount,
    skippedFeatureCount: sourceFeatureCount - features.length,
    invalidCollection: false,
  }
}

function toBuildingMetadata(feature: BuildingFeature): BuildingMetadata {
  const properties = feature.properties
  return {
    buildingId: properties.building_id,
    blockNumber: properties.block_number,
    postalCode: properties.postal_code,
    coordinates: { longitude: properties.longitude, latitude: properties.latitude },
    geometry: feature.geometry,
    renderHeightM: properties.render_height_m,
    heightSource: properties.height_source,
    heightIsOfficial: properties.height_is_official,
    dataSource: properties.data_source,
    dataSourceUrl: properties.data_source_url,
    sourceProperties: properties.source_properties,
  }
}

const DEFAULT_STYLE: L.PathOptions = {
  color: '#607866',
  weight: 1.25,
  opacity: 0.9,
  fillColor: '#9bb79a',
  fillOpacity: 0.55,
}

const SELECTED_STYLE: L.PathOptions = {
  color: '#8a4937',
  weight: 2.5,
  opacity: 1,
  fillColor: '#d68162',
  fillOpacity: 0.82,
}

export class BuildingLayer {
  private disposed = false
  private selectedId: string | null = null
  private geoJsonLayer: L.GeoJSON | null = null
  private readonly featureLayers = new Map<string, L.Path>()
  private readonly featuresById = new Map<string, BuildingFeature>()
  private readonly featureBoundsById = new Map<string, L.LatLngBounds>()

  constructor(
    private readonly map: L.Map,
    private readonly onSelect: (building: BuildingMetadata | null) => void,
    private readonly onState: (state: BuildingLayerState) => void,
    private readonly onBuildingsLoaded: (buildings: BuildingMetadata[]) => void,
  ) {}

  async load(): Promise<void> {
    this.onState({ status: 'loading', message: 'Loading under-construction HDB footprints…', featureCount: 0, skippedFeatureCount: 0 })
    let response: Response
    try {
      response = await fetch(DATA_URL)
    } catch (error) {
      if (!this.disposed) this.onState({
        status: 'error',
        message: `Could not fetch the prepared HDB footprint data. ${error instanceof Error ? error.message : ''}`.trim(),
        featureCount: 0,
        skippedFeatureCount: 0,
      })
      return
    }

    if (this.disposed) return
    if (response.status === 404) {
      this.onState({
        status: 'missing',
        message: 'Prepared HDB footprints are missing. Run .venv/bin/python scripts/prepare_under_construction.py from the repository root.',
        featureCount: 0,
        skippedFeatureCount: 0,
      })
      return
    }
    if (!response.ok) {
      this.onState({ status: 'error', message: `Prepared HDB sample returned HTTP ${response.status}.`, featureCount: 0, skippedFeatureCount: 0 })
      return
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      if (!this.disposed) this.onState({ status: 'invalid', message: 'Prepared HDB footprint file is not valid JSON.', featureCount: 0, skippedFeatureCount: 0 })
      return
    }
    if (this.disposed) return

    const parsed = parseFeatureCollection(payload)
    if (!parsed.collection) {
      const empty = parsed.sourceFeatureCount === 0 && !parsed.invalidCollection
      this.onState({
        status: empty ? 'empty' : 'invalid',
        message: empty
          ? 'Prepared HDB footprint file contains no buildings.'
          : 'Prepared HDB footprint file has no valid Polygon or MultiPolygon features.',
        featureCount: 0,
        skippedFeatureCount: parsed.skippedFeatureCount,
      })
      return
    }

    try {
      this.geoJsonLayer = L.geoJSON(parsed.collection as GeoJSON.FeatureCollection, {
        style: () => ({ ...DEFAULT_STYLE }),
        onEachFeature: (feature, layer) => {
          if (!(layer instanceof L.Path)) return
          const typedFeature = feature as BuildingFeature
          const id = typedFeature.properties.building_id
          layer.options.bubblingMouseEvents = false
          this.featureLayers.set(id, layer)
          this.featuresById.set(id, typedFeature)
          if (layer instanceof L.Polyline) this.featureBoundsById.set(id, layer.getBounds())
          layer.on('click', (event: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(event)
            this.selectFeature(typedFeature)
          })
          layer.on('mouseover', () => {
            if (id !== this.selectedId) layer.setStyle({ weight: 2, fillOpacity: 0.72 })
          })
          layer.on('mouseout', () => {
            if (id !== this.selectedId) layer.setStyle(DEFAULT_STYLE)
          })
          const path = layer.getElement()
          if (path) {
            path.setAttribute('tabindex', '0')
            path.setAttribute('role', 'button')
            path.setAttribute('aria-label', `Select HDB block ${typedFeature.properties.block_number ?? 'number unavailable'}`)
            path.addEventListener('keydown', (event: Event) => {
              const keyEvent = event as KeyboardEvent
              if (keyEvent.key !== 'Enter' && keyEvent.key !== ' ') return
              event.preventDefault()
              event.stopPropagation()
              this.selectFeature(typedFeature)
            })
          }
        },
      }).addTo(this.map)

      this.onBuildingsLoaded(parsed.collection.features.map(toBuildingMetadata))
      const skipped = parsed.skippedFeatureCount
      this.onState({
        status: 'ready',
        message: skipped > 0
          ? `${skipped} invalid feature(s) were ignored; valid HDB footprints are shown.`
          : 'HDB footprints loaded. Select a building to view its identifiers.',
        featureCount: parsed.collection.features.length,
        skippedFeatureCount: skipped,
      })
    } catch (error) {
      this.onState({
        status: 'error',
        message: `Could not draw the prepared HDB footprints. ${error instanceof Error ? error.message : ''}`.trim(),
        featureCount: 0,
        skippedFeatureCount: parsed.skippedFeatureCount,
      })
    }
  }

  fitToData(): void {
    const bounds = this.geoJsonLayer?.getBounds()
    if (bounds?.isValid()) this.map.fitBounds(bounds.pad(0.12), { maxZoom: 16, animate: true, duration: 0.45 })
  }

  clearSelection(): void {
    if (!this.selectedId) return
    this.featureLayers.get(this.selectedId)?.setStyle(DEFAULT_STYLE)
    this.selectedId = null
    this.onSelect(null)
  }

  selectBuilding(buildingId: string): void {
    const building = this.featuresById.get(buildingId)
    if (!building) return
    if (this.selectedId !== buildingId) this.selectFeature(building)
    const bounds = this.featureBoundsById.get(buildingId)
    if (bounds?.isValid()) this.map.fitBounds(bounds.pad(0.3), { maxZoom: 18, animate: true, duration: 0.45 })
  }

  dispose(): void {
    this.disposed = true
    this.geoJsonLayer?.remove()
    this.geoJsonLayer = null
    this.featureLayers.clear()
    this.featuresById.clear()
    this.featureBoundsById.clear()
  }

  private selectFeature(feature: BuildingFeature): void {
    if (this.selectedId) this.featureLayers.get(this.selectedId)?.setStyle(DEFAULT_STYLE)
    const id = feature.properties.building_id
    this.selectedId = id
    this.featureLayers.get(id)?.setStyle(SELECTED_STYLE)
    this.onSelect(toBuildingMetadata(feature))
  }
}
