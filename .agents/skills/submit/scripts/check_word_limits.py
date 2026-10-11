#!/usr/bin/env python3
"""Check whole-section word limits in a Common Ground Markdown draft.

Usage: python3 check_word_limits.py [draft.md]
With no path, read standard input. Labels count; numbered headings do not.
Exit 0 for counts within limits, 1 for excess words, 2 for missing sections.
This checks length only, not factual accuracy or submission completeness.
"""

from pathlib import Path
import re
import sys


def check(text):
    headings = list(re.finditer(r"^#{1,6}\s+([1-7])\.\s+(.+)$", text, re.MULTILINE))
    counts = {}
    for index, heading in enumerate(headings):
        section = int(heading.group(1))
        if section not in (2, 3):
            continue
        if section in counts:
            raise ValueError(f"Section {section} appears more than once; provide one entry.")
        expected = {2: "Project Overview", 3: "The Build"}[section]
        if not heading.group(2).startswith(expected):
            raise ValueError(f"Section {section} must be titled {expected}.")
        end = headings[index + 1].start() if index + 1 < len(headings) else len(text)
        body = text[heading.end():end]
        # Count labels and all whitespace-delimited tokens conservatively.
        counts[section] = len(body.split())
    if set(counts) != {2, 3}:
        raise ValueError("Include numbered Markdown headings for sections 2 and 3.")
    return counts


def main():
    if len(sys.argv) > 2:
        print("Usage: check_word_limits.py [draft.md]", file=sys.stderr)
        return 2
    try:
        text = Path(sys.argv[1]).read_text(encoding="utf-8") if len(sys.argv) == 2 else sys.stdin.read()
        counts = check(text)
    except (OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 2
    for section, count in sorted(counts.items()):
        print(f"Section {section}: {count}/100 words{' — over limit' if count > 100 else ''}")
    return int(any(count > 100 for count in counts.values()))


if __name__ == "__main__":
    raise SystemExit(main())
