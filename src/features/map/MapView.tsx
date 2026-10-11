import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, LocateFixed, MapPinned, Minus, Plus } from 'lucide-react'
import * as L from 'leaflet'
import { BuildingLayer } from './BuildingLayer'
import type { BuildingLayerState, BuildingMetadata } from '../buildings/types'
import type { RegionRecord, RegionalHdbRecord } from '../regions/types'
import { loadRegionFootprints } from '../regions/data'

const INITIAL_CENTER: L.LatLngExpression = [1.3521, 103.8198]
const INITIAL_ZOOM = 12
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const REGION_COLORS: Record<string, string> = {
  CR: '#9bb9a3',
  ER: '#e2bc85',
  NR: '#9db9ca',
  NER: '#c5acd0',
  WR: '#d79d8a',
}
const REGIONAL_FOOTPRINT_STYLE: L.PathOptions = {
  color: '#476652', weight: 0.72, opacity: 0.88, fillColor: '#9bb79a', fillOpacity: 0.56,
}
const SELECTED_REGIONAL_FOOTPRINT_STYLE: L.PathOptions = {
  color: '#8a4937', weight: 2.2, opacity: 1, fillColor: '#d68162', fillOpacity: 0.82,
}

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
  onRegionalHdbSelected: (regionCode: string, building: RegionalHdbRecord) => void
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
  onRegionalHdbSelected,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const buildingLayerRef = useRef<BuildingLayer | null>(null)
  const regionLayerRef = useRef<L.GeoJSON | null>(null)
  const regionalFootprintsLayerRef = useRef<L.GeoJSON | null>(null)
  const regionalFootprintByIdRef = useRef(new Map<string, L.Path>())
  const selectedRegionalFootprintRef = useRef<L.Path | null>(null)
  const selectedRegionLayerRef = useRef<L.Layer | null>(null)
  const regionalHdbMarkerRef = useRef<L.CircleMarker | null>(null)
  const layerStateCallbackRef = useRef(onBuildingLayerState)
  const selectionCallbackRef = useRef(onBuildingSelected)
  const buildingsCallbackRef = useRef(onBuildingsLoaded)
  const regionSelectionCallbackRef = useRef(onRegionSelected)
  const regionalHdbSelectionCallbackRef = useRef(onRegionalHdbSelected)
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [tileError, setTileError] = useState(false)
  const [footprintsStatus, setFootprintsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [footprintsMessage, setFootprintsMessage] = useState('')
  const [regionPickerOpen, setRegionPickerOpen] = useState(false)

  layerStateCallbackRef.current = onBuildingLayerState
  selectionCallbackRef.current = onBuildingSelected
  buildingsCallbackRef.current = onBuildingsLoaded
  regionSelectionCallbackRef.current = onRegionSelected
  regionalHdbSelectionCallbackRef.current = onRegionalHdbSelected

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
        preferCanvas: true,
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
        fill: true,
        fillColor: REGION_COLORS[feature?.properties?.region_code ?? ''] ?? '#a8c0ad',
        fillOpacity: feature?.properties?.region_code === selectedRegionCode ? 0.32 : 0.2,
        dashArray: undefined,
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
    selectedRegionLayerRef.current = null
    regionLayer.eachLayer((layer) => {
      if (layer instanceof L.Path) {
        const feature = (layer as L.Path & { feature?: GeoJSON.Feature }).feature
        if (feature?.properties?.region_code === selectedRegionCode) selectedRegionLayerRef.current = layer
      }
    })
    if (!selectedRegionCode) {
      const bounds = regionLayer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.035), { maxZoom: 11, animate: false })
    }

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
        fill: true,
        fillColor: REGION_COLORS[code ?? ''] ?? '#a8c0ad',
        fillOpacity: selected ? 0.32 : 0.2,
        dashArray: undefined,
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
    regionalFootprintsLayerRef.current?.remove()
    regionalFootprintsLayerRef.current = null
    regionalFootprintByIdRef.current.clear()
    selectedRegionalFootprintRef.current = null
    if (!selectedRegionCode || !map) {
      setFootprintsStatus('idle')
      setFootprintsMessage('')
      return
    }
    const region = regions.find((candidate) => candidate.code === selectedRegionCode)
    if (!region) return
    const controller = new AbortController()
    setFootprintsStatus('loading')
    setFootprintsMessage(`Loading ${region.buildingCount.toLocaleString()} HDB footprints in ${region.name}…`)
    void loadRegionFootprints(region, controller.signal).then((collection) => {
      if (controller.signal.aborted || !mapRef.current) return
      const buildingsById = new Map(region.buildings.map((building) => [building.buildingId, building]))
      const layer = L.geoJSON(collection, {
        style: () => ({ ...REGIONAL_FOOTPRINT_STYLE }),
        onEachFeature: (feature, featureLayer) => {
          if (!(featureLayer instanceof L.Path) || typeof feature.id !== 'string') return
          const id = feature.id
          regionalFootprintByIdRef.current.set(id, featureLayer)
          featureLayer.options.bubblingMouseEvents = false
          const building = buildingsById.get(id)
          if (building) {
            featureLayer.bindTooltip(`Block ${building.blockNumber} · ${building.postalCode}`, { direction: 'auto', sticky: true })
            featureLayer.on('click', (event: L.LeafletMouseEvent) => {
              L.DomEvent.stopPropagation(event)
              regionalHdbSelectionCallbackRef.current(region.code, building)
            })
          }
        },
      }).addTo(map)
      regionalFootprintsLayerRef.current = layer
      const selectedFootprint = selectedRegionalHdb
        ? regionalFootprintByIdRef.current.get(selectedRegionalHdb.buildingId) ?? null
        : null
      selectedRegionalFootprintRef.current = selectedFootprint
      selectedFootprint?.setStyle(SELECTED_REGIONAL_FOOTPRINT_STYLE)
      setFootprintsStatus('ready')
      setFootprintsMessage(`${collection.features.length.toLocaleString()} HDB footprints shown in ${region.name}.`)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setFootprintsStatus('error')
      setFootprintsMessage(error instanceof Error ? error.message : 'Could not load this region’s HDB footprints.')
    })
    return () => {
      controller.abort()
      regionalFootprintsLayerRef.current?.remove()
      regionalFootprintsLayerRef.current = null
      regionalFootprintByIdRef.current.clear()
      selectedRegionalFootprintRef.current = null
    }
  }, [regions, selectedRegionCode])

  useEffect(() => {
    if (selectedRegionalFootprintRef.current) {
      selectedRegionalFootprintRef.current.setStyle(REGIONAL_FOOTPRINT_STYLE)
      selectedRegionalFootprintRef.current = null
    }
    if (!selectedRegionalHdb || !selectedRegionCode) return
    const selected = regionalFootprintByIdRef.current.get(selectedRegionalHdb.buildingId)
    if (!selected) return
    selected.setStyle(SELECTED_REGIONAL_FOOTPRINT_STYLE)
    selectedRegionalFootprintRef.current = selected
    selected.bringToFront()
  }, [selectedRegionalHdb, selectedRegionCode, footprintsStatus])

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
  const fitFootprints = () => {
    const map = mapRef.current
    if (!map) return
    const layer = selectedRegionCode ? selectedRegionLayerRef.current : regionLayerRef.current
    if (layer && 'getBounds' in layer && typeof layer.getBounds === 'function') {
      const bounds = layer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.06), { maxZoom: 12, animate: true, duration: 0.45 })
    } else buildingLayerRef.current?.fitToData()
  }
  const goToWholeMap = () => {
    setRegionPickerOpen(false)
    onRegionSelected(null)
    mapRef.current?.closePopup()
  }
  const chooseRegion = (regionCode: string) => {
    setRegionPickerOpen(false)
    onRegionSelected(regionCode)
  }

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
      <div className="map-view-navigation absolute left-5 top-5 z-[650] flex items-center gap-2" role="group" aria-label="Map views">
        <button className="map-view-button" type="button" onClick={goToWholeMap} aria-label="Return to whole Singapore map" title="Return to whole Singapore map">
          <ArrowLeft size={14} aria-hidden="true" /> Whole map
        </button>
        <div className="relative">
          <button className="map-view-button" type="button" disabled={regions.length === 0} aria-expanded={regionPickerOpen} aria-controls="map-region-picker" onClick={() => setRegionPickerOpen((open) => !open)}>
            <MapPinned size={14} aria-hidden="true" /> {selectedRegionCode ? 'Change region' : 'Select region'}
          </button>
          {regionPickerOpen && (
            <div className="map-region-picker absolute left-0 top-[calc(100%+8px)] min-w-56 rounded-xl border border-[#e2e7e1] bg-white p-1.5 shadow-[0_8px_28px_rgba(32,45,38,0.16)]" id="map-region-picker" role="group" aria-label="Choose a planning region">
              {regions.map((region) => (
                <button className="map-region-option" type="button" key={region.code} onClick={() => chooseRegion(region.code)}>
                  <span className="map-region-color" style={{ backgroundColor: REGION_COLORS[region.code] }} aria-hidden="true" />
                  <span>{region.name.replace(/\b\w/g, (letter) => letter.toUpperCase())}</span>
                  <span className="ml-auto text-[10px] text-[#89928d]">{region.buildingCount.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {statusMessage && <div className="map-status" role="status">{statusMessage}</div>}
      {footprintsMessage && <div className={`map-region-status ${footprintsStatus === 'error' ? 'is-error' : ''}`} role={footprintsStatus === 'error' ? 'alert' : 'status'}>{footprintsMessage}</div>}
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
        HDB footprint
        <span className="map-legend-region" aria-hidden="true" />
        Planning region
        {selectedRegionalHdb && <span className="map-legend-selected" aria-hidden="true" />}
        {selectedRegionalHdb && 'Selected HDB'}
      </div>
    </div>
  )
}
