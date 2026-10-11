import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Box, RotateCw, X } from 'lucide-react'
import type { BuildingGeometry } from '../../shared/contracts'
import type { RegionalHdbRecord } from '../regions/types'
import { loadBuildingFootprint } from './footprints'
import './building-model.css'

/** Observed resale statistics for one source storey-range band. */
export interface StoreyRangePricePoint {
  transactionCount: number
  medianSgd: number
  history: Array<{ year: number; medianSgd: number; count: number }>
}

export type BuildingModelExperienceProps = {
  building: RegionalHdbRecord | null
  regionCode: string | null
  /** Matches BlockPriceHistory.floorBandHistory from the resale data feature. */
  floorBandHistory: Record<string, StoreyRangePricePoint> | null
}

/** A floor count alone is insufficient to connect observed resale prices to levels. */
export function canRenderBuildingModel(building: RegionalHdbRecord | null): building is RegionalHdbRecord {
  return Boolean(building && Number.isInteger(building.maxFloorLevel) && (building.maxFloorLevel ?? 0) > 0)
}

type ModelPoint = [number, number]

function normalizeFootprint(geometry: BuildingGeometry | null, latitude: number): ModelPoint[][] {
  if (!geometry) return []
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const meters = polygons.flatMap((polygon) => polygon.map((ring) => ring.map(([longitude, lat]) => [
    longitude * 111_320 * Math.cos(latitude * Math.PI / 180),
    lat * 110_574,
  ] as ModelPoint)))
  const points = meters.flat()
  if (!points.length) return []
  const minX = Math.min(...points.map(([x]) => x))
  const maxX = Math.max(...points.map(([x]) => x))
  const minY = Math.min(...points.map(([, y]) => y))
  const maxY = Math.max(...points.map(([, y]) => y))
  const scale = 150 / Math.max(maxX - minX, maxY - minY, 0.01)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  return meters.map((ring) => ring.map(([x, y]) => [(x - centerX) * scale, (y - centerY) * scale]))
}

const money = new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 })

/**
 * Sidebar action + self-contained rotatable massing viewer. Intended integration:
 * <BuildingModelExperience building={selectedRegionalHdb} floorBandHistory={selectedBlockBands} />
 * Render beside the selected block's detail panels. It returns null until the source floor
 * count is available; the matching region footprint is fetched only when the viewer opens.
 */
