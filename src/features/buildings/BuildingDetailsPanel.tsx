import { Building2, MapPin } from 'lucide-react'
import type { BuildingLayerState, BuildingMetadata } from './types'

type BuildingDetailsPanelProps = {
  compact?: boolean
  building: BuildingMetadata | null
  dataState: BuildingLayerState
}

export function BuildingDetailsPanel({ compact = false, building, dataState }: BuildingDetailsPanelProps) {
  const heading = building
    ? `Block ${building.blockNumber ?? 'number unavailable'}`
    : dataState.status === 'ready'
      ? 'Choose a footprint'
      : dataState.status === 'loading'
        ? 'Loading footprints'
        : 'Map data unavailable'

  const description = building
    ? 'Selected under-construction HDB block. The outline is sourced geometry; no building height or property information has been joined.'
    : dataState.status === 'ready'
      ? 'Choose a block from the dropdown or select a shaded footprint on the map to inspect its source identifiers.'
      : dataState.message

  return (
    <div className={`details-content flex min-h-0 flex-1 flex-col ${compact ? 'is-compact' : ''}`}>
      <div className="details-heading flex items-start justify-between px-6 pb-5 pt-7">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#89928d]">Singapore · under-construction HDB</p>
          <h1 className="mt-1.5 text-[20px] font-semibold tracking-[-0.045em] text-[#27302d]">Block details</h1>
        </div>
        <span className="mt-1 rounded-full border border-[#e6eae4] bg-white px-2.5 py-1 text-[10px] font-medium text-[#7b857f]">2D map</span>
      </div>

      <div className="details-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6">
        <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 shadow-[0_2px_8px_rgba(37,50,42,0.025)]" aria-live="polite">
          <div className="flex items-start justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#f0f3ed] text-[#5a755d]"><Building2 size={19} strokeWidth={1.7} aria-hidden="true" /></div>
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${building ? 'bg-[#edf3eb] text-[#58705b]' : 'bg-[#f1f4ef] text-[#728271]'}`}>
              {building ? 'Selected' : dataState.status === 'ready' ? `${dataState.featureCount} footprints` : dataState.status}
            </span>
          </div>
          <h2 className="mt-5 text-[15px] font-semibold tracking-[-0.02em] text-[#303936]">{heading}</h2>
          <p className="mt-2 text-[12px] leading-[1.7] text-[#7b8580]">{description}</p>

          {building && (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-[#f7f8f6] px-3 py-3">
                  <div className="flex items-center gap-1.5 text-[#89928d]"><Building2 size={12} aria-hidden="true" /><span className="text-[9px] font-medium uppercase tracking-[0.1em]">Block</span></div>
                  <p className="mt-2 text-xs font-medium text-[#4a5550]">{building.blockNumber ?? 'Not provided'}</p>
                </div>
                <div className="rounded-xl bg-[#f7f8f6] px-3 py-3">
                  <div className="flex items-center gap-1.5 text-[#89928d]"><MapPin size={12} aria-hidden="true" /><span className="text-[9px] font-medium uppercase tracking-[0.1em]">Postal code</span></div>
                  <p className="mt-2 text-xs font-medium text-[#4a5550]">{building.postalCode ?? 'Not provided'}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-3 rounded-xl bg-[#fafbf9] px-3.5 py-3.5">
                <div>
                  <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Building ID</dt>
                  <dd className="mt-1 break-all font-mono text-[10px] text-[#4a5550]">{building.buildingId}</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Representative point · longitude, latitude</dt>
                  <dd className="mt-1 text-[10px] text-[#4a5550]">{building.coordinates.longitude.toFixed(6)}, {building.coordinates.latitude.toFixed(6)}</dd>
                </div>
                <div>
                  <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Geometry</dt>
                  <dd className="mt-1 text-[10px] text-[#4a5550]">Source {building.geometry.type} footprint</dd>
                </div>
              </dl>
              <a className="mt-4 inline-flex text-[10px] font-medium text-[#526b59] underline decoration-[#bbc8bb] underline-offset-2" href={building.dataSourceUrl} target="_blank" rel="noreferrer">HDB Under Construction Buildings source</a>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-dashed border-[#e1e6df] bg-[#fafbf9] p-4">
          <p className="text-[11px] font-semibold text-[#68736d]">Move around the map</p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-[#929a95]">Drag to pan, scroll or pinch to zoom, and use the map controls to zoom or refit the footprints.</p>
        </section>

        <div className="details-footnote mt-auto px-1 pt-1 text-[10px] leading-relaxed text-[#9aa29d]">Footprints are sourced from HDB Under Construction Buildings GeoJSON. The source has block footprints but no named BTO project boundaries or official building heights.</div>
      </div>
    </div>
  )
}
