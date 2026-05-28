#!/usr/bin/env python3
"""Extract Penal Code Part 1 text from LegInfo into JSON and Markdown.

This script refreshes the source artifact used by scripts/build_penal_code_data.py.
It uses only the Python standard library.
"""

import argparse
import json
import re
import ssl
import time
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen


BASE = "https://leginfo.legislature.ca.gov"
DEFAULT_BRANCH_URL = (
    "https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?"
    "tocCode=PEN&division=&title=&part=1.&chapter=&article=&nodetreepath=4"
)


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_a = False
        self.href = ""
        self.text = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.in_a = True
            self.href = dict(attrs).get("href", "")
            self.text = []

    def handle_data(self, data):
        if self.in_a:
            self.text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.in_a:
            text = " ".join("".join(self.text).split())
            href = unescape(self.href)
            if text and "codes_displayText.xhtml" in href and "lawCode=PEN" in href:
                self.links.append({"heading": text, "url": urljoin(BASE, href)})
            self.in_a = False


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.capture_depth = 0
        self.skip_depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id") == "display_code_many_law_sections":
            self.capture_depth = 1
            return
        if self.capture_depth:
            self.capture_depth += 1
            if tag in {"script", "style"}:
                self.skip_depth += 1
            if tag in {"br", "p", "div", "h3", "h4", "h5", "h6"}:
                self.parts.append("\n")

    def handle_endtag(self, tag):
        if self.capture_depth:
            if tag in {"script", "style"} and self.skip_depth:
                self.skip_depth -= 1
            if tag in {"p", "div", "h3", "h4", "h5", "h6"}:
                self.parts.append("\n")
            self.capture_depth -= 1

    def handle_data(self, data):
        if self.capture_depth and not self.skip_depth:
            text = data.replace("\xa0", " ")
            if text.strip():
                self.parts.append(text)

    def text_value(self):
        raw = unescape("".join(self.parts)).replace("\r", "")
        raw = re.sub(r"[ \t]+", " ", raw)
        raw = re.sub(r"\n[ \t]+", "\n", raw)
        raw = re.sub(r"\n{3,}", "\n\n", raw)
        return raw.strip()


def fetch(url, insecure=False):
    context = ssl._create_unverified_context() if insecure else None
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 PenalCodeExtractor/1.0"})
    with urlopen(req, timeout=30, context=context) as response:
        return response.read().decode("utf-8", errors="replace")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--branch-url", default=DEFAULT_BRANCH_URL)
    parser.add_argument("--json-output", default="penal_code_part_1_extract.json")
    parser.add_argument("--markdown-output", default="penal_code_part_1_extract.md")
    parser.add_argument("--delay", type=float, default=0.15)
    parser.add_argument("--insecure", action="store_true", help="Disable TLS verification if local trust store fails.")
    args = parser.parse_args()

    branch_html = fetch(args.branch_url, insecure=args.insecure)
    parser_links = LinkParser()
    parser_links.feed(branch_html)
    links = []
    seen = set()
    for link in parser_links.links:
        if link["url"] not in seen:
            seen.add(link["url"])
            links.append(link)

    records = []
    for index, link in enumerate(links, 1):
        print(f"[{index}/{len(links)}] {link['heading']}")
        extractor = TextExtractor()
        extractor.feed(fetch(link["url"], insecure=args.insecure))
        text = extractor.text_value()
        sections = re.findall(r"(?m)^\s*(\d+(?:\.\d+)?[a-z]?\.)\s*$", text)
        records.append({
            "heading": link["heading"],
            "source_url": link["url"],
            "section_count": len(sections),
            "sections": sections,
            "text": text,
        })
        time.sleep(args.delay)

    payload = {
        "source_branch_url": args.branch_url,
        "extracted_link_count": len(records),
        "total_section_markers_found": sum(record["section_count"] for record in records),
        "records": records,
    }
    Path(args.json_output).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    markdown = [
        "# Penal Code Part 1 Extract",
        "",
        f"Source branch: {args.branch_url}",
        f"Extracted code-text links: {len(records)}",
        f"Total section markers found: {payload['total_section_markers_found']}",
        "",
    ]
    for record in records:
        markdown.extend([
            f"## {record['heading']}",
            "",
            f"Source: {record['source_url']}",
            f"Sections found: {record['section_count']}",
            "",
            record["text"],
            "",
        ])
    Path(args.markdown_output).write_text("\n".join(markdown), encoding="utf-8")


if __name__ == "__main__":
    main()
