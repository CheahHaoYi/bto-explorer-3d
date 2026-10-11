import { useState } from 'react'
import { ArrowUpRight, ChevronDown, Command, Search, Sparkles } from 'lucide-react'
import { BuildingDetailsPanel } from '../features/buildings/BuildingDetailsPanel'
import { MapView } from '../features/map/MapView'
import { ProjectSearch } from '../features/projects/ProjectSearch'

export default function App() {
  const [detailsExpanded, setDetailsExpanded] = useState(false)

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

        <ProjectSearch />

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
          <MapView />
          <div className="map-context pointer-events-none absolute left-6 top-6 z-10">
            <div className="map-context-card rounded-xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_8px_28px_rgba(30,48,41,0.08)] backdrop-blur-md">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7d8882]"><span className="size-1.5 rounded-full bg-[#769177]" /> Live map</p>
              <p className="mt-1.5 text-[15px] font-semibold tracking-[-0.02em] text-[#27302d]">Singapore</p>
            </div>
          </div>
          <div className="map-caption pointer-events-none absolute bottom-5 left-6 z-10 hidden items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-[10px] text-[#68736d] shadow-sm backdrop-blur-sm sm:flex">
            <Sparkles size={13} strokeWidth={1.8} aria-hidden="true" />
            Explore the island at your own pace
          </div>
        </section>

        <aside className="desktop-sidebar relative z-10 flex w-[364px] shrink-0 flex-col border-l border-[#e7eae5] bg-[#fbfcfa]">
          <BuildingDetailsPanel />
        </aside>

        <section className={`mobile-details-panel ${detailsExpanded ? 'is-expanded' : ''}`} aria-label="Property details">
          <button
            className="mobile-panel-toggle flex w-full items-center justify-between text-left"
            type="button"
            aria-expanded={detailsExpanded}
            aria-controls="mobile-property-content"
            onClick={() => setDetailsExpanded((expanded) => !expanded)}
          >
            <span className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#eef2ec] text-[#58705b]"><Search size={16} aria-hidden="true" /></span>
              <span><span className="block text-sm font-semibold text-[#29322f]">Property details</span><span className="mt-0.5 block text-[11px] text-[#828b86]">Nothing selected yet</span></span>
            </span>
            <span className="flex size-9 items-center justify-center rounded-full text-[#66716b] transition-transform" aria-hidden="true"><ChevronDown className={detailsExpanded ? 'rotate-180' : ''} size={18} /></span>
          </button>
          <div className="mobile-panel-content" id="mobile-property-content" hidden={!detailsExpanded}>
            <BuildingDetailsPanel compact />
            <a className="mobile-explore-link inline-flex items-center gap-1.5 text-xs font-medium text-[#4d6b57]" href="#map-controls">Explore map controls <ArrowUpRight size={13} aria-hidden="true" /></a>
          </div>
        </section>
      </main>
    </div>
  )
}
