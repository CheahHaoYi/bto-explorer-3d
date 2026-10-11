import type { MultiPolygon } from 'geojson'

export interface RegionalHdbRecord {
  buildingId: string
  blockNumber: string
  postalCode: string
  streetCode: string | null
  longitude: number
  latitude: number
}

export interface RegionRecord {
  code: string
  name: string
  geometry: MultiPolygon
  buildingCount: number
  buildings: RegionalHdbRecord[]
  footprintsAsset: string
}

export interface RegionDataset {
  schemaVersion: 1
  metadata: {
    hdbSource: { name: string; url: string; localSnapshotDate: string | null; sourceFields: string[] }
    regionSource: { name: string; url: string; coverage: string; localRetrievalDate: string | null; sourceFields: string[] }
    license: string
    crsAssumption: string
    assignmentMethod: string
    counts: {
      hdbSourceFeatures: number
      validAssignedHdbFeatures: number
      skippedInvalidHdbFeatures: number
      skippedUnassignedOrAmbiguousHdbFeatures: number
      regions: number
      hdbByRegion: Record<string, number>
    }
  }
  regions: RegionRecord[]
}
