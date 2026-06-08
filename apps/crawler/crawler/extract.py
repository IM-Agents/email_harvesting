import re
from typing import Iterable

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
GENERIC_PREFIXES = ("info", "contact", "support", "sales", "hello", "admin", "team")

PRIORITY_PATHS = (
    "/contact",
    "/contact-us",
    "/about",
    "/about-us",
    "/team",
    "/company",
    "/support",
    "/help",
)


def extract_emails_from_html(html: str) -> set[str]:
    emails: set[str] = set()
    if not html:
        return emails

    for match in EMAIL_RE.findall(html):
        emails.add(match.lower())

    for mailto in re.findall(r'mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', html, re.I):
        emails.add(mailto.lower())

    return emails


def filter_domain_emails(emails: Iterable[str], domain: str) -> list[str]:
    domain = domain.lower()
    filtered = []
    for email in emails:
        email_domain = email.split("@")[-1].lower()
        if email_domain == domain or email_domain.endswith(f".{domain}"):
            filtered.append(email)
    return sorted(set(filtered))


def generic_rank(email: str) -> int:
    local = email.split("@")[0].lower()
    if local in GENERIC_PREFIXES:
        return GENERIC_PREFIXES.index(local)
    return len(GENERIC_PREFIXES)


def emails_to_contacts(emails: list[str], domain: str) -> list[dict]:
    contacts = []
    for email in sorted(emails, key=generic_rank):
        local = email.split("@")[0]
        contacts.append(
            {
                "email": email,
                "full_name": f"{local.title()} Contact",
                "job_title": "Generic Contact",
                "company_name": domain.split(".")[0].title(),
            }
        )
    return contacts