export function BuildingModelExperience({ building, regionCode, floorBandHistory }: BuildingModelExperienceProps) {
  const eligible = canRenderBuildingModel(building)
  const [open, setOpen] = useState(false)
  const [yaw, setYaw] = useState(-0.42)
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null)
  const [footprint, setFootprint] = useState<BuildingGeometry | null>(null)
  const [footprintLoading, setFootprintLoading] = useState(false)
  const [footprintError, setFootprintError] = useState('')
  const drag = useRef<{ x: number; yaw: number } | null>(null)
  const openButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const closeViewer = () => {
    setOpen(false)
    setHoveredFloor(null)
    openButton.current?.focus()
  }

  useEffect(() => {
    if (open) closeButton.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open || !building || !regionCode) return
    let active = true
    setFootprint(null)
    setFootprintLoading(true)
    setFootprintError('')
    void loadBuildingFootprint(regionCode, building.buildingId).then((geometry) => {
      if (active) setFootprint(geometry)
    }).catch((error: unknown) => {
      if (active) setFootprintError(error instanceof Error ? error.message : 'Could not load this block footprint.')
    }).finally(() => {
      if (active) setFootprintLoading(false)
    })
    return () => { active = false }
  }, [open, building, regionCode])

  const floors = useMemo(() => eligible ? Array.from({ length: building.maxFloorLevel! }, (_, i) => i + 1) : [], [eligible, building])
  const footprintRings = useMemo(() => building ? normalizeFootprint(footprint, building.latitude) : [], [footprint, building])
  if (!eligible || !building) return null

  const floorHeight = Math.min(12, 300 / floors.length)
  const originX = 180
  const originY = 370
  const project = (x: number, y: number, z: number): [number, number] => {
    const rx = x * Math.cos(yaw) - y * Math.sin(yaw)
    const ry = x * Math.sin(yaw) + y * Math.cos(yaw)
    return [originX + rx, originY - z * floorHeight - ry * 0.38]
  }
  const pointList = (points: [number, number][]) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const pathForRings = (z: number) => footprintRings.map((ring) => {
    const projected = ring.map(([x, y]) => project(x, y, z))
    return `M ${pointList(projected)} Z`
  }).join(' ')
  const matchingBands = (floor: number) => Object.entries(floorBandHistory ?? {}).filter(([label]) => {
    const range = label.match(/^\s*(\d+)\s+TO\s+(\d+)\s*$/i)
    return range !== null && floor >= Number(range[1]) && floor <= Number(range[2])
  })

  return (
    <>
      <button ref={openButton} className="model-open-button" type="button" onClick={() => setOpen(true)}>
        <Box size={15} aria-hidden="true" /> Show 3D rendering
      </button>
      {open && createPortal(<div className="model-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeViewer() }}>
        <section className="model-dialog" role="dialog" aria-modal="true" aria-labelledby="model-title" onKeyDown={(event) => { if (event.key === 'Escape') closeViewer() }}>
          <header className="model-header">
            <div><p className="model-eyebrow">Source-informed massing view · Block {building.blockNumber}</p><h2 id="model-title">Explore the building form</h2></div>
            <button ref={closeButton} type="button" className="model-close" aria-label="Close 3D rendering" onClick={closeViewer}><X size={18} /></button>
          </header>
          <div className="model-content">
            <div className="model-canvas-wrap">
              <div className="model-tools">
                <span><RotateCw size={13} aria-hidden="true" /> Drag to rotate</span>
                <button type="button" onClick={() => setYaw((value) => value + Math.PI / 4)} aria-label="Rotate building">Rotate</button>
              </div>
              {footprintLoading ? <div className="model-load-state" role="status">Loading the source HDB footprint…</div> : footprintError ? <div className="model-load-state is-error" role="alert">{footprintError}</div> : footprintRings.length === 0 ? <div className="model-load-state is-error" role="alert">No source footprint was available for this block.</div> : <svg className="model-canvas" viewBox="0 0 360 420" role="group" aria-label={`Illustrative ${floors.length}-storey massing using the source HDB footprint. Drag to rotate; focus a floor to inspect resale bands.`}
                onPointerDown={(event) => { drag.current = { x: event.clientX, yaw }; event.currentTarget.setPointerCapture(event.pointerId) }}
                onPointerMove={(event) => { if (drag.current) setYaw(drag.current.yaw + (event.clientX - drag.current.x) * 0.012) }}
                onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
                onKeyDown={(event) => { if (event.key === 'ArrowLeft') setYaw((value) => value - 0.12); if (event.key === 'ArrowRight') setYaw((value) => value + 0.12) }}>
                <path d={pathForRings(0)} fill="#dfe5dc" fillRule="evenodd" opacity="0.5" />
                {floors.map((floor) => {
                  const z0 = floor - 1
                  const z1 = floor
                  const active = hoveredFloor === floor
                  const activate = () => setHoveredFloor(floor)
                  const faces = footprintRings.flatMap((ring) => ring.slice(0, -1).map((point, index) => {
                    const next = ring[index + 1]
                    const midX = (point[0] + next[0]) / 2
                    const midY = (point[1] + next[1]) / 2
                    const depth = midX * Math.sin(yaw) + midY * Math.cos(yaw)
                    return { depth, points: [project(point[0], point[1], z0), project(next[0], next[1], z0), project(next[0], next[1], z1), project(point[0], point[1], z1)] as [number, number][] }
                  })).sort((left, right) => left.depth - right.depth)
                  return <g key={floor} className={`model-floor ${active ? 'is-active' : ''}`} tabIndex={0} role="button" aria-pressed={active} aria-label={`Floor ${floor}; ${matchingBands(floor).length ? `${matchingBands(floor).length} observed resale storey-range bands` : 'no matched resale band'}`} onClick={activate} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate() } }} onMouseEnter={activate} onFocus={activate}>
                    {faces.map((face, index) => <polygon key={index} points={pointList(face.points)} fill={active ? '#a9c19f' : index % 2 ? '#92aa8c' : '#c5d3be'} stroke="#edf2e9" strokeWidth="0.65" />)}
                    {floor === floors.length && <path d={pathForRings(z1)} fill="#dce6d7" fillRule="evenodd" stroke="#edf2e9" strokeWidth="1" pointerEvents="none" />}
                    {floor % Math.max(1, Math.ceil(floors.length / 10)) === 0 && <text x={project(0, 0, floor)[0] - 17} y={project(0, 0, floor)[1] + 4} className="model-floor-label">{floor}</text>}
                  </g>
                })}
              </svg>}
              <p className="model-canvas-hint">The outline comes from the HDB GeoJSON footprint. Storey count comes from HDB Property Information; vertical scale is illustrative and is not an official height measurement.</p>
            </div>
            <aside className="model-price-panel" aria-live="polite">
              <p className="model-eyebrow">Resale observations</p>
              <h3>{hoveredFloor ? `Floor ${hoveredFloor}` : 'Select a floor'}</h3>
              {hoveredFloor && matchingBands(hoveredFloor).length > 0 ? <div className="model-band-list">
                {matchingBands(hoveredFloor).map(([range, band]) => <article className="model-band" key={range}>
                  <div className="model-band-title"><strong>{range}</strong></div>
                  <p className="model-band-price">{money.format(band.medianSgd)}</p>
                  <p className="model-band-count">Median · {band.transactionCount.toLocaleString()} observed transactions</p>
                  {band.history.length > 0 && <p className="model-band-years">Annual history: {band.history.slice(-3).map((point) => `${point.year} ${money.format(point.medianSgd)} (${point.count})`).join(' · ')}</p>}
                </article>)}
              </div> : hoveredFloor ? <p className="model-empty">No matched historical resale storey-range prices are available for this floor.</p> : <p className="model-empty">Hover or focus a floor on the model to see matching resale observations.</p>}
              <p className="model-price-note">Source records group transactions into storey ranges. Ranges can overlap, so more than one band may match a floor. Prices are observed medians for the listed range, not a floor-specific valuation.</p>
            </aside>
          </div>
        </section>
      </div>, document.body)}
    </>
  )
}
