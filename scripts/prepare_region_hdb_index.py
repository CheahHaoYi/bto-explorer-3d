#!/usr/bin/env python3
"""Prepare the HDB existing-building list grouped by URA Master Plan region."""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from typing import Any

from shapely import get_coordinates
from shapely.geometry import mapping, shape

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HDB_INPUT = ROOT / "data/raw/HDBExistingBuilding.geojson"
DEFAULT_REGION_INPUT = ROOT / "data/raw/MasterPlan2025RegionBoundaryNoSea.geojson"
DEFAULT_OUTPUT = ROOT / "public/data/regions/hdb-by-region.json"
DEFAULT_PROPERTIES_INPUT = ROOT / "data/raw/HDBPropertyInformation.csv"

HDB_SOURCE_NAME = "HDB Existing Building — Housing & Development Board"
HDB_SOURCE_URL = "https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view"
REGION_SOURCE_NAME = "Master Plan 2025 Region Boundary (No Sea) — Urban Redevelopment Authority"
REGION_SOURCE_URL = "https://data.gov.sg/datasets/d_4ce0038f7ac689652350bb91b7fb92ed/view"
PROPERTY_SOURCE_NAME = "HDB Property Information — Housing & Development Board"
PROPERTY_SOURCE_URL = "https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view"

PROPERTY_NUMERIC_FIELDS = {
    "max_floor_lvl": "maxFloorLevel",
    "year_completed": "yearCompleted",
    "total_dwelling_units": "totalDwellingUnits",
}
SOLD_UNIT_FIELDS = {
    "1room_sold": "oneRoomSold",
    "2room_sold": "twoRoomSold",
    "3room_sold": "threeRoomSold",
    "4room_sold": "fourRoomSold",
    "5room_sold": "fiveRoomSold",
    "exec_sold": "executiveSold",
    "multigen_sold": "multiGenerationSold",
    "studio_apartment_sold": "studioApartmentSold",
}
UNIT_FLAGS = {
    "residential": "residential",
    "commercial": "commercial",
    "market_hawker": "marketHawker",
    "miscellaneous": "miscellaneous",
    "multistorey_carpark": "multistoreyCarpark",
    "precinct_pavilion": "precinctPavilion",
}


def numeric_value(value: Any, field: str, *, nullable: bool = True) -> int | None:
    if value is None or str(value).strip() == "":
        if nullable:
            return None
        raise ValueError(f"Missing required numeric source value: {field}")
    source_text = str(value).strip()
    if not source_text.isascii() or not source_text.isdigit():
        raise ValueError(f"Invalid integer source value for {field}: {value!r}")
    try:
        result = int(source_text)
    except (ValueError, TypeError) as error:
        raise ValueError(f"Invalid integer source value for {field}: {value!r}") from error
    if result < 0:
        raise ValueError(f"Negative integer source value for {field}: {value!r}")
    return result


def load_property_records(path: Path) -> tuple[dict[tuple[str, str], dict[str, Any]], dict[str, Any]]:
    """Read source-supported completion, use and sold-unit fields by exact block/street."""
    records: dict[tuple[str, str], dict[str, Any]] = {}
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"blk_no", "street", *PROPERTY_NUMERIC_FIELDS, *SOLD_UNIT_FIELDS, *UNIT_FLAGS}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError(f"HDB Property Information is missing expected fields: {sorted(required - set(reader.fieldnames or []))}")
        source_rows = 0
        duplicates = 0
        for row in reader:
            source_rows += 1
            block, street = str(row.get("blk_no") or "").strip().upper(), " ".join(str(row.get("street") or "").upper().split())
            if not block or not street:
                continue
            record: dict[str, Any] = {
                key: numeric_value(row.get(source_field), source_field)
                for source_field, key in PROPERTY_NUMERIC_FIELDS.items()
            }
            record["unitBreakdown"] = {
                **{key: numeric_value(row.get(source_field), source_field) for source_field, key in SOLD_UNIT_FIELDS.items()},
            }
            record["propertyFlags"] = {}
            for source_field, key in UNIT_FLAGS.items():
                flag = str(row.get(source_field) or "").strip().upper()
                record["propertyFlags"][key] = True if flag == "Y" else False if flag == "N" else None
            pair = (block, street)
            if pair in records:
                # Exact duplicate rows are safe to collapse; conflicting records remain unavailable.
                if records[pair] != record:
                    records[pair] = {key: None for key in PROPERTY_NUMERIC_FIELDS.values()} | {
                        "unitBreakdown": {key: None for key in SOLD_UNIT_FIELDS.values()},
                        "propertyFlags": {key: None for key in UNIT_FLAGS.values()},
                    }
                duplicates += 1
            else:
                records[pair] = record
    return records, {"sourceRows": source_rows, "uniqueBlockStreetRecords": len(records), "duplicateBlockStreetRows": duplicates}


