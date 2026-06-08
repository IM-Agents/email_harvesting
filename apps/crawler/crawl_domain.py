#!/usr/bin/env python3
"""CLI entrypoint — outputs JSON to stdout for Node worker integration."""

from __future__ import annotations

import json
import sys

from crawler.service import crawl_domain


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "domain argument required"}))
        return 1

    domain = sys.argv[1]
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 10

    try:
        result = crawl_domain(domain, max_pages=max_pages)
        print(json.dumps(result))
        return 0
    except Exception as exc:  # noqa: BLE001 — CLI boundary
        print(json.dumps({"success": False, "error": str(exc), "contacts": []}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
