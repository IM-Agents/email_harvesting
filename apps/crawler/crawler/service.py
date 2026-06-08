from __future__ import annotations

import re
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

from crawler.extract import (
    PRIORITY_PATHS,
    emails_to_contacts,
    extract_emails_from_html,
    filter_domain_emails,
)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def _normalize_domain(domain: str) -> str:
    value = domain.strip().lower()
    value = re.sub(r"^https?://", "", value)
    value = value.split("/")[0]
    return value.lstrip("www.")


def _fetch(url: str, timeout: int = 20) -> str | None:
    try:
        response = requests.get(
            url,
            timeout=timeout,
            headers={"User-Agent": USER_AGENT},
            allow_redirects=True,
        )
        if response.status_code >= 400:
            return None
        return response.text
    except requests.RequestException:
        return None


def _discover_links(html: str, base_url: str, domain: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    links: list[str] = []
    seen: set[str] = set()

    for path in PRIORITY_PATHS:
        candidate = urljoin(base_url, path)
        if candidate not in seen:
            seen.add(candidate)
            links.append(candidate)

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if not href or href.startswith("#") or href.startswith("mailto:"):
            continue
        full = urljoin(base_url, href)
        parsed = urlparse(full)
        host = parsed.netloc.lower().lstrip("www.")
        if host != domain and not host.endswith(f".{domain}"):
            continue
        path = parsed.path.lower()
        if any(p in path for p in ("contact", "about", "team", "company", "support", "help")):
            if full not in seen:
                seen.add(full)
                links.append(full)

    return links


def crawl_domain(domain: str, max_pages: int = 10) -> dict:
    domain = _normalize_domain(domain)
    base_url = f"https://{domain}"
    visited: set[str] = set()
    queue = [base_url]
    all_emails: set[str] = set()

    while queue and len(visited) < max_pages:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        html = _fetch(url)
        if not html:
            continue

        page_emails = extract_emails_from_html(html)
        all_emails.update(page_emails)

        for link in _discover_links(html, base_url, domain):
            if link not in visited and link not in queue and len(visited) + len(queue) < max_pages:
                queue.append(link)

    domain_emails = filter_domain_emails(all_emails, domain)
    contacts = emails_to_contacts(domain_emails, domain)

    return {
        "success": True,
        "domain": domain,
        "pages_visited": len(visited),
        "contacts": contacts,
    }
