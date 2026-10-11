#!/usr/bin/env python3
"""Create a small, valid HDB-footprint GeoJSON subset for the browser map."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from collections import Counter
from pathlib import Path
from typing import Any

from pyproj import CRS, Transformer
from shapely import get_coordinates, transform as transform_geometry
from shapely.geometry import Point, mapping, shape


DEFAULT_INPUT = Path("data/raw/hdb_existing_buildings.geojson")
AVAILABLE_CASE_VARIANTS = (Path("data/raw/HDBExistingBuilding.geojson"),)
DEFAULT_OUTPUT = Path("public/data/demo/buildings.geojson")

# The current app opens at this Singapore map centre. The default demo centre is
# derived from the representative point of the nearest valid source footprint;
# these coordinates are an anchor only, not a BTO project location or building.
DEMO_AREA_CONFIG = {
    "label": "Data-derived HDB demo area (not a selected BTO development)",
    "anchor_longitude": 103.8198,
    "anchor_latitude": 1.3521,
    "radius_km": 1.25,
    "simplify_tolerance_m": 0.5,
    "visualization_height_m": 45.0,
}

SOURCE_NAME = "HDB Existing Building — data.gov.sg (Housing & Development Board)"
SOURCE_URL = "https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view"
SOURCE_CRS = CRS.from_epsg(4326)
METRIC_CRS = CRS.from_epsg(3414)  # SVY21 / Singapore TM; metres
TO_METRIC = Transformer.from_crs(SOURCE_CRS, METRIC_CRS, always_xy=True)
TO_WGS84 = Transformer.from_crs(METRIC_CRS, SOURCE_CRS, always_xy=True)
ALLOWED_GEOMETRIES = {"Polygon", "MultiPolygon"}
MAX_SIMPLIFICATION_TOLERANCE_M = 10.0
MAX_SIMPLIFICATION_AREA_CHANGE = 0.01


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


def has_finite_coordinates(geometry: Any) -> bool:
    coordinates = get_coordinates(geometry)
    if coordinates.size == 0:
        return False
    return all(
        math.isfinite(float(value))
        for coordinate in coordinates
        for value in coordinate[:2]
    )


def normalize_optional_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def canonical_source_id(
    properties: dict[str, Any],
    source_id_counts: dict[str, Counter[str]],
    raw_feature: dict[str, Any],
    source_index: int,
    used_ids: set[str],
) -> str:
    for field in ("ENTITYID", "OBJECTID"):
        value = normalize_optional_text(properties.get(field))
        if value and source_id_counts[field][value] == 1:
            candidate = f"hdb-existing-{field.lower()}-{value}"
            if candidate not in used_ids:
                used_ids.add(candidate)
                return candidate

    stable_payload = json.dumps(
        {"geometry": raw_feature.get("geometry"), "properties": properties},
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
        allow_nan=False,
    )
    fingerprint = hashlib.sha256(stable_payload.encode("utf-8")).hexdigest()[:24]
    candidate = f"hdb-existing-hash-{fingerprint}"
    if candidate in used_ids:
        # Exact duplicate records have no distinct source identifier. Preserve
        # deterministic uniqueness for this source ordering and expose no
        # synthetic HDB attributes beyond the derived app ID.
        candidate = f"{candidate}-row-{source_index}"
    used_ids.add(candidate)
    return candidate


def polygon_component_count(geometry: Any) -> int:
    return len(geometry.geoms) if geometry.geom_type == "MultiPolygon" else 1


def simplify_safely(geometry: Any, tolerance_m: float) -> tuple[Any, bool]:
    if tolerance_m <= 0:
        return geometry, False
    simplified = geometry.simplify(tolerance_m, preserve_topology=True)
    if (
        simplified.is_empty
        or not simplified.is_valid
        or simplified.geom_type != geometry.geom_type
        or polygon_component_count(simplified) != polygon_component_count(geometry)
        or geometry.area <= 0
    ):
        return geometry, False
    area_change = abs(simplified.area - geometry.area) / geometry.area
    if area_change > MAX_SIMPLIFICATION_AREA_CHANGE:
        return geometry, False
    return simplified, True


def source_feature_counts(features: list[Any]) -> dict[str, Counter[str]]:
    counts = {"ENTITYID": Counter(), "OBJECTID": Counter()}
    for feature in features:
        if not isinstance(feature, dict):
            continue
        properties = feature.get("properties")
        if not isinstance(properties, dict):
            continue
        for field in counts:
            value = normalize_optional_text(properties.get(field))
            if value:
                counts[field][value] += 1
    return counts


def parse_polygon_features(
    features: list[Any],
) -> tuple[list[tuple[int, dict[str, Any], Any, Any]], Counter[str]]:
    valid_features: list[tuple[int, dict[str, Any], Any, Any]] = []
    skipped: Counter[str] = Counter()

    for index, feature in enumerate(features):
        if not isinstance(feature, dict):
            skipped["malformed_feature"] += 1
            continue
        raw_geometry = feature.get("geometry")
        if not isinstance(raw_geometry, dict):
            skipped["missing_geometry"] += 1
            continue
        try:
            geometry = shape(raw_geometry)
        except Exception:
            skipped["unreadable_geometry"] += 1
            continue
        if geometry.is_empty:
            skipped["empty_geometry"] += 1
            continue
        if geometry.geom_type not in ALLOWED_GEOMETRIES:
            skipped[f"unsupported_{geometry.geom_type}"] += 1
            continue
        if not has_finite_coordinates(geometry):
            skipped["non_finite_coordinates"] += 1
            continue
        if not geometry.is_valid:
            skipped["invalid_geometry"] += 1
            continue

        projected = transform_geometry(
            geometry,
            TO_METRIC.transform,
            interleaved=False,
        )
        valid_features.append((index, feature, geometry, projected))

    return valid_features, skipped


def representative_coordinates(projected_geometry: Any) -> tuple[float, float]:
    point = projected_geometry.representative_point()
    return TO_WGS84.transform(point.x, point.y)


def make_output_feature(
    source_index: int,
    raw_feature: dict[str, Any],
    original_geometry: Any,
    projected_geometry: Any,
    source_id_counts: dict[str, Counter[str]],
    used_ids: set[str],
    simplify_tolerance_m: float,
    height_m: float,
) -> tuple[dict[str, Any], bool]:
    source_properties = raw_feature.get("properties")
    if not isinstance(source_properties, dict):
        source_properties = {}

    building_id = canonical_source_id(
        source_properties,
        source_id_counts,
        raw_feature,
        source_index,
        used_ids,
    )
    display_geometry_m, was_simplified = simplify_safely(
        projected_geometry,
        simplify_tolerance_m,
    )
    display_geometry_wgs84 = transform_geometry(
        display_geometry_m,
        TO_WGS84.transform,
        interleaved=False,
    )
    if (
        display_geometry_wgs84.is_empty
        or not display_geometry_wgs84.is_valid
        or display_geometry_wgs84.geom_type != original_geometry.geom_type
    ):
        # Reprojection should not invalidate a valid source footprint. Keep
        # the original WGS84 geometry if numerical rounding ever does so.
        display_geometry_wgs84 = original_geometry
        was_simplified = False

    longitude, latitude = representative_coordinates(projected_geometry)
    properties = {
        "building_id": building_id,
        "block_number": normalize_optional_text(source_properties.get("BLK_NO")),
        "postal_code": normalize_optional_text(source_properties.get("POSTAL_COD")),
        "longitude": longitude,
        "latitude": latitude,
        "render_height_m": height_m,
        "height_source": "visualization_only_default",
        "height_is_official": False,
        "geometry_source": SOURCE_NAME,
        "data_source": SOURCE_NAME,
        "data_source_url": SOURCE_URL,
        "geometry_is_source_footprint": True,
        "source_properties": source_properties,
    }
    return (
        {
            "type": "Feature",
            "id": building_id,
            "geometry": mapping(display_geometry_wgs84),
            "properties": properties,
        },
        was_simplified,
    )


def validate_output(collection: dict[str, Any]) -> None:
    seen_ids: set[str] = set()
    for index, feature in enumerate(collection["features"]):
        if feature.get("type") != "Feature":
            raise ValueError(f"Output feature {index} has an invalid type.")
        properties = feature.get("properties") or {}
        building_id = feature.get("id")
        if not isinstance(building_id, str) or not building_id:
            raise ValueError(f"Output feature {index} has no stable feature ID.")
        if building_id in seen_ids:
            raise ValueError(f"Duplicate output building ID: {building_id}")
        seen_ids.add(building_id)
        if properties.get("building_id") != building_id:
            raise ValueError(f"Feature {building_id} ID does not match its properties.")
        if properties.get("height_is_official") is not False:
            raise ValueError(f"Feature {building_id} does not label its height as a placeholder.")
        geometry = shape(feature.get("geometry"))
        if geometry.geom_type not in ALLOWED_GEOMETRIES or geometry.is_empty or not geometry.is_valid:
            raise ValueError(f"Output feature {building_id} has invalid polygon geometry.")
        if not has_finite_coordinates(geometry):
            raise ValueError(f"Output feature {building_id} contains non-finite coordinates.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Raw HDB GeoJSON path")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Reduced GeoJSON output path")
    parser.add_argument("--longitude", type=float, help="Custom demo-centre longitude")
    parser.add_argument("--latitude", type=float, help="Custom demo-centre latitude")
    parser.add_argument(
        "--radius-km",
        type=float,
        default=DEMO_AREA_CONFIG["radius_km"],
        help=f"Demo radius in kilometres (default: {DEMO_AREA_CONFIG['radius_km']})",
    )
    parser.add_argument(
        "--simplify-tolerance-m",
        type=float,
        default=DEMO_AREA_CONFIG["simplify_tolerance_m"],
        help="Topology-preserving simplification tolerance in projected metres; 0 disables it",
    )
    parser.add_argument(
        "--visualization-height-m",
        type=float,
        default=DEMO_AREA_CONFIG["visualization_height_m"],
        help="Visualization-only extrusion height; never an official building measurement",
    )
    args = parser.parse_args()

    if (args.longitude is None) != (args.latitude is None):
        parser.error("--longitude and --latitude must be supplied together")
    if not math.isfinite(args.radius_km) or args.radius_km <= 0:
        parser.error("--radius-km must be a finite positive value")
    if (
        not math.isfinite(args.simplify_tolerance_m)
        or args.simplify_tolerance_m < 0
        or args.simplify_tolerance_m > MAX_SIMPLIFICATION_TOLERANCE_M
    ):
        parser.error(
            f"--simplify-tolerance-m must be between 0 and {MAX_SIMPLIFICATION_TOLERANCE_M:g} metres"
        )
    if not math.isfinite(args.visualization_height_m) or args.visualization_height_m <= 0:
        parser.error("--visualization-height-m must be a finite positive value")
    if args.longitude is not None and not (-180 <= args.longitude <= 180):
        parser.error("--longitude must be between -180 and 180")
    if args.latitude is not None and not (-90 <= args.latitude <= 90):
        parser.error("--latitude must be between -90 and 90")

    try:
        input_path = resolve_input_path(args.input)
        collection = load_collection(input_path)
        raw_features = collection["features"]
        valid_features, skipped = parse_polygon_features(raw_features)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))

    if not valid_features:
        parser.error("No valid Polygon or MultiPolygon features were found in the input.")

    if args.longitude is None:
        anchor_x, anchor_y = TO_METRIC.transform(
            DEMO_AREA_CONFIG["anchor_longitude"],
            DEMO_AREA_CONFIG["anchor_latitude"],
        )
        anchor = Point(anchor_x, anchor_y)
        nearest = min(
            valid_features,
            key=lambda entry: entry[3].representative_point().distance(anchor),
        )
        center_x, center_y = representative_coordinates(nearest[3])
        default_center_properties = nearest[1].get("properties") or {}
        selected_source_id = default_center_properties.get("ENTITYID")
        area_label = DEMO_AREA_CONFIG["label"]
    else:
        center_x, center_y = args.longitude, args.latitude
        area_label = "User-configured demonstration area (not associated with a named BTO development)"
        selected_source_id = None

    projected_center = Point(*TO_METRIC.transform(center_x, center_y))
    selection_area = projected_center.buffer(args.radius_km * 1000)
    selected = [
        entry for entry in valid_features if entry[3].intersects(selection_area)
    ]

    source_id_counts = source_feature_counts(raw_features)
    used_ids: set[str] = set()
    output_features: list[dict[str, Any]] = []
    simplified_count = 0
    output_geometry_types: Counter[str] = Counter()
    for source_index, raw_feature, original_geometry, projected_geometry in selected:
        output_feature, was_simplified = make_output_feature(
            source_index,
            raw_feature,
            original_geometry,
            projected_geometry,
            source_id_counts,
            used_ids,
            args.simplify_tolerance_m,
            args.visualization_height_m,
        )
        output_features.append(output_feature)
        output_geometry_types[output_feature["geometry"]["type"]] += 1
        simplified_count += int(was_simplified)

    area_metadata = {
        "label": area_label,
        "center": {"longitude": center_x, "latitude": center_y},
        "radius_km": args.radius_km,
        "selection_rule": "footprint intersects a circular buffer in EPSG:3414 (SVY21 metres)",
        "default_center_source_entity_id": selected_source_id,
        "bto_project_location": False,
    }
    output_collection = {
        "type": "FeatureCollection",
        "name": "HDB Existing Building — reduced visualization demo",
        "metadata": {
            "source": SOURCE_NAME,
            "source_url": SOURCE_URL,
            "input_crs_assumption": "WGS 84 longitude/latitude (RFC 7946; EPSG:4326 x/y for transformation); input has no crs member",
            "measurement_note": "Footprint geometry is sourced; render_height_m is a visualization-only default and is not an official height.",
            "height_source": "visualization_only_default",
            "height_is_official": False,
            "visualization_height_m": args.visualization_height_m,
            "demo_area": area_metadata,
            "simplification": {
                "tolerance_m": args.simplify_tolerance_m,
                "crs": "EPSG:3414",
                "preserve_topology": True,
                "maximum_area_change_fraction": MAX_SIMPLIFICATION_AREA_CHANGE,
            },
        },
        "features": output_features,
    }
    validate_output(output_collection)

    serialized = json.dumps(
        output_collection,
        ensure_ascii=False,
        separators=(",", ":"),
        allow_nan=False,
    )
    output_path: Path = args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = output_path.with_suffix(output_path.suffix + ".tmp")
    temporary_path.write_text(serialized, encoding="utf-8")
    temporary_path.replace(output_path)

    output_bytes = output_path.stat().st_size
    input_bytes = input_path.stat().st_size
    reduction_percent = (1 - output_bytes / input_bytes) * 100 if input_bytes else 0
    print(f"Input: {input_path} ({input_bytes:,} bytes; {len(raw_features):,} features)")
    if args.longitude is None:
        print(
            "Default centre: representative point of the valid source footprint nearest "
            f"the Milestone 0 map anchor (ENTITYID={selected_source_id})."
        )
    else:
        print("Centre: explicitly supplied longitude/latitude.")
    print(f"Demo area: {area_label}")
    print(f"Centre coordinates (derived/configured): {center_x:.9f}, {center_y:.9f}")
    print(f"Radius: {args.radius_km:g} km; CRS for distance/simplification: EPSG:3414 (SVY21)")
    print(f"Input geometries skipped: {dict(skipped) or 'none'}")
    print(f"Selected intersecting valid footprints: {len(selected):,}")
    print(f"Output geometry types: {dict(sorted(output_geometry_types.items()))}")
    print(f"Features simplified safely: {simplified_count:,} (tolerance {args.simplify_tolerance_m:g} m)")
    print(
        f"Visualization-only height: {args.visualization_height_m:g} m; "
        "height_is_official=false for every output feature."
    )
    print(f"Output: {output_path} ({output_bytes:,} bytes; {reduction_percent:.2f}% smaller than input)")
    print(f"Validated output features: {len(output_features):,}; IDs unique; polygonal geometries valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
