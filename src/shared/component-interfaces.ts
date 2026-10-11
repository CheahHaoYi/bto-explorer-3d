import type { ReactNode } from 'react'
import type { BuildingFeatureCollection, ResalePriceSummary } from './contracts'
import type { FlatType } from './contracts'

export type BuildingSelectionEvent = {
  buildingId: string | null
}

type MapDataSource =
  | { buildings: BuildingFeatureCollection; dataUrl?: never }
  | { buildings?: never; dataUrl: string }

/** Integration boundary for a map implementation; this does not implement the map. */
export type MapComponentProps = MapDataSource & {
  selectedBuildingId: string | null
  onBuildingSelection: (event: BuildingSelectionEvent) => void
}

/** summary must pass the validation described in docs/DATA_CONTRACTS.md. */
export interface PriceComponentProps {
  summary: ResalePriceSummary
  selectedFlatType: FlatType | 'ALL'
}

/** Layout-only shell. Application data and state remain with its parent. */
export interface UiShellProps {
  map: ReactNode
  sidebar: ReactNode
}
