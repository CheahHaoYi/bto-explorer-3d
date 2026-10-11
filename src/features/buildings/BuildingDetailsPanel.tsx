import { Building2, MapPin } from 'lucide-react'
import type { BuildingLayerState, BuildingMetadata } from './types'
import type { RegionalHdbRecord } from '../regions/types'
import type { BlockPriceHistory } from '../prices/data'
import { PriceHistoryPanel } from '../prices/PriceHistoryPanel'

type BuildingDetailsPanelProps = {
  compact?: boolean
  building: BuildingMetadata | null
  regionalBuilding?: RegionalHdbRecord | null
  regionName?: string | null
  dataState: BuildingLayerState
  resaleHistory: BlockPriceHistory | null
  resaleStatus: 'idle' | 'loading' | 'ready' | 'error'
  resaleError?: string
}

const UNIT_TYPES: Array<[keyof RegionalHdbRecord['unitBreakdown'], string]> = [
  ['oneRoomSold', '1 room'], ['twoRoomSold', '2 room'], ['threeRoomSold', '3 room'],
  ['fourRoomSold', '4 room'], ['fiveRoomSold', '5 room'], ['executiveSold', 'Executive'],
  ['multiGenerationSold', 'Multi-generation'], ['studioApartmentSold', 'Studio apartment'],
]

const PROPERTY_FLAGS: Array<[keyof RegionalHdbRecord['propertyFlags'], string]> = [
  ['residential', 'Residential'], ['commercial', 'Commercial'], ['marketHawker', 'Market / hawker'],
  ['miscellaneous', 'Miscellaneous'], ['multistoreyCarpark', 'Multistorey car park'], ['precinctPavilion', 'Precinct pavilion'],
]

