import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, Command, Map, Search, Sparkles } from 'lucide-react'
import { BuildingDetailsPanel } from '../features/buildings/BuildingDetailsPanel'
import { INITIAL_BUILDING_LAYER_STATE, type BuildingLayerState, type BuildingMetadata } from '../features/buildings/types'
import { MapView } from '../features/map/MapView'
import { ProjectSearch } from '../features/projects/ProjectSearch'
import { loadRegionDataset } from '../features/regions/data'
import type { RegionRecord, RegionalHdbRecord } from '../features/regions/types'
import { findBlockHistory, loadResaleHistory, type BlockPriceHistory } from '../features/prices/data'

export default function App() {
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingMetadata | null>(null)
  const [availableBuildings, setAvailableBuildings] = useState<BuildingMetadata[]>([])
  const [buildingLayerState, setBuildingLayerState] = useState<BuildingLayerState>(INITIAL_BUILDING_LAYER_STATE)
  const [regions, setRegions] = useState<RegionRecord[]>([])
  const [selectedRegionCode, setSelectedRegionCode] = useState<string | null>(null)
  const [selectedRegionalHdb, setSelectedRegionalHdb] = useState<{ regionCode: string; building: RegionalHdbRecord } | null>(null)
  const [resaleHistory, setResaleHistory] = useState<BlockPriceHistory | null>(null)
  const [resaleStatus, setResaleStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [resaleError, setResaleError] = useState('')

  useEffect(() => {
    let active = true
    void loadRegionDataset().then((dataset) => {
      if (!active) return
      setRegions(dataset.regions)
    }).catch(() => {
      if (!active) return
      setRegions([])
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const blockNumber = selectedBuilding?.blockNumber ?? selectedRegionalHdb?.building.blockNumber ?? null
    const sourceStreetCode = selectedBuilding?.sourceProperties.ST_COD
    const streetCode = selectedRegionalHdb?.building.streetCode ?? (typeof sourceStreetCode === 'string' ? sourceStreetCode : null)
    if (!blockNumber || !streetCode) {
      setResaleHistory(null)
      setResaleStatus(selectedBuilding || selectedRegionalHdb ? 'ready' : 'idle')
      setResaleError('')
      return
    }
    let active = true
    setResaleHistory(null)
    setResaleStatus('loading')
    setResaleError('')
    void loadResaleHistory().then((dataset) => {
      if (!active) return
      setResaleHistory(findBlockHistory(dataset, streetCode, blockNumber))
      setResaleStatus('ready')
    }).catch((error: unknown) => {
      if (!active) return
      setResaleStatus('error')
      setResaleError(error instanceof Error ? error.message : 'Could not load historical resale data.')
    })
    return () => { active = false }
  }, [selectedBuilding, selectedRegionalHdb])

  const selectRegion = (regionCode: string | null) => {
    setSelectedRegionCode(regionCode)
    setSelectedRegionalHdb(null)
    setSelectedBuilding(null)
    setDetailsExpanded(false)
  }

  const selectRegionalHdb = (regionCode: string, building: RegionalHdbRecord) => {
    setSelectedRegionCode(regionCode)
    setSelectedRegionalHdb({ regionCode, building })
    setSelectedBuilding(null)
    setDetailsExpanded(true)
  }

  const selectBuilding = (building: BuildingMetadata | null) => {
    setSelectedBuilding(building)
    if (building) {
      setSelectedRegionalHdb(null)
      setDetailsExpanded(true)
    } else {
      setDetailsExpanded(false)
    }
  }

  const hasSelectedBlock = Boolean(selectedBuilding || selectedRegionalHdb)
  const returnToRegion = () => {
    if (selectedRegionCode) selectRegion(selectedRegionCode)
  }
  const returnToWholeMap = () => selectRegion(null)

  const selectedRegion = regions.find((region) => region.code === selectedRegionCode)
  const mobileDetailsSummary = selectedRegionalHdb
    ? `${selectedRegion?.name ?? 'Region'} · Block ${selectedRegionalHdb.building.blockNumber}`
    : selectedRegion
      ? `${selectedRegion.name} · ${selectedRegion.buildingCount.toLocaleString()} HDB blocks`
      : selectedBuilding
    ? `Block ${selectedBuilding.blockNumber ?? '—'} selected`
    : buildingLayerState.status === 'ready'
      ? 'Choose a region or tap a building'
      : buildingLayerState.status === 'loading'
        ? 'Loading under-construction HDB blocks…'
        : 'HDB footprint data unavailable'

  return (
    <div className="app-shell flex h-svh min-h-[540px] flex-col overflow-hidden bg-[#f7f8f6] text-[#222b2a]">
      <header className="app-header z-20 flex shrink-0 items-center justify-between gap-6 border-b border-[#e7eae5] bg-white/95 px-7 backdrop-blur-xl">
        <a className="brand-lockup flex min-w-0 items-center gap-3" href={import.meta.env.BASE_URL} aria-label="BTO Explorer 3D home">
          <img className="brand-mark size-10 shrink-0" src={`${import.meta.env.BASE_URL}bto-mark.svg`} alt="" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-[-0.035em] text-[#202827]">BTO Explorer <span className="font-normal text-[#79817d]">3D</span></p>
            <p className="brand-subtitle mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[#909994]">Singapore housing, in context</p>
          </div>
        </a>

        <ProjectSearch
          buildings={availableBuildings}
          selectedBuildingId={selectedBuilding?.buildingId ?? null}
          onSelect={(buildingId) => selectBuilding(buildingId ? availableBuildings.find((building) => building.buildingId === buildingId) ?? null : null)}
        />

        <div className="header-actions flex shrink-0 items-center gap-3">
          <span className="desktop-status hidden items-center gap-2 rounded-full border border-[#e7ebe6] bg-[#fafbf9] px-3 py-2 text-[11px] font-medium text-[#69736e] sm:flex">
            <span className="size-1.5 rounded-full bg-[#7e9b79]" />
            Preview workspace
          </span>
          <button className="help-button flex size-10 items-center justify-center rounded-full border border-[#e7eae5] text-[#59625e] transition hover:bg-[#f4f6f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f6655]" type="button" aria-label="About this preview" title="About this preview">
            <Command size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="workspace relative flex min-h-0 flex-1">
        <section className="map-stage relative min-w-0 flex-1" aria-label="Map of Singapore">
          <MapView
            buildingLayerState={buildingLayerState}
            selectedBuildingId={selectedBuilding?.buildingId ?? null}
            regions={regions}
            selectedRegionCode={selectedRegionCode}
            selectedRegionalHdb={selectedRegionalHdb?.building ?? null}
            onBuildingLayerState={setBuildingLayerState}
            onBuildingSelected={(building) => {
              setSelectedBuilding(building)
              if (building) {
                setSelectedRegionalHdb(null)
                setDetailsExpanded(true)
              }
            }}
            onBuildingsLoaded={setAvailableBuildings}
            onRegionSelected={selectRegion}
            onRegionalHdbSelected={selectRegionalHdb}
          />
          <div className="map-caption pointer-events-none absolute bottom-5 left-6 z-10 hidden items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-[10px] text-[#68736d] shadow-sm backdrop-blur-sm sm:flex">
            <Sparkles size={13} strokeWidth={1.8} aria-hidden="true" />
            Explore the island at your own pace
          </div>
        </section>

        {hasSelectedBlock && <aside className="desktop-sidebar relative z-10 flex w-[364px] shrink-0 flex-col border-l border-[#e7eae5] bg-[#fbfcfa]" aria-label="Selected HDB block details">
          <div className="flex shrink-0 items-center gap-2 border-b border-[#e7eae5] bg-white px-5 py-3">
            {selectedRegionCode && <button className="sidebar-navigation-button" type="button" onClick={returnToRegion}>
              <ChevronLeft size={14} aria-hidden="true" /> Back to {selectedRegion?.name ?? 'region'}
            </button>}
            <button className="sidebar-navigation-button" type="button" onClick={returnToWholeMap}>
              <Map size={13} aria-hidden="true" /> Whole map
            </button>
          </div>
          <BuildingDetailsPanel
            building={selectedBuilding}
            regionalBuilding={selectedRegionalHdb?.building ?? null}
            regionCode={selectedRegionalHdb?.regionCode ?? null}
            regionName={selectedRegion?.name ?? null}
            dataState={buildingLayerState}
            resaleHistory={resaleHistory}
            resaleStatus={resaleStatus}
            resaleError={resaleError}
          />
        </aside>}

        {hasSelectedBlock && <section className={`mobile-details-panel ${detailsExpanded ? 'is-expanded' : ''}`} aria-label="Property details">
          <button
            className="mobile-panel-toggle flex w-full items-center justify-between text-left"
            type="button"
            aria-expanded={detailsExpanded}
            aria-controls="mobile-property-content"
            onClick={() => setDetailsExpanded((expanded) => !expanded)}
          >
            <span className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#eef2ec] text-[#58705b]"><Search size={16} aria-hidden="true" /></span>
                <span><span className="block text-sm font-semibold text-[#29322f]">Explore HDBs</span><span className="mt-0.5 block text-[11px] text-[#828b86]" aria-live="polite">{mobileDetailsSummary}</span></span>
            </span>
            <span className="flex size-9 items-center justify-center rounded-full text-[#66716b] transition-transform" aria-hidden="true"><ChevronDown className={detailsExpanded ? 'rotate-180' : ''} size={18} /></span>
          </button>
          <div className="mobile-panel-content" id="mobile-property-content" hidden={!detailsExpanded}>
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedRegionCode && <button className="sidebar-navigation-button" type="button" onClick={returnToRegion}><ChevronLeft size={14} aria-hidden="true" /> Back to {selectedRegion?.name ?? 'region'}</button>}
              <button className="sidebar-navigation-button" type="button" onClick={returnToWholeMap}><Map size={13} aria-hidden="true" /> Whole map</button>
            </div>
            <BuildingDetailsPanel
              compact
              building={selectedBuilding}
              regionalBuilding={selectedRegionalHdb?.building ?? null}
              regionCode={selectedRegionalHdb?.regionCode ?? null}
              regionName={selectedRegion?.name ?? null}
              dataState={buildingLayerState}
              resaleHistory={resaleHistory}
              resaleStatus={resaleStatus}
              resaleError={resaleError}
            />
          </div>
        </section>}
      </main>
    </div>
  )
}
