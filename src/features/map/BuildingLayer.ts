import type { GeoJSON } from 'geojson'
import {
  type MapLayerMouseEvent,
  type MapMouseEvent,
  type Map as MapLibreMap,
} from 'maplibre-gl'
import type {
  BuildingFeature,
  BuildingFeatureCollection,
  BuildingLayerState,
  BuildingMetadata,
} from '../buildings/types'

const SOURCE_ID = 'hdb-building-footprints'
const LAYER_ID = 'hdb-building-extrusions'
const DATA_URL = `${import.meta.env.BASE_URL}data/demo/buildings.geojson`

const MAP_PADDING = {
  top: 115,
  right: 85,
  bottom: 145,
  left: 85,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPosition(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.slice(0, 2).every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))
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
  if (!isRecord(value) || value.type !== 'Feature' || !isRecord(value.geometry)) return false
  const geometry = value.geometry
  const polygonalGeometry =
    (geometry.type === 'Polygon' && isPolygonCoordinates(geometry.coordinates)) ||
    (geometry.type === 'MultiPolygon' && isMultiPolygonCoordinates(geometry.coordinates))
  if (!polygonalGeometry || !isRecord(value.properties)) return false

  const properties = value.properties
  return (
    typeof properties.building_id === 'string' &&
    properties.building_id.length > 0 &&
    typeof properties.render_height_m === 'number' &&
    Number.isFinite(properties.render_height_m) &&
    properties.render_height_m > 0 &&
    typeof properties.longitude === 'number' &&
    Number.isFinite(properties.longitude) &&
    typeof properties.latitude === 'number' &&
    Number.isFinite(properties.latitude) &&
    properties.height_source === 'visualization_only_default' &&
    properties.height_is_official === false
  )
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
  const features = payload.features.filter(isBuildingFeature)
  if (features.length === 0) {
    return {
      collection: null,
      sourceFeatureCount,
      skippedFeatureCount: sourceFeatureCount,
      invalidCollection: sourceFeatureCount > 0,
    }
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
    coordinates: {
      longitude: properties.longitude,
      latitude: properties.latitude,
    },
    geometry: feature.geometry,
    renderHeightM: properties.render_height_m,
    heightSource: properties.height_source,
    heightIsOfficial: properties.height_is_official,
    dataSource: properties.data_source,
    sourceProperties: properties.source_properties,
  }
}

function getFeatureId(feature: BuildingFeature | undefined): string | null {
  if (!feature) return null
  const id = feature.properties.building_id || feature.id
  return id === undefined || id === null ? null : String(id)
}

export class BuildingLayer {
  private disposed = false
  private listenersAttached = false
  private selectedId: string | null = null
  private hoveredId: string | null = null

  constructor(
    private readonly map: MapLibreMap,
    private readonly onSelect: (building: BuildingMetadata | null) => void,
    private readonly onState: (state: BuildingLayerState) => void,
  ) {}

