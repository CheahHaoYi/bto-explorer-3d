#!/usr/bin/env python3
"""Prepare annual block-level HDB resale price history for static browser use.

Street-code matching is conservative: an HDB street code is linked to a
property-information street only when every observed block under that code has
that same single street as its property-information match.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path
from statistics import median
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RAW = ROOT / "data/raw"
DEFAULT_HDB = DEFAULT_RAW / "HDBExistingBuilding.geojson"
DEFAULT_UNDER_CONSTRUCTION = DEFAULT_RAW / "HDBUnderConstructionBuildings.geojson"
DEFAULT_PROPERTIES = DEFAULT_RAW / "HDBPropertyInformation.csv"
DEFAULT_OUTPUT = ROOT / "public/data/resale/block-history.json"

SOURCE_URL = "https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view"
PROPERTY_URL = "https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view"
HDB_URL = "https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view"
DATASET_FILES = (
    "Resale Flat Prices (Based on Approval Date), 1990 - 1999.csv",
    "Resale Flat Prices (Based on Approval Date), 2000 - Feb 2012.csv",
    "Resale Flat Prices (Based on Registration Date), From Mar 2012 to Dec 2014.csv",
    "Resale Flat Prices (Based on Registration Date), From Jan 2015 to Dec 2016.csv",
    "Resale flat prices based on registration date from Jan-2017 onwards.csv",
)
FLAT_TYPES = {"1 ROOM", "2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM", "EXECUTIVE", "MULTI-GENERATION"}


def norm(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().upper())


def address_key(block: str, street: str) -> str:
    return f"{block}|{street}"


def load_street_code_crosswalk(hdb_path: Path, under_construction_path: Path, properties_path: Path) -> tuple[dict[tuple[str, str], str], dict[str, int]]:
    with properties_path.open(encoding="utf-8-sig", newline="") as handle:
        property_rows = list(csv.DictReader(handle))
    streets_by_block: dict[str, set[str]] = defaultdict(set)
    for row in property_rows:
        block, street = norm(row.get("blk_no")), norm(row.get("street"))
        if block and street:
            streets_by_block[block].add(street)

    source = json.loads(hdb_path.read_text(encoding="utf-8"))
    if not isinstance(source, dict) or source.get("type") != "FeatureCollection":
        raise ValueError("HDB existing-building input must be a GeoJSON FeatureCollection.")
    blocks_by_code: dict[str, set[str]] = defaultdict(set)
    under_construction_pairs: set[tuple[str, str]] = set()
    for feature in source.get("features", []):
        props = feature.get("properties") if isinstance(feature, dict) else None
        if not isinstance(props, dict):
            continue
        code, block = norm(props.get("ST_COD")), norm(props.get("BLK_NO"))
        if code and block:
            blocks_by_code[code].add(block)

    under_construction = json.loads(under_construction_path.read_text(encoding="utf-8"))
    if not isinstance(under_construction, dict) or under_construction.get("type") != "FeatureCollection":
        raise ValueError("Under-construction HDB input must be a GeoJSON FeatureCollection.")
    for feature in under_construction.get("features", []):
        props = feature.get("properties") if isinstance(feature, dict) else None
        if not isinstance(props, dict):
            continue
        code, block = norm(props.get("ST_COD")), norm(props.get("BLK_NO"))
        if code and block:
            under_construction_pairs.add((code, block))

    crosswalk: dict[tuple[str, str], str] = {}
    mapped_under_construction: set[tuple[str, str]] = set()
    unique_code_count = 0
    unresolved_code_count = 0
    for code, blocks in blocks_by_code.items():
        # Ambiguous block numbers are acceptable only if all blocks still have
        # one identical street in common; missing property rows remain unresolved.
        street_sets = [streets_by_block.get(block, set()) for block in blocks]
        if any(not streets for streets in street_sets):
            unresolved_code_count += 1
            continue
        common = set.intersection(*(set(streets) for streets in street_sets))
        if len(common) != 1:
            unresolved_code_count += 1
            continue
        street = next(iter(common))
        unique_code_count += 1
        for block in blocks:
            crosswalk[(code, block)] = street
        for candidate_code, block in under_construction_pairs:
            if candidate_code == code and street in streets_by_block.get(block, set()):
                crosswalk[(code, block)] = street
                mapped_under_construction.add((code, block))
    return crosswalk, {
        "existingBuildingStreetCodes": len(blocks_by_code),
        "resolvedStreetCodes": unique_code_count,
        "unresolvedStreetCodes": unresolved_code_count,
        "underConstructionBuildingBlockPairs": len(under_construction_pairs),
        "mappedUnderConstructionBuildingBlockPairs": len(mapped_under_construction),
        "mappedBuildingBlockPairs": len(crosswalk),
    }


def load_transactions(raw_dir: Path) -> tuple[dict[str, dict[str, Any]], dict[str, Any]]:
    groups: dict[str, dict[str, Any]] = {}
    skipped_rows = 0
    skipped_reasons: dict[str, int] = defaultdict(int)
    source_row_count = 0
    source_files: list[str] = []
    included_months: list[str] = []
    for filename in DATASET_FILES:
        path = raw_dir / filename
        if not path.is_file():
            raise ValueError(f"Required resale source file is missing: {path}")
        source_files.append(filename)
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            required = {"month", "flat_type", "block", "street_name", "resale_price"}
            if not required.issubset(reader.fieldnames or []):
                raise ValueError(f"Resale file has an unexpected schema: {filename}")
            for row in reader:
                source_row_count += 1
                month, block, street = norm(row.get("month")), norm(row.get("block")), norm(row.get("street_name"))
                flat_type = norm(row.get("flat_type")).replace("MULTI GENERATION", "MULTI-GENERATION")
                storey_range = norm(row.get("storey_range"))
                try:
                    year, month_num = int(month[:4]), int(month[5:7])
                    price = int(float(row["resale_price"]))
                except (ValueError, TypeError, KeyError):
                    skipped_rows += 1
                    skipped_reasons["invalid month or resale price"] += 1
                    continue
                if (len(month) != 7 or month[4] != "-" or not 1 <= month_num <= 12 or not block or not street
                        or flat_type not in FLAT_TYPES or price < 0 or not re.fullmatch(r"\d{2} TO \d{2}", storey_range)):
                    skipped_rows += 1
                    skipped_reasons["missing identifier, unsupported flat type, invalid month/price, or missing/invalid storey range"] += 1
                    continue
                included_months.append(month)
                key = address_key(block, street)
                group = groups.setdefault(key, {
                    "blockNumber": block,
                    "streetName": street,
                    "periods": defaultdict(list),
                    "flatPeriods": defaultdict(lambda: defaultdict(list)),
                    "floorBandPeriods": defaultdict(lambda: defaultdict(list)),
                    "transactionCount": 0,
                })
                group["periods"][str(year)].append(price)
                group["flatPeriods"][flat_type][str(year)].append(price)
                group["floorBandPeriods"][storey_range][str(year)].append(price)
                group["transactionCount"] += 1
    return groups, {
        "sourceRowCount": source_row_count,
        "includedTransactionCount": sum(group["transactionCount"] for group in groups.values()),
        "skippedInvalidRowCount": skipped_rows,
        "skippedReasons": dict(skipped_reasons),
        "sourceFiles": source_files,
        "sourceMonthCoverage": [min(included_months), max(included_months)] if included_months else None,
    }


def history(periods: dict[str, list[int]]) -> list[list[int]]:
    # Compact tuple layout keeps the static browser asset small:
    # [year, median SGD, transaction count].
    return [[int(year), int(round(median(values))), len(values)] for year, values in sorted(periods.items())]


def prepare(raw_dir: Path, hdb_path: Path, under_construction_path: Path, properties_path: Path) -> dict[str, Any]:
    crosswalk, crosswalk_counts = load_street_code_crosswalk(hdb_path, under_construction_path, properties_path)
    groups, row_counts = load_transactions(raw_dir)
    addresses = []
    for key, group in sorted(groups.items()):
        addresses.append({
            "key": key,
            "blockNumber": group["blockNumber"],
            "streetName": group["streetName"],
            "transactionCount": group["transactionCount"],
            "overallHistory": history(group["periods"]),
            "floorBandHistory": {
                band: {
                    "transactionCount": sum(len(prices) for prices in periods.values()),
                    "medianSgd": int(round(median([price for prices in periods.values() for price in prices]))),
                    "history": history(periods),
                }
                for band, periods in sorted(group["floorBandPeriods"].items())
            },
            "flatTypeHistory": {
                flat_type: history(periods)
                for flat_type, periods in sorted(group["flatPeriods"].items())
            },
        })
    address_keys = set(groups)
    matched = [
        {"streetCode": code, "blockNumber": block, "addressKey": address_key(block, street)}
        for (code, block), street in sorted(crosswalk.items())
        if address_key(block, street) in address_keys
    ]
    all_years = [point[0] for group in groups.values() for point in history(group["periods"])]
    return {
        "schemaVersion": 2,
        "metadata": {
            "source": {
                "name": "HDB resale flat prices, 1990 onwards",
                "url": SOURCE_URL,
                "publisher": "Housing & Development Board",
                "retrievedAt": None,
                "transactionDateField": "month",
                "priceField": "resale_price",
                "sourceDateCoverage": f"{min(all_years)} to {max(all_years)}" if all_years else None,
                "sourceMonthCoverage": row_counts["sourceMonthCoverage"],
                "dateBasis": "Approval date for 1990–2012-02; registration date for 2012-03 onwards, following source dataset partitions.",
                "aggregation": "Annual median transaction price and count by exact normalized block + street name; repeated independently for each flat type and source storey_range band. Each storey-range band also includes an all-time median and count. Half-dollar medians are rounded to the nearest whole SGD. Source storey ranges may overlap and do not identify an exact floor. These are historical transaction observations, not current-value estimates.",
                "sourceFiles": row_counts["sourceFiles"],
                "sourceFields": ["month", "town", "flat_type", "block", "street_name", "storey_range", "resale_price"],
            },
            "streetCodeCrosswalk": {
                "propertyInformationSource": PROPERTY_URL,
                "hdbFootprintSource": HDB_URL,
                "underConstructionFootprintSource": "https://data.gov.sg/datasets/d_e4aaf26891bfe398666f7a96fe81a972/view",
                "retrievedAt": None,
                "method": "A source street code is linked only when every existing-building block carrying that code has one identical street name in common among its HDB Property Information matches. Codes with missing rows or multiple common street candidates are omitted.",
                **crosswalk_counts,
                "matchedBlockStreetCodePairsWithTransactions": len(matched),
            },
            "license": "Singapore Open Data Licence; verify current terms on the linked source pages.",
            "counts": row_counts | {"blockStreetRecords": len(addresses), "blockStreetCodePriceMatches": len(matched)},
        },
        "addresses": addresses,
        "buildingMatches": matched,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw-dir", type=Path, default=DEFAULT_RAW)
    parser.add_argument("--hdb-input", type=Path, default=DEFAULT_HDB)
    parser.add_argument("--under-construction-input", type=Path, default=DEFAULT_UNDER_CONSTRUCTION)
    parser.add_argument("--properties-input", type=Path, default=DEFAULT_PROPERTIES)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    try:
        payload = prepare(args.raw_dir, args.hdb_input, args.under_construction_input, args.properties_input)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        parser.error(str(error))
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_suffix(args.output.suffix + ".tmp")
    temporary.write_text(serialized, encoding="utf-8")
    temporary.replace(args.output)
    counts = payload["metadata"]["counts"]
    crosswalk = payload["metadata"]["streetCodeCrosswalk"]
    print(f"Prepared {counts['blockStreetRecords']:,} block/street histories from {counts['includedTransactionCount']:,} transactions.")
    print(f"Mapped {crosswalk['matchedBlockStreetCodePairsWithTransactions']:,} HDB block/street-code pairs to resale history; {crosswalk['unresolvedStreetCodes']:,} street codes unresolved.")
    print(f"Output: {args.output} ({args.output.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
