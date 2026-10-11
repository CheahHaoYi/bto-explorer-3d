import { useEffect, useRef, useState } from 'react'
import { LocateFixed, Minus, Plus } from 'lucide-react'
import * as L from 'leaflet'
import { BuildingLayer } from './BuildingLayer'
import type { BuildingLayerState, BuildingMetadata } from '../buildings/types'

const INITIAL_CENTER: L.LatLngExpression = [1.3521, 103.8198]
const INITIAL_ZOOM = 12
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

type MapViewProps = {
  buildingLayerState: BuildingLayerState
  selectedBuildingId: string | null
  onBuildingLayerState: (state: BuildingLayerState) => void
  onBuildingSelected: (building: BuildingMetadata | null) => void
  onBuildingsLoaded: (buildings: BuildingMetadata[]) => void
}

export function MapView({ buildingLayerState, selectedBuildingId, onBuildingLayerState, onBuildingSelected, onBuildingsLoaded }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const buildingLayerRef = useRef<BuildingLayer | null>(null)
  const layerStateCallbackRef = useRef(onBuildingLayerState)
  const selectionCallbackRef = useRef(onBuildingSelected)
  const buildingsCallbackRef = useRef(onBuildingsLoaded)
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [tileError, setTileError] = useState(false)

  layerStateCallbackRef.current = onBuildingLayerState
  selectionCallbackRef.current = onBuildingSelected
  buildingsCallbackRef.current = onBuildingsLoaded

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
      </div>
    </div>
  )
}