  async load(): Promise<void> {
    this.onState({
      status: 'loading',
      message: 'Loading the prepared HDB footprint sample…',
      featureCount: 0,
      skippedFeatureCount: 0,
    })

    let response: Response
    try {
      response = await fetch(DATA_URL)
    } catch (error) {
      if (!this.disposed) {
        this.onState({
          status: 'error',
          message: `Could not fetch the prepared HDB sample. ${error instanceof Error ? error.message : ''}`.trim(),
          featureCount: 0,
          skippedFeatureCount: 0,
        })
      }
      return
    }

    if (this.disposed) return
    if (response.status === 404) {
      this.onState({
        status: 'missing',
        message: `Prepared HDB footprints are missing. Run python scripts/prepare_buildings.py from the repository root to create public/data/demo/buildings.geojson.`,
        featureCount: 0,
        skippedFeatureCount: 0,
      })
      return
    }
    if (!response.ok) {
      this.onState({
        status: 'error',
        message: `The prepared HDB sample returned HTTP ${response.status}. Re-run python scripts/prepare_buildings.py and reload.`,
        featureCount: 0,
        skippedFeatureCount: 0,
      })
      return
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      if (!this.disposed) {
        this.onState({
          status: 'invalid',
          message: 'The prepared HDB file is not valid JSON. Re-run python scripts/prepare_buildings.py.',
          featureCount: 0,
          skippedFeatureCount: 0,
        })
      }
      return
    }

    if (this.disposed) return
    const parsed = parseFeatureCollection(payload)
    if (!parsed.collection) {
      const empty = parsed.sourceFeatureCount === 0 && !parsed.invalidCollection
      this.onState({
        status: empty ? 'empty' : 'invalid',
        message: empty
          ? 'The prepared HDB file contains no buildings. Re-run python scripts/prepare_buildings.py with a larger radius or another demo centre.'
          : 'The prepared HDB file has no valid Polygon or MultiPolygon features. Re-run python scripts/prepare_buildings.py.',
        featureCount: 0,
        skippedFeatureCount: parsed.skippedFeatureCount,
      })
      return
    }

    try {
      if (!this.map.getSource(SOURCE_ID)) {
        this.map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: parsed.collection as unknown as GeoJSON,
          promoteId: 'building_id',
        })
      }
      if (!this.map.getLayer(LAYER_ID)) {
        this.map.addLayer({
          id: LAYER_ID,
          type: 'fill-extrusion',
          source: SOURCE_ID,
          paint: {
            'fill-extrusion-height': ['get', 'render_height_m'],
            'fill-extrusion-base': 0,
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              '#cb7950',
              ['boolean', ['feature-state', 'hovered'], false],
              '#a2b891',
              '#6f8d78',
            ],
            'fill-extrusion-opacity': 0.92,
          },
        })
      }
      this.attachListeners()
      this.fitToDemoArea(parsed.collection)
      this.onState({
        status: 'ready',
        message:
          parsed.skippedFeatureCount > 0
            ? `${parsed.skippedFeatureCount} invalid feature(s) were ignored; valid HDB footprints are shown.`
            : 'HDB footprints loaded. Select a building to inspect its available identifiers.',
        featureCount: parsed.collection.features.length,
        skippedFeatureCount: parsed.skippedFeatureCount,
      })
    } catch (error) {
      this.onState({
        status: 'error',
        message: `Could not add the prepared HDB layer to the map. ${error instanceof Error ? error.message : ''}`.trim(),
        featureCount: 0,
        skippedFeatureCount: parsed.skippedFeatureCount,
      })
    }
  }

  dispose(): void {
    this.disposed = true
    if (this.listenersAttached) {
      this.map.off('click', LAYER_ID, this.handleBuildingClick)
      this.map.off('mousemove', LAYER_ID, this.handleBuildingMouseMove)
      this.map.off('mouseleave', LAYER_ID, this.handleBuildingMouseLeave)
      this.map.off('click', this.handleMapClick)
      this.listenersAttached = false
    }
    this.map.getCanvas().style.cursor = ''
    if (this.map.getLayer(LAYER_ID)) this.map.removeLayer(LAYER_ID)
    if (this.map.getSource(SOURCE_ID)) this.map.removeSource(SOURCE_ID)
  }

  private attachListeners(): void {
    if (this.listenersAttached) return
    this.map.on('click', LAYER_ID, this.handleBuildingClick)
    this.map.on('mousemove', LAYER_ID, this.handleBuildingMouseMove)
    this.map.on('mouseleave', LAYER_ID, this.handleBuildingMouseLeave)
    this.map.on('click', this.handleMapClick)
    this.listenersAttached = true
  }

  private fitToDemoArea(collection: BuildingFeatureCollection): void {
    const coordinates = collection.features.flatMap((feature) => {
      const geometry = feature.geometry
      const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
      return polygons.flatMap((polygon) => polygon.flatMap((ring) => ring.map(([longitude, latitude]) => [longitude, latitude] as [number, number])))
    })
    if (coordinates.length === 0) return
    let west = Number.POSITIVE_INFINITY
    let south = Number.POSITIVE_INFINITY
    let east = Number.NEGATIVE_INFINITY
    let north = Number.NEGATIVE_INFINITY
    for (const [longitude, latitude] of coordinates) {
      west = Math.min(west, longitude)
      south = Math.min(south, latitude)
      east = Math.max(east, longitude)
      north = Math.max(north, latitude)
    }
    this.map.fitBounds([[west, south], [east, north]], {
      padding: MAP_PADDING,
      maxZoom: 15,
      duration: 650,
    })
  }

  private setFeatureState(id: string, state: Record<string, boolean>): void {
    if (!this.map.getSource(SOURCE_ID)) return
    this.map.setFeatureState({ source: SOURCE_ID, id }, state)
  }

  private selectFeature(feature: BuildingFeature): void {
    const nextId = getFeatureId(feature)
    if (!nextId) return
    if (this.selectedId && this.selectedId !== nextId) {
      this.setFeatureState(this.selectedId, { selected: false })
    }
    this.selectedId = nextId
    this.setFeatureState(nextId, { selected: true })
    this.onSelect(toBuildingMetadata(feature))
    this.map.flyTo({
      center: [feature.properties.longitude, feature.properties.latitude],
      zoom: 16.5,
      pitch: 52,
      duration: 900,
    })
  }

  private clearSelection(): void {
    if (this.selectedId) this.setFeatureState(this.selectedId, { selected: false })
    this.selectedId = null
    this.onSelect(null)
  }

  private readonly handleBuildingClick = (event: MapLayerMouseEvent): void => {
    const feature = event.features?.[0] as BuildingFeature | undefined
    if (feature) this.selectFeature(feature)
  }

  private readonly handleBuildingMouseMove = (event: MapLayerMouseEvent): void => {
    const feature = event.features?.[0] as BuildingFeature | undefined
    const nextId = getFeatureId(feature)
    this.map.getCanvas().style.cursor = nextId ? 'pointer' : ''
    if (!nextId || nextId === this.hoveredId) return
    if (this.hoveredId && this.hoveredId !== this.selectedId) {
      this.setFeatureState(this.hoveredId, { hovered: false })
    }
    this.hoveredId = nextId
    this.setFeatureState(nextId, { hovered: true })
  }

  private readonly handleBuildingMouseLeave = (): void => {
    this.map.getCanvas().style.cursor = ''
    if (this.hoveredId && this.hoveredId !== this.selectedId) {
      this.setFeatureState(this.hoveredId, { hovered: false })
    }
    this.hoveredId = null
  }

  private readonly handleMapClick = (event: MapMouseEvent): void => {
    const hit = this.map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] })
    if (hit.length === 0) this.clearSelection()
  }
}
