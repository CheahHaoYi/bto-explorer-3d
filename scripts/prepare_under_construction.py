#!/usr/bin/env python3
"""Prepare the supplied HDB under-construction footprints for the static map."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

from shapely import get_coordinates
from shapely.geometry import mapping, shape

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data/raw/HDBUnderConstructionBuildings.geojson"
DEFAULT_OUTPUT = ROOT / "public/data/under-construction/buildings.geojson"
SOURCE_NAME = "HDB Under Construction Buildings — data.gov.sg (Housing & Development Board)"
SOURCE_URL = "https://data.gov.sg/datasets/d_e4aaf26891bfe398666f7a96fe81a972/view"


def finite_geometry(geometry: Any) -> bool:
    return all(
        math.isfinite(float(coordinate))
        for point in get_coordinates(geometry)
        for coordinate in point[:2]
    )


def prepare(input_path: Path) -> dict[str, Any]:
    raw = json.loads(input_path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict) or raw.get("type") != "FeatureCollection" or not isinstance(raw.get("features"), list):
        raise ValueError("Input must be a GeoJSON FeatureCollection.")

    output_features = []
    skipped = 0
    seen_ids: set[str] = set()
    for feature in raw["features"]:
        if not isinstance(feature, dict) or not isinstance(feature.get("properties"), dict):
            skipped += 1
            continue
        properties = feature["properties"]
        try:
            geometry = shape(feature.get("geometry"))
        except Exception:
            skipped += 1
            continue
        if geometry.geom_type not in {"Polygon", "MultiPolygon"} or geometry.is_empty or not geometry.is_valid or not finite_geometry(geometry):
            skipped += 1
            continue

        source_id = properties.get("ENTITYID") or properties.get("OBJECTID")
        if source_id is None:
            skipped += 1
            continue
        building_id = f"hdb-under-construction-{source_id}"
        if building_id in seen_ids:
            skipped += 1
            continue
        seen_ids.add(building_id)
        point = geometry.representative_point()
        block = str(properties["BLK_NO"]).strip() if properties.get("BLK_NO") is not None else None
        postal = str(properties["POSTAL_COD"]).strip() if properties.get("POSTAL_COD") is not None else None
        output_features.append({
            "type": "Feature",
            "id": building_id,
            "geometry": mapping(geometry),
            "properties": {
                "building_id": building_id,
                "block_number": block or None,
                "postal_code": postal or None,
                "longitude": point.x,
                "latitude": point.y,
                "render_height_m": 0,
                "height_source": "visualization_only_default",
                "height_is_official": False,
                "geometry_source": SOURCE_NAME,
                "data_source": SOURCE_NAME,
                "data_source_url": SOURCE_URL,
                "geometry_is_source_footprint": True,
                "source_properties": properties,
            },
        })

    if not output_features:
        raise ValueError("No valid polygon footprints were found.")
    return {
        "type": "FeatureCollection",
        "name": "HDB under-construction building footprints",
        "metadata": {
            "source": SOURCE_NAME,
            "source_url": SOURCE_URL,
            "snapshot_date": "not recorded in the supplied raw file",
            "input_crs_assumption": "WGS 84 longitude/latitude (RFC 7946); input has no crs member",
            "note": "Individual building footprints, not named BTO project boundaries. Geometry is published footprint geometry; display heights are not measured.",
            "skipped_invalid_features": skipped,
        },
        "features": output_features,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    try:
        collection = prepare(args.input)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))
    serialized = json.dumps(collection, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temp_path = args.output.with_suffix(args.output.suffix + ".tmp")
    temp_path.write_text(serialized, encoding="utf-8")
    temp_path.replace(args.output)
    print(f"Prepared {len(collection['features']):,} HDB under-construction footprints; skipped {collection['metadata']['skipped_invalid_features']} invalid records.")
    print(f"Output: {args.output} ({args.output.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