def build_enrichment_lookup(hdb_features: list[dict[str, Any]], property_records: dict[tuple[str, str], dict[str, Any]]) -> tuple[dict[tuple[str, str], dict[str, Any]], dict[str, int]]:
    """Map HDB source street codes only when all blocks have one common exact property street."""
    streets_by_block: dict[str, set[str]] = {}
    for block, street in property_records:
        streets_by_block.setdefault(block, set()).add(street)
    blocks_by_code: dict[str, set[str]] = {}
    for feature in hdb_features:
        props = feature.get("properties") if isinstance(feature, dict) else None
        if not isinstance(props, dict):
            continue
        block, code = str(props.get("BLK_NO") or "").strip().upper(), str(props.get("ST_COD") or "").strip().upper()
        if block and code:
            blocks_by_code.setdefault(code, set()).add(block)
    street_by_code: dict[str, str] = {}
    unresolved_codes = 0
    for code, blocks in blocks_by_code.items():
        candidates = [streets_by_block.get(block, set()) for block in blocks]
        if any(not streets for streets in candidates):
            unresolved_codes += 1
            continue
        common = set.intersection(*(set(streets) for streets in candidates))
        if len(common) != 1:
            unresolved_codes += 1
            continue
        street_by_code[code] = next(iter(common))
    lookup: dict[tuple[str, str], dict[str, Any]] = {}
    for code, street in street_by_code.items():
        for block in blocks_by_code[code]:
            record = property_records.get((block, street))
            if record is not None:
                lookup[(code, block)] = record
    return lookup, {
        "propertyInformationRows": len(property_records),
        "existingBuildingStreetCodes": len(blocks_by_code),
        "resolvedStreetCodes": len(street_by_code),
        "unresolvedStreetCodes": unresolved_codes,
        "matchedExistingBuildingRecords": len(lookup),
        "unmatchedExistingBuildingRecords": len(hdb_features) - len(lookup),
    }


def unavailable_enrichment() -> dict[str, Any]:
    return {
        "yearCompleted": None,
        "maxFloorLevel": None,
        "totalDwellingUnits": None,
        "unitBreakdown": {key: None for key in SOLD_UNIT_FIELDS.values()},
        "propertyFlags": {key: None for key in UNIT_FLAGS.values()},
    }


def load_collection(path: Path, label: str) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or payload.get("type") != "FeatureCollection" or not isinstance(payload.get("features"), list):
        raise ValueError(f"{label} input must be a GeoJSON FeatureCollection.")
    return payload


def finite_geometry(geometry: Any) -> bool:
    return all(
        math.isfinite(float(coordinate))
        for point in get_coordinates(geometry)
        for coordinate in point[:2]
    )


def point_is_finite(point: Any) -> bool:
    return math.isfinite(float(point.x)) and math.isfinite(float(point.y))


