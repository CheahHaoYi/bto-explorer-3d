import { useMemo, useState } from 'react'
import { ChartNoAxesCombined } from 'lucide-react'
import type { BlockPriceHistory } from './data'

const FLAT_TYPE_LABELS: Record<string, string> = {
  '1 ROOM': '1 room',
  '2 ROOM': '2 room',
  '3 ROOM': '3 room',
  '4 ROOM': '4 room',
  '5 ROOM': '5 room',
  EXECUTIVE: 'Executive',
  'MULTI-GENERATION': 'Multi-generation',
}

const currency = new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 })

type PriceHistoryPanelProps = {
  history: BlockPriceHistory | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  errorMessage?: string
}

export function PriceHistoryPanel({ history, status, errorMessage }: PriceHistoryPanelProps) {
  const [flatType, setFlatType] = useState('ALL')
  const options = history ? Object.keys(history.flatTypeHistory).sort((a, b) => a.localeCompare(b, 'en')) : []
  const points = useMemo(() => {
    if (!history) return []
    return flatType === 'ALL' ? history.overallHistory : history.flatTypeHistory[flatType] ?? []
  }, [flatType, history])
  const min = Math.min(...points.map((point) => point.medianSgd))
  const max = Math.max(...points.map((point) => point.medianSgd))
  const spread = Math.max(1, max - min)
  const chartPoints = points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? 150 : 14 + index * (272 / (points.length - 1)),
    y: 103 - ((point.medianSgd - min) / spread) * 82,
  }))
  const first = points[0]
  const last = points[points.length - 1]

  return (
    <section className="rounded-2xl border border-[#e7ebe5] bg-white p-5 shadow-[0_2px_8px_rgba(37,50,42,0.025)]" aria-labelledby="price-history-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#89928d]"><ChartNoAxesCombined size={12} aria-hidden="true" /> Historical resale</p>
          <h2 id="price-history-title" className="mt-1.5 text-[14px] font-semibold text-[#303936]">Block price history</h2>
        </div>
        {history && <span className="shrink-0 rounded-full bg-[#edf3eb] px-2.5 py-1 text-[9px] font-semibold text-[#58705b]">{history.transactionCount.toLocaleString()} sales</span>}
      </div>

      {status === 'loading' ? (
        <p className="mt-4 text-[11px] text-[#79847e]" role="status">Loading historical transaction data…</p>
      ) : status === 'error' ? (
        <p className="mt-4 text-[11px] leading-relaxed text-[#8a5b4d]" role="alert">{errorMessage ?? 'Historical prices could not be loaded.'}</p>
      ) : history ? (
        <>
          <label className="mt-4 block text-[10px] font-medium text-[#77827b]">
            Flat type
            <select className="mt-1.5 h-9 w-full rounded-lg border border-[#e2e7e1] bg-[#fafbf9] px-3 text-[11px] text-[#343d39] outline-none focus:border-[#91a58f] focus:ring-2 focus:ring-[#8da68d]/15" value={flatType} onChange={(event) => setFlatType(event.target.value)}>
              <option value="ALL">All flat types</option>
              {options.map((option) => <option key={option} value={option}>{FLAT_TYPE_LABELS[option] ?? option}</option>)}
            </select>
          </label>

          {points.length ? (
            <>
              <p className="mt-4 text-[10px] text-[#87918b]">Annual median transaction price · {first.year}–{last.year}</p>
              <svg className="mt-2 block h-32 w-full overflow-visible" viewBox="0 0 300 122" role="img" aria-label={`${FLAT_TYPE_LABELS[flatType] ?? (flatType === 'ALL' ? 'All flat types' : flatType)} annual median resale prices from ${first.year} to ${last.year}`}>
                <line x1="12" y1="104" x2="288" y2="104" stroke="#e8ece6" strokeWidth="1" />
                {chartPoints.length > 1 && <polyline points={chartPoints.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#66836b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                {chartPoints.map((point) => <circle key={point.year} cx={point.x} cy={point.y} r="3" fill="#66836b"><title>{point.year}: {currency.format(point.medianSgd)} median, {point.count} transactions</title></circle>)}
                {first && <text x="12" y="119" fill="#89928d" fontSize="9" textAnchor="start">{first.year}</text>}
                {last && points.length > 1 && <text x="288" y="119" fill="#89928d" fontSize="9" textAnchor="end">{last.year}</text>}
              </svg>
              <div className="mt-3 overflow-x-auto rounded-xl bg-[#f7f8f6]">
                <table className="w-full min-w-[300px] text-left text-[10px]">
                  <thead className="text-[#89928d]"><tr><th className="px-3 py-2 font-medium">Year</th><th className="px-3 py-2 font-medium">Median price</th><th className="px-3 py-2 text-right font-medium">Sales</th></tr></thead>
                  <tbody>{points.slice(-6).reverse().map((point) => <tr key={point.year} className="border-t border-[#e9ede7] text-[#46514b]"><td className="px-3 py-2">{point.year}</td><td className="px-3 py-2 font-medium">{currency.format(point.medianSgd)}</td><td className="px-3 py-2 text-right">{point.count}</td></tr>)}</tbody>
                </table>
              </div>
              <p className="mt-3 text-[9px] leading-relaxed text-[#929a95]">Historical observed transactions, aggregated as annual medians. Values are not estimates of today&apos;s flat value. 1990–Feb 2012 uses approval month; later records use registration month. Source: <a className="underline decoration-[#bbc8bb] underline-offset-2" href="https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view" target="_blank" rel="noreferrer">HDB resale flat prices</a>.</p>
            </>
          ) : (
            <p className="mt-4 text-[11px] text-[#79847e]">No transactions are available for this flat type.</p>
          )}
        </>
      ) : status === 'ready' ? (
        <p className="mt-4 text-[11px] leading-relaxed text-[#79847e]">No verified block and street match in the resale history. The map street code could not be linked unambiguously to a resale address, or this block has no recorded resale transactions.</p>
      ) : (
        <p className="mt-4 text-[11px] text-[#79847e]">Select an HDB block to load its historical resale transactions.</p>
      )}
    </section>
  )
}
