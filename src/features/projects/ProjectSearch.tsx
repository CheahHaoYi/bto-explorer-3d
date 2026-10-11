import { Search, SlidersHorizontal } from 'lucide-react'

export function ProjectSearch() {
  return (
    <form className="project-search relative flex h-11 w-full max-w-[390px] items-center" role="search" onSubmit={(event) => event.preventDefault()}>
      <Search className="pointer-events-none absolute left-3.5 text-[#929b96]" size={16} strokeWidth={1.8} aria-hidden="true" />
      <input
        className="h-full w-full rounded-xl border border-[#e7eae5] bg-[#f8f9f7] pl-10 pr-12 text-[12px] text-[#343d39] outline-none transition placeholder:text-[#a0a8a3] focus:border-[#9eb29c] focus:bg-white focus:ring-2 focus:ring-[#8da68d]/15"
        type="search"
        name="location"
        placeholder="Search town, estate or postcode"
        aria-label="Search town, estate or postcode"
      />
      <button className="absolute right-1.5 flex size-8 items-center justify-center rounded-lg text-[#808a84] transition hover:bg-white hover:text-[#43554a] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3f6655]" type="button" aria-label="Search filters are coming soon" title="Search filters are coming soon">
        <SlidersHorizontal size={15} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </form>
  )
}
