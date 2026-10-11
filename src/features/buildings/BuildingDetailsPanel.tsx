import { ArrowUpRight, Building2, ChartNoAxesColumnIncreasing, MapPin, Ruler } from 'lucide-react'

type BuildingDetailsPanelProps = {
  compact?: boolean
}

export function BuildingDetailsPanel({ compact = false }: BuildingDetailsPanelProps) {
  return (
    <div className={`details-content flex min-h-0 flex-1 flex-col ${compact ? 'is-compact' : ''}`}>
      <div className="details-heading flex items-start justify-between px-6 pb-5 pt-7">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#89928d]">Explore</p>
          <h1 className="mt-1.5 text-[20px] font-semibold tracking-[-0.045em] text-[#27302d]">Property details</h1>
        </div>
        <span className="mt-1 rounded-full border border-[#e6eae4] bg-white px-2.5 py-1 text-[10px] font-medium text-[#7b857f]">Preview</span>
      </div>

      <div className="details-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6">
        <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 shadow-[0_2px_8px_rgba(37,50,42,0.025)]">
          <div className="flex items-start justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#f0f3ed] text-[#5a755d]"><Building2 size={19} strokeWidth={1.7} aria-hidden="true" /></div>
            <span className="rounded-full bg-[#f1f4ef] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#728271]">Coming soon</span>
          </div>
          <h2 className="mt-5 text-[15px] font-semibold tracking-[-0.02em] text-[#303936]">No development selected</h2>
          <p className="mt-2 text-[12px] leading-[1.7] text-[#7b8580]">Building information will appear here when map data is connected. For now, pan and zoom around Singapore to explore the map.</p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-[#f7f8f6] px-3 py-3">
              <div className="flex items-center gap-1.5 text-[#89928d]"><MapPin size={12} aria-hidden="true" /><span className="text-[9px] font-medium uppercase tracking-[0.1em]">Location</span></div>
              <p className="mt-2 text-xs font-medium text-[#4a5550]">Singapore</p>
            </div>
            <div className="rounded-xl bg-[#f7f8f6] px-3 py-3">
              <div className="flex items-center gap-1.5 text-[#89928d]"><Ruler size={12} aria-hidden="true" /><span className="text-[9px] font-medium uppercase tracking-[0.1em]">Floor area</span></div>
              <p className="mt-2 text-xs font-medium text-[#4a5550]">—</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[#9aa29d]">Map data is not connected in this preview.</p>
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

        <div className="details-footnote mt-auto px-1 pt-1 text-[10px] leading-relaxed text-[#9aa29d]">BTO Explorer is an early preview. Information shown here is illustrative until public data is connected.</div>
      </div>
    </div>
  )
}
