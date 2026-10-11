import { MapPin } from 'lucide-react'
import type { BuildingMetadata } from '../buildings/types'

type ProjectSearchProps = {
  buildings: BuildingMetadata[]
  selectedBuildingId: string | null
  onSelect: (buildingId: string | null) => void
}

function buildingLabel(building: BuildingMetadata): string {
  const block = building.blockNumber ? `Block ${building.blockNumber}` : 'HDB block'
  return building.postalCode ? `${block} · ${building.postalCode}` : block
}

export function ProjectSearch({ buildings, selectedBuildingId, onSelect }: ProjectSearchProps) {
  const sortedBuildings = [...buildings].sort((a, b) =>
    buildingLabel(a).localeCompare(buildingLabel(b), undefined, { numeric: true }) || a.buildingId.localeCompare(b.buildingId),
  )

  return (
    <label className="project-search relative flex h-11 w-full max-w-[390px] items-center">
      <MapPin className="pointer-events-none absolute left-3.5 text-[#929b96]" size={16} strokeWidth={1.8} aria-hidden="true" />
      <select
        className="h-full w-full appearance-none rounded-xl border border-[#e7eae5] bg-[#f8f9f7] pl-10 pr-9 text-[12px] text-[#343d39] outline-none transition focus:border-[#9eb29c] focus:bg-white focus:ring-2 focus:ring-[#8da68d]/15 disabled:cursor-wait disabled:text-[#89928c]"
        value={selectedBuildingId ?? ''}
        onChange={(event) => onSelect(event.target.value || null)}
        aria-label="Select an under-construction HDB block"
        disabled={buildings.length === 0}
      >
        <option value="">{buildings.length ? 'Select an under-construction HDB block…' : 'Loading HDB blocks…'}</option>
        {sortedBuildings.map((building) => (
          <option key={building.buildingId} value={building.buildingId}>{buildingLabel(building)}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 text-[10px] text-[#7c8781]" aria-hidden="true">▾</span>
    </label>
  )
}
