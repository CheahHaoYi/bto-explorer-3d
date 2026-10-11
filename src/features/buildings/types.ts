import type { BuildingRecord } from '../../shared/contracts'
export type {
  BuildingFeature,
  BuildingFeatureCollection,
  BuildingFeatureProperties,
  BuildingGeometry,
  BuildingSourceProperties,
} from '../../shared/contracts'

export type BuildingMetadata = BuildingRecord

export type BuildingLayerStatus = 'loading' | 'ready' | 'missing' | 'empty' | 'invalid' | 'error'

export interface BuildingLayerState {
  status: BuildingLayerStatus
  message: string
  featureCount: number
  skippedFeatureCount: number
}

export const INITIAL_BUILDING_LAYER_STATE: BuildingLayerState = {
  status: 'loading',
  message: 'Loading under-construction HDB footprints…',
  featureCount: 0,
  skippedFeatureCount: 0,
}
