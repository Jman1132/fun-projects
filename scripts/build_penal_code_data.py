#!/usr/bin/env python3
"""Build docs/penal-code-data.js from penal_code_part_1_extract.json."""

import argparse
import json
import re
from datetime import date
from pathlib import Path


SECTION_MARKER = re.compile(r"(?m)^\s*(\d+(?:\.\d+)?[a-z]?\.)\s*$")


def build_sections(payload):
    sections = {}
    for record in payload["records"]:
        text = record["text"]
        markers = list(SECTION_MARKER.finditer(text))
        for index, marker in enumerate(markers):
            section = marker.group(1)
            key = section.rstrip(".").lower()
            end = markers[index + 1].start() if index + 1 < len(markers) else len(text)
            sections[key] = {
                "text": text[marker.start() : end].strip(),
                "sourceUrl": record["source_url"],
                "heading": record["heading"],
            }
    return sections


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="penal_code_part_1_extract.json")
    parser.add_argument("--output", default="docs/penal-code-data.js")
    args = parser.parse_args()

    payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
    sections = build_sections(payload)
    metadata = {
        "sourceBranchUrl": payload["source_branch_url"],
        "generatedFrom": args.input,
        "generatedOn": date.today().isoformat(),
        "extractedLinkCount": payload["extracted_link_count"],
        "sectionCount": len(sections),
    }
    output = (
        "// Generated from penal_code_part_1_extract.json. "
        "Run scripts/build_penal_code_data.py to refresh.\n"
        f"window.PENAL_CODE_DATA = {json.dumps({'metadata': metadata, 'sections': sections}, ensure_ascii=False, indent=2)};\n"
        "window.PENAL_CODE_SECTIONS = Object.fromEntries(Object.entries(window.PENAL_CODE_DATA.sections).map(([section, record]) => [section, record.text]));\n"
    )
    Path(args.output).write_text(output, encoding="utf-8")
    print(f"Wrote {args.output} with {len(sections)} sections")


if __name__ == "__main__":
    main()
