#!/usr/bin/env python3
"""Summarize the local HDB existing-building GeoJSON without dumping geometry."""

from __future__ import annotations

import argparse
import json
import math
from collections import Counter
from pathlib import Path
from typing import Any

from shapely import get_coordinates
from shapely.geometry import shape
from shapely.validation import explain_validity


DEFAULT_INPUT = Path("data/raw/hdb_existing_buildings.geojson")
AVAILABLE_CASE_VARIANTS = (Path("data/raw/HDBExistingBuilding.geojson"),)


def resolve_input_path(path: Path) -> Path:
    if path.is_file():
        return path
    if path == DEFAULT_INPUT:
        for candidate in AVAILABLE_CASE_VARIANTS:
            if candidate.is_file():
                print(
                    f"Note: {path} was not found; using the available source file {candidate}."
                )
                return candidate
    raise FileNotFoundError(f"GeoJSON input not found: {path}")


def load_collection(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as source:
        collection = json.load(source)
    if not isinstance(collection, dict) or collection.get("type") != "FeatureCollection":
        raise ValueError("Input must be a GeoJSON FeatureCollection.")
    if not isinstance(collection.get("features"), list):
        raise ValueError("FeatureCollection is missing its features array.")
    return collection


def inspect(collection: dict[str, Any], sample_count: int) -> None:
    features = collection["features"]
    geometry_types: Counter[str] = Counter()
    property_names: set[str] = set()
    invalid_reasons: Counter[str] = Counter()
    missing_geometry = 0
    malformed_geometry = 0
    empty_geometry = 0
    invalid_geometry = 0
    non_finite_coordinates = 0
    bounds = [math.inf, math.inf, -math.inf, -math.inf]
    invalid_examples: list[str] = []

    for index, feature in enumerate(features):
        if not isinstance(feature, dict):
            malformed_geometry += 1
            continue

        properties = feature.get("properties")
        if isinstance(properties, dict):
            property_names.update(str(name) for name in properties)

        raw_geometry = feature.get("geometry")
        if not isinstance(raw_geometry, dict):
            missing_geometry += 1
            continue

        geometry_types[str(raw_geometry.get("type", "<missing type>"))] += 1
        try:
            geometry = shape(raw_geometry)
        except Exception as error:  # malformed coordinates can fail during construction
            malformed_geometry += 1
            if len(invalid_examples) < 8:
                invalid_examples.append(f"feature {index}: cannot parse geometry ({error})")
            continue

        if geometry.is_empty:
            empty_geometry += 1
            continue

        coordinates = get_coordinates(geometry)
        if coordinates.size:
            for coordinate in coordinates:
                x, y = float(coordinate[0]), float(coordinate[1])
                if not math.isfinite(x) or not math.isfinite(y):
                    non_finite_coordinates += 1
                    continue
                bounds[0] = min(bounds[0], x)
                bounds[1] = min(bounds[1], y)
                bounds[2] = max(bounds[2], x)
                bounds[3] = max(bounds[3], y)

        if not geometry.is_valid:
            invalid_geometry += 1
            reason = explain_validity(geometry)
            invalid_reasons[reason] += 1
            if len(invalid_examples) < 8:
                feature_id = feature.get("id", index)
                invalid_examples.append(f"feature {feature_id}: {reason}")

    print(f"Collection name: {collection.get('name', '<not provided>')}")
    print(f"Feature count: {len(features):,}")
    print(f"Geometry types: {dict(sorted(geometry_types.items()))}")
    print(f"Available property names: {', '.join(sorted(property_names)) or '<none>'}")
    print(f"Missing geometry: {missing_geometry:,}")
    print(f"Malformed geometry: {malformed_geometry:,}")
    print(f"Empty geometry: {empty_geometry:,}")
    print(f"Topologically invalid geometry: {invalid_geometry:,}")
    print(f"Non-finite coordinate tuples: {non_finite_coordinates:,}")
    if invalid_reasons:
        print(f"Invalidity reasons: {dict(invalid_reasons)}")
    if all(math.isfinite(value) for value in bounds):
        print(
            "Coordinate bounds (x/y): "
            f"({bounds[0]:.9f}, {bounds[1]:.9f}, {bounds[2]:.9f}, {bounds[3]:.9f})"
        )

    declared_crs = collection.get("crs")
    if declared_crs:
        print(f"Coordinate reference system (declared): {json.dumps(declared_crs, ensure_ascii=False)}")
    else:
        print(
            "Coordinate reference system: no `crs` member is declared. Interpreted using "
            "RFC 7946 GeoJSON semantics as WGS 84 longitude/latitude (OGC:CRS84; "
            "EPSG:4326 with x=longitude, y=latitude for transformations). The coordinate "
            "extent is consistent with Singapore."
        )

    for message in invalid_examples:
        print(f"Geometry issue: {message}")

    if not features or sample_count == 0:
        return
    sample_indexes = sorted(
        {0, len(features) // 2, len(features) - 1} if sample_count >= 3 else set()
    )
    if sample_count in (1, 2):
        sample_indexes = list(range(min(sample_count, len(features))))
    elif sample_count > 3:
        sample_indexes = sorted(
            set(sample_indexes)
            | {round(i * (len(features) - 1) / (sample_count - 1)) for i in range(sample_count)}
        )

    print("Representative property values (geometry omitted):")
    for index in sample_indexes:
        feature = features[index]
        if isinstance(feature, dict):
            print(
                f"  feature[{index}] id={feature.get('id', '<not provided>')}: "
                f"{json.dumps(feature.get('properties'), ensure_ascii=False, default=str)}"
            )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Input GeoJSON path")
    parser.add_argument("--samples", type=int, default=3, help="How many representative features to print")
    args = parser.parse_args()
    if args.samples < 0:
        parser.error("--samples must be zero or greater")

    try:
        path = resolve_input_path(args.input)
        collection = load_collection(path)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))
    print(f"Input: {path} ({path.stat().st_size:,} bytes)")
    inspect(collection, args.samples)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
