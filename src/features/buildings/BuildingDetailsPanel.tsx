import { ArrowUpRight, Building2, ChartNoAxesColumnIncreasing, MapPin, Ruler } from 'lucide-react'
import type { BuildingLayerState, BuildingMetadata } from './types'

type BuildingDetailsPanelProps = {
  compact?: boolean
  building: BuildingMetadata | null
  dataState: BuildingLayerState
}

function formatCoordinate(value: number): string {
  return value.toFixed(6)
}

export function BuildingDetailsPanel({
  compact = false,
  building,
  dataState,
}: BuildingDetailsPanelProps) {
  const heading = building
    ? `Block ${building.blockNumber ?? '—'}`
    : dataState.status === 'ready'
      ? 'Select a building'
      : dataState.status === 'loading'
        ? 'Loading HDB footprints'
        : 'HDB footprint data unavailable'

  const description = building
    ? 'This is an existing HDB building footprint from the source dataset. No property or BTO-project data has been joined.'
    : dataState.status === 'ready'
      ? 'Tap or click a 3D footprint on the map to view its source identifiers.'
      : dataState.message

  return (
    <div className={`details-content flex min-h-0 flex-1 flex-col ${compact ? 'is-compact' : ''}`}>
      <div className="details-heading flex items-start justify-between px-6 pb-5 pt-7">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#89928d]">Explore HDB footprints</p>
          <h1 className="mt-1.5 text-[20px] font-semibold tracking-[-0.045em] text-[#27302d]">Building details</h1>
        </div>
        <span className="mt-1 rounded-full border border-[#e6eae4] bg-white px-2.5 py-1 text-[10px] font-medium text-[#7b857f]">Milestone 1</span>
      </div>

      <div className="details-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6">
        <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 shadow-[0_2px_8px_rgba(37,50,42,0.025)]">
          <div className="flex items-start justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#f0f3ed] text-[#5a755d]"><Building2 size={19} strokeWidth={1.7} aria-hidden="true" /></div>
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${building ? 'bg-[#edf3eb] text-[#58705b]' : 'bg-[#f1f4ef] text-[#728271]'}`}>
              {building ? 'Source footprint' : dataState.status === 'ready' ? 'Ready to inspect' : dataState.status}
            </span>
          </div>
          <h2 className="mt-5 text-[15px] font-semibold tracking-[-0.02em] text-[#303936]">{heading}</h2>
          <p className="mt-2 text-[12px] leading-[1.7] text-[#7b8580]">{description}</p>

          {building ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-[#f7f8f6] px-3 py-3">
                  <div className="flex items-center gap-1.5 text-[#89928d]"><Building2 size={12} aria-hidden="true" /><span className="text-[9px] font-medium uppercase tracking-[0.1em]">Block number</span></div>
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
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Map point</dt>
                    <dd className="mt-1 text-[10px] text-[#4a5550]">{formatCoordinate(building.coordinates.longitude)}, {formatCoordinate(building.coordinates.latitude)}</dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Geometry</dt>
                    <dd className="mt-1 text-[10px] text-[#4a5550]">{building.geometry.type}</dd>
                  </div>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]"><Ruler size={11} aria-hidden="true" /> Visualization height</dt>
                  <dd className="mt-1 text-[10px] text-[#4a5550]">{building.renderHeightM} m · placeholder, not official</dd>
                </div>
              </dl>
              <p className="mt-3 text-[10px] leading-relaxed text-[#89928d]">The polygon comes from the HDB Existing Building dataset. Extrusion height is a visualization-only default and is not a measured building height.</p>
              <p className="mt-2 text-[9px] text-[#a0a7a2]">{building.dataSource}</p>
            </>
          ) : (
            <div className="mt-5 rounded-xl bg-[#f7f8f6] px-3.5 py-3.5">
              <div className="flex items-center gap-1.5 text-[#89928d]"><MapPin size={12} aria-hidden="true" /><span className="text-[9px] font-medium uppercase tracking-[0.1em]">Demo layer</span></div>
              <p className="mt-2 text-xs font-medium text-[#4a5550]">Real HDB footprints · visualization-only height</p>
              <p className="mt-2 text-[10px] leading-relaxed text-[#929a95]">The dataset contains no verified building-height measurement. The extrusion height is a replaceable display default.</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 shadow-[0_2px_8px_rgba(37,50,42,0.025)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-[#f4f1e9] text-[#8d8060]"><ChartNoAxesColumnIncreasing size={16} strokeWidth={1.8} aria-hidden="true" /></span><h2 className="text-[13px] font-semibold text-[#39433e]">Price analytics</h2></div>
            <ArrowUpRight size={15} className="text-[#9aa29d]" aria-hidden="true" />
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-[#e5e9e3] bg-[#fafbf9] px-4 py-5 text-center">
            <p className="text-[11px] font-medium text-[#68736d]">A clearer view of the market</p>
            <p className="mx-auto mt-1.5 max-w-[210px] text-[10px] leading-relaxed text-[#929a95]">Historical resale trends and neighbourhood insights are planned for a future milestone.</p>
            <span className="mt-3 inline-flex rounded-full bg-[#f0f2ee] px-2.5 py-1 text-[9px] font-medium text-[#79837c]">Future feature</span>
          </div>
        </section>

        <div className="details-footnote mt-auto px-1 pt-1 text-[10px] leading-relaxed text-[#9aa29d]">Geometry and identifying fields come from HDB Existing Building. Heights are visualization placeholders; no property-data join is applied.</div>
      </div>
    </div>
  )
}
