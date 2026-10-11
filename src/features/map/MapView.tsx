import { useEffect, useRef, useState } from 'react'
import { Compass, Minus, Plus, RotateCw } from 'lucide-react'
import { AttributionControl, Map as MapLibreMapInstance, type Map as MapLibreMap } from 'maplibre-gl'

const INITIAL_CENTER: [number, number] = [103.8198, 1.3521]
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright'

export function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    const map = new MapLibreMapInstance({
      container,
      style: MAP_STYLE,
      center: INITIAL_CENTER,
      zoom: 11.1,
      minZoom: 9,
      maxZoom: 19,
      pitch: 38,
      maxPitch: 70,
      bearing: -12,
      attributionControl: false,
    })

    map.addControl(
      new AttributionControl({
        compact: false,
      }),
      'bottom-right',
    )

    mapRef.current = map
    map.once('load', () => setMapStatus('ready'))
    map.once('error', () => {
      if (!map.isStyleLoaded()) setMapStatus('error')
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const zoomIn = () => mapRef.current?.zoomIn({ duration: 250 })
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 250 })
  const rotate = () => {
    const map = mapRef.current
    if (map) map.rotateTo(map.getBearing() + 30, { duration: 350 })
  }
  const togglePitch = () => {
    const map = mapRef.current
    if (map) map.easeTo({ pitch: map.getPitch() > 1 ? 0 : 48, duration: 450 })
  }
  const resetOrientation = () => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 500 })

  return (
    <div className="map-root absolute inset-0" id="map-controls">
      <div className="map-canvas absolute inset-0" ref={mapContainerRef} aria-label="Interactive map centered on Singapore" />
      {mapStatus === 'loading' && <div className="map-loading" role="status">Loading Singapore map…</div>}
      {mapStatus === 'error' && <div className="map-loading map-error" role="status">Map could not load. Check your connection or try another browser.</div>}
      <div className="map-control-stack absolute right-5 top-5 z-10 flex flex-col gap-2" aria-label="Map controls">
        <div className="map-control-group flex flex-col overflow-hidden rounded-xl border border-[#e2e7e1] bg-white/95 shadow-[0_4px_18px_rgba(32,45,38,0.12)] backdrop-blur-md">
          <button className="map-control-button" type="button" onClick={zoomIn} aria-label="Zoom in" title="Zoom in"><Plus size={17} aria-hidden="true" /></button>
          <span className="map-control-divider" />
          <button className="map-control-button" type="button" onClick={zoomOut} aria-label="Zoom out" title="Zoom out"><Minus size={17} aria-hidden="true" /></button>
        </div>
        <div className="map-control-group flex flex-col overflow-hidden rounded-xl border border-[#e2e7e1] bg-white/95 shadow-[0_4px_18px_rgba(32,45,38,0.12)] backdrop-blur-md">
          <button className="map-control-button" type="button" onClick={rotate} aria-label="Rotate map clockwise" title="Rotate map clockwise"><RotateCw size={16} aria-hidden="true" /></button>
          <span className="map-control-divider" />
          <button className="map-control-button" type="button" onClick={togglePitch} aria-label="Toggle map pitch" title="Toggle map pitch"><Compass size={17} aria-hidden="true" /></button>
        </div>
        <button className="map-control-button reset-control rounded-xl border border-[#e2e7e1] bg-white/95 shadow-[0_4px_18px_rgba(32,45,38,0.12)] backdrop-blur-md" type="button" onClick={resetOrientation} aria-label="Reset map orientation" title="Reset map orientation"><span className="reset-north">N</span></button>
      </div>
    </div>
  )
}
