# Automation Workflow

## Batch Workflow

```text
Upload File
  ↓
Validate File
  ↓
Extract store_url Rows
  ↓
Normalize Domains
  ↓
Remove Duplicates
  ↓
Create Domain Processing Jobs
  ↓
Run Contact Discovery Workflow
  ↓
Rank Contacts
  ↓
Save Results
  ↓
Generate CSV/XLSX Export
```

## Per-Domain Decision Tree

```text
Domain
  ↓
Snov Personal
  ↓
Snov Emails
  ├─ 2 Qualified Contacts Found → Complete
  ↓
Apollo
  ├─ 2 Qualified Contacts Found → Complete
  ↓
LinkedIn
  ├─ 2 Qualified Contacts Found → Complete
  ↓
Website Crawl
  ↓
Generic Contacts
  ↓
Apply Ranking
  ↓
Export Results
```

## Source Stop Rules

- Snov.io is always first.
- Apollo runs only if Snov.io does not satisfy the contact threshold.
- LinkedIn runs only if Apollo does not satisfy the contact threshold.
- Website crawl runs only if all prior sources fail to satisfy the threshold.
- A source can return contacts that are stored for audit, but selected contacts must respect ranking and threshold rules.

## Session Reuse Rules

- Create one authenticated browser context per source/account per worker pool.
- Validate session before starting batch processing.
- Re-login only when session validation fails.
- Avoid login per domain.
- Persist browser storage state securely for the duration of a batch.

## CAPTCHA and Anti-Bot Handling

When CAPTCHA is detected:

1. Mark source attempt as `captcha_detected`.
2. Stop using that source for the affected domain.
3. Apply retry policy only if configured safe.
4. Continue fallback if allowed by platform policy.
5. Log full audit event.

## Proxy Handling

- Proxy settings are environment-driven.
- If `PROXY_ENABLED=true`, all browser and crawler traffic should use configured proxy details.
- Proxy failure must be treated as source attempt failure.
- Add source-level proxy diagnostics in logs.

## Domain Status Values

- `queued`
- `processing`
- `completed`
- `no_contacts_found`
- `invalid_domain`
- `failed`

## Source Attempt Status Values

- `pending`
- `running`
- `success`
- `insufficient_contacts`
- `login_failed`
- `captcha_detected`
- `timeout`
- `proxy_failed`
- `page_structure_changed`
- `failed`

## Export Generation Rules

- Exports can be generated after full batch completion.
- Optional partial export can be generated during processing.
- CSV and XLSX must contain identical columns.
- Export must include invalid-domain rows in report file, but contact export should include only discovered contacts unless a report export is requested.