def prepare(hdb_path: Path, region_path: Path, properties_path: Path) -> dict[str, Any]:
    hdb_source = load_collection(hdb_path, "HDB Existing Building")
    region_source = load_collection(region_path, "Master Plan region boundary")
    property_records, property_counts = load_property_records(properties_path)
    enrichment_by_code_block, enrichment_counts = build_enrichment_lookup(hdb_source["features"], property_records)

    regions: dict[str, dict[str, Any]] = {}
    for feature in region_source["features"]:
        if not isinstance(feature, dict) or not isinstance(feature.get("properties"), dict):
            raise ValueError("Region source has a feature without properties.")
        props = feature["properties"]
        code, name = props.get("REGION_C"), props.get("REGION_N")
        if not isinstance(code, str) or not code.strip() or not isinstance(name, str) or not name.strip():
            raise ValueError("Region source is missing REGION_C or REGION_N.")
        try:
            geometry = shape(feature.get("geometry"))
        except Exception as error:
            raise ValueError(f"Could not parse source geometry for region {code}.") from error
        if geometry.geom_type not in {"Polygon", "MultiPolygon"} or geometry.is_empty or not geometry.is_valid or not finite_geometry(geometry):
            raise ValueError(f"Region {code} has invalid polygon geometry; no repair was attempted.")
        if code in regions:
            raise ValueError(f"Duplicate region code: {code}.")
        regions[code] = {
            "code": code,
            "name": name.strip(),
            "geometry": mapping(geometry),
            "_shape": geometry,
            "buildings": [],
        }
    if not regions:
        raise ValueError("No region polygons were found.")

    skipped_invalid = 0
    skipped_unassigned = 0
    seen_ids: set[str] = set()
    for feature in hdb_source["features"]:
        if not isinstance(feature, dict) or not isinstance(feature.get("properties"), dict):
            skipped_invalid += 1
            continue
        props = feature["properties"]
        try:
            geometry = shape(feature.get("geometry"))
        except Exception:
            skipped_invalid += 1
            continue
        if geometry.geom_type not in {"Polygon", "MultiPolygon"} or geometry.is_empty or not geometry.is_valid or not finite_geometry(geometry):
            skipped_invalid += 1
            continue

        source_id = props.get("ENTITYID") or props.get("OBJECTID")
        block_number = props.get("BLK_NO")
        postal_code = props.get("POSTAL_COD")
        street_code = props.get("ST_COD")
        if source_id is None or block_number is None or postal_code is None:
            skipped_invalid += 1
            continue
        building_id = f"hdb-existing-{source_id}"
        if building_id in seen_ids:
            skipped_invalid += 1
            continue
        seen_ids.add(building_id)

        representative_point = geometry.representative_point()
        if not point_is_finite(representative_point):
            skipped_invalid += 1
            continue
        matches = [region for region in regions.values() if region["_shape"].covers(representative_point)]
        if len(matches) != 1:
            skipped_unassigned += 1
            continue

        enrichment = enrichment_by_code_block.get(
            (str(street_code or "").strip().upper(), str(block_number).strip().upper()),
            unavailable_enrichment(),
        )
        matches[0]["buildings"].append({
            "buildingId": building_id,
            "blockNumber": str(block_number).strip(),
            "postalCode": str(postal_code).strip(),
            "streetCode": str(street_code).strip() if street_code is not None else None,
            "longitude": representative_point.x,
            "latitude": representative_point.y,
            **enrichment,
        })

    for region in regions.values():
        region["buildings"].sort(key=lambda building: (
            building["blockNumber"].casefold(), building["postalCode"], building["buildingId"]
        ))

    counts_by_region = {code: len(region["buildings"]) for code, region in regions.items()}
    metadata = {
        "hdbSource": {
            "name": HDB_SOURCE_NAME,
            "url": HDB_SOURCE_URL,
            "localSnapshotDate": None,
            "sourceFields": ["ENTITYID", "OBJECTID", "BLK_NO", "ST_COD", "POSTAL_COD", "geometry"],
        },
        "regionSource": {
            "name": REGION_SOURCE_NAME,
            "url": REGION_SOURCE_URL,
            "coverage": "Master Plan 2025; source data from December 2025",
            "localRetrievalDate": None,
            "sourceFields": ["REGION_C", "REGION_N", "geometry"],
        },
        "propertyInformationSource": {
            "name": PROPERTY_SOURCE_NAME,
            "url": PROPERTY_SOURCE_URL,
            "localRetrievalDate": None,
            "sourceFields": ["blk_no", "street", "max_floor_lvl", "year_completed", "total_dwelling_units", *SOLD_UNIT_FIELDS, *UNIT_FLAGS],
            "counts": property_counts | enrichment_counts,
            "joinMethod": "Property Information is joined only by exact normalized block number and a street uniquely resolved for every HDB footprint using its source ST_COD. Ambiguous or incomplete street codes are not joined.",
        },
        "license": "Singapore Open Data Licence; see source pages for current terms.",
        "crsAssumption": "WGS 84 longitude/latitude (RFC 7946), inferred from GeoJSON coordinates and Singapore bounds; neither source declares a CRS.",
        "assignmentMethod": "Each valid HDB footprint is assigned to the single region polygon that covers its Shapely representative point. Footprint geometry is not modified. Records without exactly one matching region are omitted and counted.",
        "counts": {
            "hdbSourceFeatures": len(hdb_source["features"]),
            "validAssignedHdbFeatures": sum(counts_by_region.values()),
            "skippedInvalidHdbFeatures": skipped_invalid,
            "skippedUnassignedOrAmbiguousHdbFeatures": skipped_unassigned,
            "regions": len(regions),
            "hdbByRegion": counts_by_region,
        },
    }

    output_regions = []
    for code, region in sorted(regions.items(), key=lambda item: item[1]["name"]):
        output_regions.append({
            "code": region["code"],
            "name": region["name"],
            "geometry": region["geometry"],
            "buildingCount": len(region["buildings"]),
            "buildings": region["buildings"],
        })
    return {"schemaVersion": 1, "metadata": metadata, "regions": output_regions}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hdb-input", type=Path, default=DEFAULT_HDB_INPUT)
    parser.add_argument("--region-input", type=Path, default=DEFAULT_REGION_INPUT)
    parser.add_argument("--properties-input", type=Path, default=DEFAULT_PROPERTIES_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    try:
        prepared = prepare(args.hdb_input, args.region_input, args.properties_input)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))

    serialized = json.dumps(prepared, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = args.output.with_suffix(args.output.suffix + ".tmp")
    temporary_path.write_text(serialized, encoding="utf-8")
    temporary_path.replace(args.output)
    counts = prepared["metadata"]["counts"]
    print(
        f"Prepared {counts['validAssignedHdbFeatures']:,} HDB footprints across "
        f"{counts['regions']} regions; skipped {counts['skippedInvalidHdbFeatures']} invalid and "
        f"{counts['skippedUnassignedOrAmbiguousHdbFeatures']} unassigned/ambiguous records."
    )
    print(f"Output: {args.output} ({args.output.stat().st_size:,} bytes)")
    print(f"Property-enriched existing HDB records: {prepared['metadata']['propertyInformationSource']['counts']['matchedExistingBuildingRecords']:,}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
