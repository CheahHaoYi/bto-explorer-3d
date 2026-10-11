import type { MultiPolygon } from 'geojson'

export interface RegionalHdbRecord {
  buildingId: string
  blockNumber: string
  postalCode: string
  streetCode: string | null
  longitude: number
  latitude: number
  yearCompleted: number | null
  maxFloorLevel: number | null
  totalDwellingUnits: number | null
  unitBreakdown: {
    oneRoomSold: number | null
    twoRoomSold: number | null
    threeRoomSold: number | null
    fourRoomSold: number | null
    fiveRoomSold: number | null
    executiveSold: number | null
    multiGenerationSold: number | null
    studioApartmentSold: number | null
  }
  propertyFlags: {
    residential: boolean | null
    commercial: boolean | null
    marketHawker: boolean | null
    miscellaneous: boolean | null
    multistoreyCarpark: boolean | null
    precinctPavilion: boolean | null
  }
}

export interface RegionRecord {
  code: string
  name: string
  geometry: MultiPolygon
  buildingCount: number
  buildings: RegionalHdbRecord[]
}

export interface RegionDataset {
  schemaVersion: 1
  metadata: {
    hdbSource: { name: string; url: string; localSnapshotDate: string | null; sourceFields: string[] }
    regionSource: { name: string; url: string; coverage: string; localRetrievalDate: string | null; sourceFields: string[] }
    propertyInformationSource: {
      name: string
      url: string
      localRetrievalDate: string | null
      sourceFields: string[]
      counts: Record<string, number>
      joinMethod: string
    }
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
