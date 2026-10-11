import { useEffect, useRef, useState } from 'react'
import { LocateFixed, Minus, Plus } from 'lucide-react'
import * as L from 'leaflet'
import { BuildingLayer } from './BuildingLayer'
import type { BuildingLayerState, BuildingMetadata } from '../buildings/types'
import type { RegionRecord, RegionalHdbRecord } from '../regions/types'

const INITIAL_CENTER: L.LatLngExpression = [1.3521, 103.8198]
const INITIAL_ZOOM = 12
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

type MapViewProps = {
  buildingLayerState: BuildingLayerState
  selectedBuildingId: string | null
  regions: RegionRecord[]
  selectedRegionCode: string | null
  selectedRegionalHdb: RegionalHdbRecord | null
  onBuildingLayerState: (state: BuildingLayerState) => void
  onBuildingSelected: (building: BuildingMetadata | null) => void
  onBuildingsLoaded: (buildings: BuildingMetadata[]) => void
  onRegionSelected: (regionCode: string | null) => void
}

export function MapView({
  buildingLayerState,
  selectedBuildingId,
  regions,
  selectedRegionCode,
  selectedRegionalHdb,
  onBuildingLayerState,
  onBuildingSelected,
  onBuildingsLoaded,
  onRegionSelected,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const buildingLayerRef = useRef<BuildingLayer | null>(null)
  const regionLayerRef = useRef<L.GeoJSON | null>(null)
  const regionalHdbMarkerRef = useRef<L.CircleMarker | null>(null)
  const layerStateCallbackRef = useRef(onBuildingLayerState)
  const selectionCallbackRef = useRef(onBuildingSelected)
  const buildingsCallbackRef = useRef(onBuildingsLoaded)
  const regionSelectionCallbackRef = useRef(onRegionSelected)
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [tileError, setTileError] = useState(false)

  layerStateCallbackRef.current = onBuildingLayerState
  selectionCallbackRef.current = onBuildingSelected
  buildingsCallbackRef.current = onBuildingsLoaded
  regionSelectionCallbackRef.current = onRegionSelected

  useEffect(() => {
    if (selectedBuildingId) buildingLayerRef.current?.selectBuilding(selectedBuildingId)
    else buildingLayerRef.current?.clearSelection()
  }, [selectedBuildingId])

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let activeMap: L.Map | null = null
    try {
      const map = L.map(container, {
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        minZoom: 10,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: true,
        preferCanvas: false,
      })
      activeMap = map
      mapRef.current = map
      const tileLayer = L.tileLayer(TILE_URL, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      })
      tileLayer.on('tileerror', () => setTileError(true))
      tileLayer.on('tileload', () => setTileError(false))
      tileLayer.addTo(map)

      const buildingLayer = new BuildingLayer(
        map,
        (building) => selectionCallbackRef.current(building),
        (state) => layerStateCallbackRef.current(state),
        (buildings) => buildingsCallbackRef.current(buildings),
      )
      buildingLayerRef.current = buildingLayer
      map.on('click', () => buildingLayer.clearSelection())
      setMapStatus('ready')
      void buildingLayer.load()
    } catch (error) {
      activeMap?.remove()
      mapRef.current = null
      setMapStatus('error')
      layerStateCallbackRef.current({
        status: 'error',
        message: `The 2D map could not initialize. ${error instanceof Error ? error.message : ''}`.trim(),
        featureCount: 0,
        skippedFeatureCount: 0,
      })
      return
    }

    return () => {
      buildingLayerRef.current?.dispose()
      buildingLayerRef.current = null
      activeMap?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || regions.length === 0) return

    regionLayerRef.current?.remove()
    const featureCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: regions.map((region) => ({
        type: 'Feature',
        geometry: region.geometry,
        properties: { region_code: region.code, region_name: region.name },
      })),
    }
    const regionLayer = L.geoJSON(featureCollection, {
      style: (feature) => ({
        color: feature?.properties?.region_code === selectedRegionCode ? '#8a4937' : '#596f5e',
        weight: feature?.properties?.region_code === selectedRegionCode ? 2.6 : 1.5,
        opacity: feature?.properties?.region_code === selectedRegionCode ? 0.96 : 0.68,
        fill: false,
        dashArray: feature?.properties?.region_code === selectedRegionCode ? undefined : '5 4',
      }),
      onEachFeature: (feature, layer) => {
        const code = feature.properties?.region_code
        const name = feature.properties?.region_name
        if (typeof code !== 'string') return
        if (layer instanceof L.Path) layer.options.bubblingMouseEvents = false
        layer.on('click', (event: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(event)
          regionSelectionCallbackRef.current(code)
        })
        layer.bindTooltip(typeof name === 'string' ? name : code, { direction: 'auto', sticky: true })
      },
    }).addTo(map)
    regionLayerRef.current = regionLayer

    return () => {
      regionLayer.remove()
      if (regionLayerRef.current === regionLayer) regionLayerRef.current = null
    }
  }, [regions, selectedRegionCode])

  useEffect(() => {
    const map = mapRef.current
    const layer = regionLayerRef.current
    if (!map || !layer) return
    const selectedBounds: { current: L.LatLngBounds | null } = { current: null }
    layer.eachLayer((regionLayer) => {
      if (!(regionLayer instanceof L.Path)) return
      const feature = (regionLayer as L.Path & { feature?: GeoJSON.Feature }).feature
      const code = feature?.properties?.region_code
      const selected = code === selectedRegionCode
      regionLayer.setStyle({
        color: selected ? '#8a4937' : '#596f5e',
        weight: selected ? 2.6 : 1.5,
        opacity: selected ? 0.96 : 0.68,
        fill: false,
        dashArray: selected ? undefined : '5 4',
      })
      if (selected && 'getBounds' in regionLayer && typeof regionLayer.getBounds === 'function') {
        selectedBounds.current = regionLayer.getBounds()
      }
    })
    if (selectedRegionCode && selectedBounds.current?.isValid()) {
      map.fitBounds(selectedBounds.current.pad(0.06), { maxZoom: 12, animate: true, duration: 0.45 })
    }
  }, [selectedRegionCode, regions])

  useEffect(() => {
    const map = mapRef.current
    regionalHdbMarkerRef.current?.remove()
    regionalHdbMarkerRef.current = null
    if (!map || !selectedRegionalHdb) return
    const marker = L.circleMarker([selectedRegionalHdb.latitude, selectedRegionalHdb.longitude], {
      radius: 7,
      color: '#ffffff',
      weight: 2,
      fillColor: '#8a4937',
      fillOpacity: 1,
    }).addTo(map)
    marker.bindTooltip(`Existing HDB block ${selectedRegionalHdb.blockNumber}`, { direction: 'top' })
    regionalHdbMarkerRef.current = marker
    map.flyTo([selectedRegionalHdb.latitude, selectedRegionalHdb.longitude], 17, { duration: 0.55 })
    return () => {
      marker.remove()
      if (regionalHdbMarkerRef.current === marker) regionalHdbMarkerRef.current = null
    }
  }, [selectedRegionalHdb])

  const zoomIn = () => mapRef.current?.zoomIn(1, { animate: true })
  const zoomOut = () => mapRef.current?.zoomOut(1, { animate: true })
  const fitFootprints = () => buildingLayerRef.current?.fitToData()

  const statusMessage = mapStatus === 'error'
    ? buildingLayerState.message
    : mapStatus === 'loading'
      ? 'Starting the 2D Singapore map…'
      : buildingLayerState.status === 'ready'
        ? null
        : buildingLayerState.message

  return (
    <div className="map-root absolute inset-0" id="map-controls">
      <div className="map-canvas absolute inset-0" ref={mapContainerRef} role="region" aria-label="Interactive 2D map of Singapore" />
      {statusMessage && <div className="map-status" role="status">{statusMessage}</div>}
      {tileError && mapStatus === 'ready' && (
        <div className="map-tile-warning" role="status">Street map tiles are unavailable. HDB outlines can still be explored.</div>
      )}
      <div className="map-control-stack absolute right-5 top-5 z-[500] flex flex-col gap-2" role="group" aria-label="Map controls">
        <div className="map-control-group flex flex-col overflow-hidden rounded-xl border border-[#e2e7e1] bg-white/95 shadow-[0_4px_18px_rgba(32,45,38,0.12)] backdrop-blur-md">
          <button className="map-control-button" type="button" onClick={zoomIn} aria-label="Zoom in" title="Zoom in"><Plus size={17} aria-hidden="true" /></button>
          <span className="map-control-divider" />
          <button className="map-control-button" type="button" onClick={zoomOut} aria-label="Zoom out" title="Zoom out"><Minus size={17} aria-hidden="true" /></button>
        </div>
        <button className="map-control-button reset-control rounded-xl border border-[#e2e7e1] bg-white/95 shadow-[0_4px_18px_rgba(32,45,38,0.12)] backdrop-blur-md" type="button" onClick={fitFootprints} aria-label="Show all HDB footprints" title="Show all HDB footprints"><LocateFixed size={16} aria-hidden="true" /></button>
      </div>
      <div className="map-legend absolute bottom-5 left-5 z-[400] flex items-center gap-2 rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-[10px] text-[#68736d] shadow-sm backdrop-blur-sm">
        <span className="map-legend-swatch" aria-hidden="true" />
        HDB building footprint
        <span className="map-legend-region" aria-hidden="true" />
        Region boundary
        {selectedRegionalHdb && <span className="map-legend-selected" aria-hidden="true" />}
        {selectedRegionalHdb && 'Selected HDB'}
      </div>
    </div>
  )
}
