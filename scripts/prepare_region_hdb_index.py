#!/usr/bin/env python3
"""Prepare the HDB existing-building list grouped by URA Master Plan region."""

from __future__ import annotations

import argparse
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
DEFAULT_FOOTPRINTS_DIR = ROOT / "public/data/regions/buildings"

HDB_SOURCE_NAME = "HDB Existing Building — Housing & Development Board"
HDB_SOURCE_URL = "https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view"
REGION_SOURCE_NAME = "Master Plan 2025 Region Boundary (No Sea) — Urban Redevelopment Authority"
REGION_SOURCE_URL = "https://data.gov.sg/datasets/d_4ce0038f7ac689652350bb91b7fb92ed/view"


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


def prepare(hdb_path: Path, region_path: Path) -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
    hdb_source = load_collection(hdb_path, "HDB Existing Building")
    region_source = load_collection(region_path, "Master Plan region boundary")

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
            "footprints": [],
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

        matches[0]["buildings"].append({
            "buildingId": building_id,
            "blockNumber": str(block_number).strip(),
            "postalCode": str(postal_code).strip(),
            "streetCode": str(street_code).strip() if street_code is not None else None,
            "longitude": representative_point.x,
            "latitude": representative_point.y,
        })
        matches[0]["footprints"].append({
            "type": "Feature",
            "id": building_id,
            "geometry": mapping(geometry),
            "properties": {
                "building_id": building_id,
                "block_number": str(block_number).strip(),
                "postal_code": str(postal_code).strip(),
                "street_code": str(street_code).strip() if street_code is not None else None,
                "longitude": representative_point.x,
                "latitude": representative_point.y,
            },
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
    footprint_collections: dict[str, dict[str, Any]] = {}
    for code, region in sorted(regions.items(), key=lambda item: item[1]["name"]):
        output_regions.append({
            "code": region["code"],
            "name": region["name"],
            "geometry": region["geometry"],
            "buildingCount": len(region["buildings"]),
            "buildings": region["buildings"],
            "footprintsAsset": f"buildings/{code.lower()}.geojson",
        })
        footprint_collections[code] = {
            "type": "FeatureCollection",
            "name": f"{region['name']} existing HDB footprints",
            "metadata": {
                "source": HDB_SOURCE_NAME,
                "sourceUrl": HDB_SOURCE_URL,
                "regionSource": REGION_SOURCE_NAME,
                "regionSourceUrl": REGION_SOURCE_URL,
                "license": "Singapore Open Data Licence; see source pages for current terms.",
                "crsAssumption": "WGS 84 longitude/latitude (RFC 7946), inferred from GeoJSON coordinates; source does not declare a CRS.",
                "geometryTransformation": "Source Polygon/MultiPolygon coordinates are retained without simplification, reprojection, repair, or imputation.",
                "regionCode": code,
                "featureCount": len(region["footprints"]),
            },
            "features": region["footprints"],
        }
    return {"schemaVersion": 1, "metadata": metadata, "regions": output_regions}, footprint_collections


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hdb-input", type=Path, default=DEFAULT_HDB_INPUT)
    parser.add_argument("--region-input", type=Path, default=DEFAULT_REGION_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--footprints-dir", type=Path, default=DEFAULT_FOOTPRINTS_DIR)
    args = parser.parse_args()
    try:
        prepared, footprint_collections = prepare(args.hdb_input, args.region_input)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))

    serialized = json.dumps(prepared, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = args.output.with_suffix(args.output.suffix + ".tmp")
    temporary_path.write_text(serialized, encoding="utf-8")
    temporary_path.replace(args.output)
    args.footprints_dir.mkdir(parents=True, exist_ok=True)
    for code, collection in footprint_collections.items():
        output_path = args.footprints_dir / f"{code.lower()}.geojson"
        serialized_collection = json.dumps(collection, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
        temporary_path = output_path.with_suffix(output_path.suffix + ".tmp")
        temporary_path.write_text(serialized_collection, encoding="utf-8")
        temporary_path.replace(output_path)
    counts = prepared["metadata"]["counts"]
    print(
        f"Prepared {counts['validAssignedHdbFeatures']:,} HDB footprints across "
        f"{counts['regions']} regions; skipped {counts['skippedInvalidHdbFeatures']} invalid and "
        f"{counts['skippedUnassignedOrAmbiguousHdbFeatures']} unassigned/ambiguous records."
    )
    print(f"Output: {args.output} ({args.output.stat().st_size:,} bytes)")
    for code, collection in footprint_collections.items():
        output_path = args.footprints_dir / f"{code.lower()}.geojson"
        print(f"Footprints: {output_path} ({output_path.stat().st_size:,} bytes; {collection['metadata']['featureCount']:,} features)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
