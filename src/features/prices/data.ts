export interface AnnualPricePoint {
  year: number
  medianSgd: number
  count: number
}

export interface BlockPriceHistory {
  key: string
  blockNumber: string
  streetName: string
  transactionCount: number
  overallHistory: AnnualPricePoint[]
  flatTypeHistory: Record<string, AnnualPricePoint[]>
}

export interface ResaleHistoryDataset {
  addressesByKey: Map<string, BlockPriceHistory>
  addressKeyByBuilding: Map<string, string>
}

const DATA_URL = `${import.meta.env.BASE_URL}data/resale/block-history.json`
const FLAT_TYPES = new Set(['1 ROOM', '2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE', 'MULTI-GENERATION'])
let datasetPromise: Promise<ResaleHistoryDataset> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseHistory(value: unknown, label: string): AnnualPricePoint[] {
  if (!Array.isArray(value)) throw new Error(`${label} is not a history list.`)
  let previousYear = 0
  return value.map((item) => {
    if (!Array.isArray(item) || item.length !== 3) throw new Error(`${label} contains an invalid price point.`)
    const [year, medianSgd, count] = item
    if (!Number.isInteger(year) || (year as number) < 1990 || (year as number) > 2200 || (year as number) <= previousYear ||
        !Number.isFinite(medianSgd) || (medianSgd as number) < 0 || !Number.isInteger(count) || (count as number) < 1) {
      throw new Error(`${label} contains an invalid or unordered price point.`)
    }
    previousYear = year as number
    return { year: year as number, medianSgd: medianSgd as number, count: count as number }
  })
}

export function parseResaleHistory(payload: unknown): ResaleHistoryDataset {
  if (!isRecord(payload) || payload.schemaVersion !== 1 || !isRecord(payload.metadata) || !isRecord(payload.metadata.source) ||
      !isRecord(payload.metadata.streetCodeCrosswalk) || !isRecord(payload.metadata.counts) ||
      !Array.isArray(payload.addresses) || !Array.isArray(payload.buildingMatches)) {
    throw new Error('Resale history data has an unsupported or invalid format.')
  }
  const source = payload.metadata.source
  const crosswalk = payload.metadata.streetCodeCrosswalk
  if (typeof source.name !== 'string' || typeof source.url !== 'string' ||
      typeof source.dateBasis !== 'string' || typeof source.aggregation !== 'string' ||
      typeof crosswalk.method !== 'string' || typeof crosswalk.propertyInformationSource !== 'string' ||
      typeof crosswalk.hdbFootprintSource !== 'string') {
    throw new Error('Resale history data is missing provenance details.')
  }

  const addressesByKey = new Map<string, BlockPriceHistory>()
  for (const raw of payload.addresses) {
    if (!isRecord(raw) || typeof raw.key !== 'string' || typeof raw.blockNumber !== 'string' ||
        typeof raw.streetName !== 'string' || !Number.isInteger(raw.transactionCount) || (raw.transactionCount as number) < 1 ||
        !isRecord(raw.flatTypeHistory) || addressesByKey.has(raw.key)) {
      throw new Error('Resale history data contains an invalid or duplicate block/street record.')
    }
    const expectedKey = `${raw.blockNumber}|${raw.streetName}`
    if (raw.key !== expectedKey) throw new Error('Resale history key does not match its block and street fields.')
    const flatTypeHistory: Record<string, AnnualPricePoint[]> = {}
    for (const [flatType, history] of Object.entries(raw.flatTypeHistory)) {
      if (!FLAT_TYPES.has(flatType)) throw new Error(`Resale history contains an unknown flat type: ${flatType}.`)
      flatTypeHistory[flatType] = parseHistory(history, `${raw.key} ${flatType}`)
    }
    const overallHistory = parseHistory(raw.overallHistory, `${raw.key} overall`)
    const transactionCount = raw.transactionCount as number
    if (overallHistory.reduce((sum, point) => sum + point.count, 0) !== transactionCount) {
      throw new Error(`Resale history transaction total does not match ${raw.key}.`)
    }
    if (Object.values(flatTypeHistory).reduce((sum, history) => sum + history.reduce((count, point) => count + point.count, 0), 0) !== transactionCount) {
      throw new Error(`Resale history flat-type totals do not match ${raw.key}.`)
    }
    addressesByKey.set(raw.key, {
      key: raw.key,
      blockNumber: raw.blockNumber,
      streetName: raw.streetName,
      transactionCount,
      overallHistory,
      flatTypeHistory,
    })
  }

  const addressKeyByBuilding = new Map<string, string>()
  for (const raw of payload.buildingMatches) {
    if (!isRecord(raw) || typeof raw.streetCode !== 'string' || typeof raw.blockNumber !== 'string' ||
        typeof raw.addressKey !== 'string' || !addressesByKey.has(raw.addressKey)) {
      throw new Error('Resale history contains an invalid building match.')
    }
    const buildingKey = `${raw.streetCode}|${raw.blockNumber}`
    if (addressKeyByBuilding.has(buildingKey)) throw new Error('Resale history has a duplicate building match.')
    addressKeyByBuilding.set(buildingKey, raw.addressKey)
  }

  return { addressesByKey, addressKeyByBuilding }
}

export async function loadResaleHistory(): Promise<ResaleHistoryDataset> {
  if (!datasetPromise) {
    datasetPromise = (async () => {
      const response = await fetch(DATA_URL)
      if (!response.ok) throw new Error(`Resale history data returned HTTP ${response.status}.`)
      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        throw new Error('Resale history data is not valid JSON.')
      }
      return parseResaleHistory(payload)
    })().catch((error: unknown) => {
      datasetPromise = null
      throw error
    })
  }
  return datasetPromise
}

export function findBlockHistory(dataset: ResaleHistoryDataset, streetCode: string | null, blockNumber: string | null): BlockPriceHistory | null {
  if (!streetCode || !blockNumber) return null
  const key = dataset.addressKeyByBuilding.get(`${streetCode.trim().toUpperCase()}|${blockNumber.trim().toUpperCase()}`)
  return key ? dataset.addressesByKey.get(key) ?? null : null
}
