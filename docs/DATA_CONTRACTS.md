# Shared data contracts

This document defines the static JSON/GeoJSON boundary between offline data preparation and the browser app. The TypeScript source of truth is [`src/shared/contracts.ts`](../src/shared/contracts.ts); component prop boundaries are in [`src/shared/component-interfaces.ts`](../src/shared/component-interfaces.ts).

## General rules

- Publish only compact, derived assets needed by the static frontend under `public/data/`.
- Use UTF-8 JSON. Include a `schemaVersion` on non-GeoJSON JSON documents; change it when a breaking shape change is made.
- Include source name, source URL, retrieval date (or explicit `null` when unavailable), transformations, and relevant assumptions with published data. Do not claim a value is official if it is derived or estimated.
- Dates use ISO 8601. Price values use whole Singapore dollars (`SGD`) and counts are non-negative integers.
- Missing values are `null` or omitted as permitted by the type. Do not encode missing values as `0`, empty strings, or fabricated coordinates.
- Validate parsed JSON at its ingestion boundary before passing it to UI components. TypeScript types do not validate runtime JSON.

## Building GeoJSON

The map reads `public/data/under-construction/buildings.geojson` via `import.meta.env.BASE_URL`. It is an RFC 7946 `FeatureCollection` containing Polygon or MultiPolygon features in WGS 84 longitude/latitude order (`[longitude, latitude]`).

Each feature must provide:

| Property | Contract |
|---|---|
| `building_id` | Stable, non-empty string; unique within the collection and equal to GeoJSON `Feature.id`. |
| `block_number`, `postal_code` | Source identifiers as strings or `null` when unavailable. |
| `longitude`, `latitude` | Finite WGS 84 representative point, in valid geographic ranges. |
| `render_height_m` | Finite non-negative display extrusion height in metres. |
| `height_source`, `height_is_official` | State whether the height is sourced, estimated, or a visualization default. A default must remain explicitly non-official. |
| `geometry_source`, `data_source`, `data_source_url` | Provenance for footprint and prepared record. |
| `geometry_is_source_footprint` | `true` only when geometry traces the source footprint; transformed/simplified derivatives must be described in collection metadata. |
| `source_properties` | Original source attributes retained without being mistaken for normalized fields. |

The collection may include a top-level `metadata` object recording the source, CRS assumption, selection/simplification rules, demo-area description, and height note. Never represent an unverified BTO site with an invented point or footprint.

`BuildingRecord` is the normalized TypeScript view of a selected feature. Preserve `buildingId` across conversion; retain nullable identifiers and provenance.

## Region HDB index

The browser reads `public/data/regions/hdb-by-region.json` via `import.meta.env.BASE_URL`. It is a versioned JSON object with `schemaVersion: 1`, provenance metadata, and a `regions` array. Each region has a stable `code`, source `name`, source MultiPolygon geometry, `buildingCount`, and an HDB block list. Source HDB polygon geometries are used offline for validity checks, region assignment, and representative points; only region outlines and block points/attributes are published. A region selection displays the representative-point markers for its HDB records.

Each HDB record contains a stable source-derived ID, block number, postal code, street code when present, and a WGS 84 representative point. It may also contain `yearCompleted`, `maxFloorLevel` (storeys, not metres), `totalDwellingUnits`, `unitBreakdown` (eight sold flat-category counts), and `propertyFlags` (six source Y/N building-use values). Numeric attributes are nullable non-negative integers; use flags are boolean or `null`. Missing or ambiguous joins and blank source attributes remain `null`. `buildingCount` must equal the list length; IDs must be unique across the dataset; per-region counts in metadata must match each list; coordinates and MultiPolygon rings are validated at runtime.

`metadata.propertyInformationSource` identifies the HDB Property Information source, local retrieval-date availability, fields, conservative exact-join method, and match/unmatched counts. The join is exact normalized block number plus a street resolved uniquely for every HDB block carrying a source street code. No height in metres is asserted because no supplied source provides a verified HDB height.

The preprocessing join assigns a valid HDB existing-building footprint to the single URA region that covers its Shapely representative point. Invalid, unassigned, or multiply assigned records must be counted and omitted. Do not silently repair source geometry or infer HDB status from generic building footprints.

## Project JSON

Project data is a versioned JSON object with `schemaVersion: 1` and a `projects` array of `ProjectRecord` values. `projectId` must be stable; `status` is one of the documented enum values. `location` may be `null`. If coordinates are present, both coordinate verification and location-specific source fields are required. An `unverified` location must be visibly labeled by consuming UI; absent verification is not equivalent to verified.

## Resale summary JSON

A `ResalePriceSummary` is a pre-aggregated record for one supported geography. It describes observed transactions and is not a current valuation or price prediction.

Required validation before rendering:

1. `schemaVersion` is `1`, `currency` is `SGD`, geography has a supported level and non-empty ID/label, and `transactionPeriod.start <= transactionPeriod.end`.
2. `provenance` identifies the source, retrieval date, transaction-date field, price field, and aggregation method.
3. Every statistic count is a non-negative integer. For a zero count, all price statistics must be `null`; with observations, all five price fields must be finite, non-negative, and internally ordered (`min <= median <= max`). `meanSgd` must also be finite and non-negative.
4. Each history point has an ISO period label and valid statistics. Points are ordered oldest to newest and do not claim an interval outside the transaction period.
5. `flatTypes` contains only the declared HDB flat types. A missing type means unavailable/not included, not zero transactions.

The price UI receives a validated `ResalePriceSummary` and a selected flat type (or `ALL`). It should show sample count and covered period alongside medians and label the result as historical/derived.

## Block resale history JSON

The browser lazily reads `public/data/resale/block-history.json` through `import.meta.env.BASE_URL` when an HDB block is selected. It is a compact versioned document with `schemaVersion: 1`, `metadata`, `addresses`, and `buildingMatches`.

- `metadata.source` records the HDB resale source URL, fields, year and month coverage, retrieval-date availability, source date basis, and annual aggregation method. `metadata.streetCodeCrosswalk` records the property-information and HDB-footprint sources, exact matching rule, and match counts.
- `addresses[]` is keyed by the exact normalized `blockNumber|streetName`. `overallHistory` and each `flatTypeHistory` value contain ordered compact points `[year, medianSgd, transactionCount]`. Median amounts are rounded to whole SGD. The per-year counts in overall and flat-type histories must each sum to the address transaction count.
- `buildingMatches[]` joins `streetCode|blockNumber` from HDB building footprints to an address key. A street code is used only if all existing HDB blocks with that code have one common street-name candidate in HDB Property Information; under-construction blocks are included only when that same street code resolves and their block has that exact street in property information. Unresolved codes are omitted.
- Runtime ingestion validates the schema version, provenance, unique address/building keys, canonical address keys, known flat types, ordered annual points, non-negative prices, positive counts, and matching transaction totals. A missing building match is unavailable, not zero transactions.

This asset describes past sales. It must not be interpreted as a present-value estimate or a prediction.

## Component boundaries

- **Map:** `MapComponentProps` accepts exactly one of a `BuildingFeatureCollection` or configured `dataUrl`, a nullable selected building ID, and an `onBuildingSelection` callback. The selection event carries a stable ID or `null` when cleared. The parent owns selection state.
- **Price chart:** `PriceComponentProps` accepts validated summary data and selected flat type. It does not fetch or aggregate raw transactions.
- **UI shell:** `UiShellProps` receives `map` and `sidebar` React children. It owns responsive placement only; data fetching, selection, and analytics state stay above it.

These are integration contracts only. They do not imply that future feature modules are implemented.
