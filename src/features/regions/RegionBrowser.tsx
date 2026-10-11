import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, MapPinned } from 'lucide-react'
import type { RegionRecord, RegionalHdbRecord } from './types'

const PAGE_SIZE = 60

type RegionBrowserProps = {
  regions: RegionRecord[]
  status: 'loading' | 'ready' | 'error'
  errorMessage: string
  selectedRegionCode: string | null
  selectedBuildingId: string | null
  onRegionSelected: (regionCode: string | null) => void
  onBuildingSelected: (regionCode: string, building: RegionalHdbRecord) => void
}

function regionLabel(region: RegionRecord): string {
  return region.name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function RegionBrowser({
  regions,
  status,
  errorMessage,
  selectedRegionCode,
  selectedBuildingId,
  onRegionSelected,
  onBuildingSelected,
}: RegionBrowserProps) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const selectedRegion = regions.find((region) => region.code === selectedRegionCode) ?? null
  const selectedBuilding = selectedRegion?.buildings.find((building) => building.buildingId === selectedBuildingId) ?? null
  useEffect(() => {
    setQuery('')
    setPage(0)
  }, [selectedRegionCode])
  const filteredBuildings = useMemo(() => {
    if (!selectedRegion) return []
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return selectedRegion.buildings
    return selectedRegion.buildings.filter((building) =>
      building.blockNumber.toLocaleLowerCase().includes(normalizedQuery) ||
      building.postalCode.includes(normalizedQuery),
    )
  }, [query, selectedRegion])
  const pageCount = Math.max(1, Math.ceil(filteredBuildings.length / PAGE_SIZE))
  const visibleBuildings = filteredBuildings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <section className={`region-browser flex min-h-0 flex-col border-b border-[#e7eae5] bg-white ${selectedBuilding ? 'has-selected-building' : ''}`} aria-label={selectedBuilding ? `Selected block ${selectedBuilding.blockNumber} navigation` : undefined} aria-labelledby={selectedBuilding ? undefined : 'region-browser-title'}>
      {selectedRegion && status === 'ready' && selectedBuilding ? (
        <div className="shrink-0 px-5 py-3">
          <button
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#e2e7e1] bg-white px-3 text-[11px] font-medium text-[#526b59] transition hover:bg-[#f5f7f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6655]"
            type="button"
            onClick={() => onRegionSelected(selectedRegion.code)}
          >
            <ChevronLeft size={14} aria-hidden="true" /> Back to {regionLabel(selectedRegion)} blocks
          </button>
        </div>
      ) : (
        <>
      <div className="region-browser-heading shrink-0 px-5 pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#89928d]">
              <MapPinned size={12} aria-hidden="true" /> URA planning regions
            </p>
            <h2 id="region-browser-title" className="mt-1.5 text-[14px] font-semibold text-[#303936]">HDBs by region</h2>
          </div>
          <span className="rounded-full bg-[#f1f4ef] px-2.5 py-1 text-[9px] font-medium text-[#728271]">
            {status === 'ready' ? 'Existing HDB' : status}
          </span>
        </div>

        {status === 'ready' ? (
          <>
            <label className="mt-3 block text-[10px] font-medium text-[#77827b]">
              Select a region
              <select
                className="mt-1.5 h-10 w-full rounded-lg border border-[#e2e7e1] bg-[#fafbf9] px-3 text-[12px] text-[#343d39] outline-none focus:border-[#91a58f] focus:ring-2 focus:ring-[#8da68d]/15"
                value={selectedRegionCode ?? ''}
                onChange={(event) => {
                  setQuery('')
                  setPage(0)
                  onRegionSelected(event.target.value || null)
                }}
                aria-label="Select a Singapore planning region"
              >
                <option value="">Choose a region…</option>
                {regions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {regionLabel(region)} · {region.buildingCount.toLocaleString()} blocks
                  </option>
                ))}
              </select>
            </label>
            {selectedRegion && (
              <>
                {!selectedBuilding && <label className="mt-2.5 block text-[10px] font-medium text-[#77827b]">
                  Find by block or postal code
                  <input
                    className="mt-1.5 h-9 w-full rounded-lg border border-[#e2e7e1] bg-white px-3 text-[11px] outline-none placeholder:text-[#a0a8a3] focus:border-[#91a58f] focus:ring-2 focus:ring-[#8da68d]/15"
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setPage(0)
                    }}
                    placeholder="e.g. 123 or 123456"
                    aria-label={`Filter HDB blocks in ${regionLabel(selectedRegion)}`}
                  />
                </label>}
                <p className="mt-2 text-[10px] text-[#89928d]" aria-live="polite">
                  {filteredBuildings.length.toLocaleString()} of {selectedRegion.buildingCount.toLocaleString()} HDB footprint records
                </p>
              </>
            )}
          </>
        ) : (
          <p className="mt-3 rounded-lg bg-[#fafbf9] px-3 py-2.5 text-[11px] leading-relaxed text-[#78837c]" role={status === 'error' ? 'alert' : 'status'}>
            {status === 'loading' ? 'Loading regions and HDB block list…' : errorMessage}
          </p>
        )}
      </div>

      {selectedRegion && status === 'ready' && !selectedBuilding && (
        <>
          <div className="region-browser-list min-h-0 flex-1 overflow-y-auto border-t border-[#edf0eb]" aria-label={`HDB blocks in ${regionLabel(selectedRegion)}`}>
            {visibleBuildings.length ? visibleBuildings.map((building) => {
              const selected = building.buildingId === selectedBuildingId
              return (
                <button
                  className={`flex w-full items-center justify-between gap-2 border-b border-[#f0f2ee] px-5 py-2 text-left transition hover:bg-[#f5f7f3] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#3f6655] ${selected ? 'bg-[#edf3eb]' : 'bg-white'}`}
                  type="button"
                  key={building.buildingId}
                  aria-pressed={selected}
                  onClick={() => onBuildingSelected(selectedRegion.code, building)}
                >
                  <span className="min-w-0 truncate text-[11px] font-medium text-[#3c4741]">Block {building.blockNumber}</span>
                  <span className="shrink-0 font-mono text-[9px] text-[#87918b]">{building.postalCode}</span>
                </button>
              )
            }) : (
              <p className="px-5 py-5 text-[11px] text-[#78837c]">No HDB blocks match that search.</p>
            )}
          </div>
          {filteredBuildings.length > PAGE_SIZE && (
            <div className="flex shrink-0 items-center justify-between border-t border-[#edf0eb] px-4 py-2">
              <span className="text-[9px] text-[#89928d]">Page {page + 1} of {pageCount}</span>
              <div className="flex items-center gap-1">
                <button className="region-page-button" type="button" aria-label="Previous HDB list page" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
                  <ChevronLeft size={15} aria-hidden="true" />
                </button>
                <button className="region-page-button" type="button" aria-label="Next HDB list page" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          <p className="shrink-0 border-t border-[#edf0eb] px-5 py-2 text-[9px] leading-relaxed text-[#929a95]">
            Region membership is derived from each HDB footprint&apos;s representative point. URA planning boundaries are indicative.
          </p>
          <p className="shrink-0 px-5 pb-3 text-[9px] leading-relaxed text-[#929a95]">
            Sources: <a className="underline underline-offset-2" href="https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view" target="_blank" rel="noreferrer">HDB Existing Building</a>
            {' · '}<a className="underline underline-offset-2" href="https://data.gov.sg/datasets/d_4ce0038f7ac689652350bb91b7fb92ed/view" target="_blank" rel="noreferrer">URA Master Plan 2025 Region Boundary</a>
          </p>
        </>
      )}
        </>
      )}
    </section>
  )
}
