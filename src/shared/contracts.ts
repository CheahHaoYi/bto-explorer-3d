import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'

/** GeoJSON coordinates are longitude, latitude in WGS 84 (RFC 7946). */
export type BuildingGeometry = Polygon | MultiPolygon

export interface BuildingSourceProperties {
  [key: string]: unknown
}

/** Properties attached to each prepared HDB building GeoJSON feature. */
export interface BuildingFeatureProperties {
  building_id: string
  block_number: string | null
  postal_code: string | null
  longitude: number
  latitude: number
  render_height_m: number
  height_source: 'visualization_only_default' | 'source_measurement' | 'derived_estimate'
  height_is_official: boolean
  geometry_source: string
  data_source: string
  data_source_url: string
  geometry_is_source_footprint: boolean
  source_properties: BuildingSourceProperties
}

export type BuildingFeature = Feature<BuildingGeometry, BuildingFeatureProperties>
export type BuildingFeatureCollection = FeatureCollection<BuildingGeometry, BuildingFeatureProperties>

/** Normalized building data consumed by details and selection interfaces. */
export interface BuildingRecord {
  buildingId: string
  blockNumber: string | null
  postalCode: string | null
  coordinates: { longitude: number; latitude: number }
  geometry: BuildingGeometry
  renderHeightM: number
  heightSource: BuildingFeatureProperties['height_source']
  heightIsOfficial: boolean
  dataSource: string
  dataSourceUrl: string
  sourceProperties: BuildingSourceProperties
}

export type FlatType =
  | '1 ROOM'
  | '2 ROOM'
  | '3 ROOM'
  | '4 ROOM'
  | '5 ROOM'
  | 'EXECUTIVE'
  | 'MULTI-GENERATION'

export type ProjectStatus = 'announced' | 'launched' | 'under_construction' | 'completed' | 'unknown'

/** Project coordinates must be sourced and their verification state disclosed. */
export interface ProjectRecord {
  projectId: string
  name: string
  status: ProjectStatus
  location: {
    longitude: number
    latitude: number
    verification: 'verified' | 'unverified'
    sourceName: string
    sourceUrl: string
  } | null
  sourceName: string
  sourceUrl: string
  retrievedAt: string
}

export interface ResalePriceStatistics {
  count: number
  medianSgd: number | null
  meanSgd: number | null
  minSgd: number | null
  maxSgd: number | null
}

export interface ResalePricePeriodPoint extends ResalePriceStatistics {
  period: string
}

/** Pre-aggregated observed resale transactions; this is descriptive, not a valuation. */
export interface ResalePriceSummary {
  schemaVersion: 1
  currency: 'SGD'
  geography: {
    level: 'block' | 'town' | 'planning_area'
    id: string
    label: string
  }
  transactionPeriod: { start: string; end: string }
  flatTypes: Partial<Record<FlatType, {
    statistics: ResalePriceStatistics
    history: ResalePricePeriodPoint[]
  }>>
  overall: {
    statistics: ResalePriceStatistics
    history: ResalePricePeriodPoint[]
  }
  provenance: {
    sourceName: string
    sourceUrl: string
    retrievedAt: string
    transactionDateField: string
    priceField: string
    methodology: string
  }
}
