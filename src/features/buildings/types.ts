import type { BuildingRecord } from '../../shared/contracts'
export type {
  BuildingFeature,
  BuildingFeatureCollection,
  BuildingFeatureProperties,
  BuildingGeometry,
  BuildingSourceProperties,
} from '../../shared/contracts'

/** Backward-compatible shape used by the currently implemented details panel. */
export type BuildingMetadata = Omit<BuildingRecord, 'dataSourceUrl'>

export type BuildingLayerStatus = 'loading' | 'ready' | 'missing' | 'empty' | 'invalid' | 'error'

export interface BuildingLayerState {
  status: BuildingLayerStatus
  message: string
  featureCount: number
  skippedFeatureCount: number
}

export const INITIAL_BUILDING_LAYER_STATE: BuildingLayerState = {
  status: 'loading',
  message: 'Loading the prepared HDB footprint sample…',
  featureCount: 0,
  skippedFeatureCount: 0,
}