export function BuildingDetailsPanel({ compact = false, building, regionalBuilding = null, regionName = null, dataState, resaleHistory, resaleStatus, resaleError }: BuildingDetailsPanelProps) {
  const selected = building ?? regionalBuilding
  const blockNumber = building?.blockNumber ?? regionalBuilding?.blockNumber ?? null
  const postalCode = building?.postalCode ?? regionalBuilding?.postalCode ?? null
  const buildingId = building?.buildingId ?? regionalBuilding?.buildingId ?? null
  const heading = selected
    ? `Block ${blockNumber ?? 'number unavailable'}`
    : dataState.status === 'ready'
      ? 'Choose a footprint'
      : dataState.status === 'loading'
        ? 'Loading footprints'
        : 'Map data unavailable'

  const description = selected
    ? building
      ? 'Selected under-construction HDB block. Historical resale transactions are shown when the block address can be matched to source records.'
      : 'Selected existing HDB block. Historical resale transactions are shown when the block address can be matched to source records.'
    : dataState.status === 'ready'
      ? 'Choose a block from the dropdown or select a shaded footprint on the map to inspect its source identifiers.'
      : dataState.message

  return (
    <div className={`details-content flex min-h-0 flex-1 flex-col ${compact ? 'is-compact' : ''}`}>
      <div className="details-heading flex items-start justify-between px-6 pb-5 pt-7">
        <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#89928d]">Singapore{regionName ? ` · ${regionName}` : ''} · {building ? 'under-construction HDB' : regionalBuilding ? 'existing HDB' : 'HDB explorer'}</p>
          <h1 className="mt-1.5 text-[20px] font-semibold tracking-[-0.045em] text-[#27302d]">{selected ? `Block ${blockNumber ?? 'details'}` : 'Block details'}</h1>
        </div>
        <span className="mt-1 rounded-full border border-[#e6eae4] bg-white px-2.5 py-1 text-[10px] font-medium text-[#7b857f]">2D map</span>
      </div>

      <div className="details-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6">
        <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 shadow-[0_2px_8px_rgba(37,50,42,0.025)]" aria-live="polite">
          <div className="flex items-start justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#f0f3ed] text-[#5a755d]"><Building2 size={19} strokeWidth={1.7} aria-hidden="true" /></div>
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${selected ? 'bg-[#edf3eb] text-[#58705b]' : 'bg-[#f1f4ef] text-[#728271]'}`}>
              {selected ? 'Selected' : dataState.status === 'ready' ? `${dataState.featureCount} footprints` : dataState.status}
            </span>
          </div>
          <h2 className="mt-5 text-[15px] font-semibold tracking-[-0.02em] text-[#303936]">{heading}</h2>
          <p className="mt-2 text-[12px] leading-[1.7] text-[#7b8580]">{description}</p>

          {selected && (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-[#f7f8f6] px-3 py-3">
                  <div className="flex items-center gap-1.5 text-[#89928d]"><Building2 size={12} aria-hidden="true" /><span className="text-[9px] font-medium uppercase tracking-[0.1em]">Block</span></div>
                  <p className="mt-2 text-xs font-medium text-[#4a5550]">{blockNumber ?? 'Not provided'}</p>
                </div>
                <div className="rounded-xl bg-[#f7f8f6] px-3 py-3">
                  <div className="flex items-center gap-1.5 text-[#89928d]"><MapPin size={12} aria-hidden="true" /><span className="text-[9px] font-medium uppercase tracking-[0.1em]">Postal code</span></div>
                  <p className="mt-2 text-xs font-medium text-[#4a5550]">{postalCode ?? 'Not provided'}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-3 rounded-xl bg-[#fafbf9] px-3.5 py-3.5">
                <div>
                  <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Building ID</dt>
                  <dd className="mt-1 break-all font-mono text-[10px] text-[#4a5550]">{buildingId}</dd>
                </div>
                {building && <div>
                  <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Representative point · longitude, latitude</dt>
                  <dd className="mt-1 text-[10px] text-[#4a5550]">{building.coordinates.longitude.toFixed(6)}, {building.coordinates.latitude.toFixed(6)}</dd>
                </div>}
                {regionalBuilding && <div>
                  <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Representative point · longitude, latitude</dt>
                  <dd className="mt-1 text-[10px] text-[#4a5550]">{regionalBuilding.longitude.toFixed(6)}, {regionalBuilding.latitude.toFixed(6)}</dd>
                </div>}
                {regionalBuilding?.streetCode && <div>
                  <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Source street code</dt>
                  <dd className="mt-1 font-mono text-[10px] text-[#4a5550]">{regionalBuilding.streetCode}</dd>
                </div>}
                {building && <div>
                  <dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Geometry</dt>
                  <dd className="mt-1 text-[10px] text-[#4a5550]">Source {building.geometry.type} footprint</dd>
                </div>}
              </dl>
              {building && <a className="mt-4 inline-flex text-[10px] font-medium text-[#526b59] underline decoration-[#bbc8bb] underline-offset-2" href={building.dataSourceUrl} target="_blank" rel="noreferrer">HDB Under Construction Buildings source</a>}
              {regionalBuilding && <a className="mt-4 inline-flex text-[10px] font-medium text-[#526b59] underline decoration-[#bbc8bb] underline-offset-2" href="https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view" target="_blank" rel="noreferrer">HDB Existing Building source</a>}
            </>
          )}
        </section>

        {regionalBuilding && <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 shadow-[0_2px_8px_rgba(37,50,42,0.025)]" aria-labelledby="hdb-profile-title">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#89928d]">HDB Property Information</p>
          <h2 id="hdb-profile-title" className="mt-1.5 text-[14px] font-semibold text-[#303936]">Building profile</h2>
          <dl className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-[#f7f8f6] px-3 py-3"><dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Year completed</dt><dd className="mt-1 text-xs font-medium text-[#4a5550]">{regionalBuilding.yearCompleted ?? 'Unavailable'}</dd></div>
            <div className="rounded-xl bg-[#f7f8f6] px-3 py-3"><dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Highest floor · storeys</dt><dd className="mt-1 text-xs font-medium text-[#4a5550]">{regionalBuilding.maxFloorLevel ?? 'Unavailable'}</dd></div>
            <div className="col-span-2 rounded-xl bg-[#f7f8f6] px-3 py-3"><dt className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#929a95]">Total dwelling units</dt><dd className="mt-1 text-xs font-medium text-[#4a5550]">{regionalBuilding.totalDwellingUnits?.toLocaleString() ?? 'Unavailable'}</dd></div>
          </dl>
          <p className="mt-3 text-[9px] leading-relaxed text-[#929a95]">Physical height in metres is unavailable in the supplied sources. Highest floor level is shown in storeys and is not converted to a height estimate.</p>
          <h3 className="mt-4 text-[10px] font-semibold text-[#68736d]">Recorded units sold by flat type</h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
            {UNIT_TYPES.map(([key, label]) => <div key={key} className="flex items-baseline justify-between gap-2 border-b border-[#f0f2ee] py-1.5"><dt className="text-[10px] text-[#77827b]">{label}</dt><dd className="text-[10px] font-medium tabular-nums text-[#4a5550]">{regionalBuilding.unitBreakdown[key]?.toLocaleString() ?? 'Unavailable'}</dd></div>)}
          </dl>
          <h3 className="mt-4 text-[10px] font-semibold text-[#68736d]">Recorded property uses</h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
            {PROPERTY_FLAGS.map(([key, label]) => {
              const value = regionalBuilding.propertyFlags[key]
              return <div key={key} className="flex items-baseline justify-between gap-2 border-b border-[#f0f2ee] py-1.5"><dt className="text-[10px] text-[#77827b]">{label}</dt><dd className="text-[10px] font-medium text-[#4a5550]">{value === true ? 'Yes' : value === false ? 'No' : 'Unavailable'}</dd></div>
            })}
          </dl>
          <p className="mt-4 text-[9px] leading-relaxed text-[#929a95]">Unavailable values were not matched to a source record. Unit counts and property-use flags are source attributes, not estimates.</p>
          <a className="mt-3 inline-flex text-[10px] font-medium text-[#526b59] underline decoration-[#bbc8bb] underline-offset-2" href="https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view" target="_blank" rel="noreferrer">HDB Property Information source</a>
        </section>}

        <PriceHistoryPanel history={resaleHistory} status={selected ? resaleStatus : 'idle'} errorMessage={resaleError} />

        {building && <section className="rounded-2xl border border-dashed border-[#e1e6df] bg-[#fafbf9] p-4">
          <p className="text-[11px] font-semibold text-[#68736d]">Move around the map</p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-[#929a95]">Drag to pan, scroll or pinch to zoom, and use the map controls to zoom or refit the footprints.</p>
        </section>}

        {building && <div className="details-footnote mt-auto px-1 pt-1 text-[10px] leading-relaxed text-[#9aa29d]">Footprints are sourced from HDB Under Construction Buildings GeoJSON. The source has block footprints but no named BTO project boundaries or official building heights.</div>}
      </div>
    </div>
  )
}
