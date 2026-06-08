# Backlog and Acceptance Criteria

## Epic 1: File Intake

### Story 1.1: Upload CSV/XLS/XLSX

Acceptance criteria:

- User can upload `.csv`, `.xls`, and `.xlsx` files.
- Unsupported file types are rejected.
- Empty files are rejected.

### Story 1.2: Validate Required Column

Acceptance criteria:

- File must contain `store_url` column.
- Missing column returns clear validation error.

### Story 1.3: Invalid Row Report

Acceptance criteria:

- Empty URLs are flagged.
- Malformed URLs are flagged.
- Internal IPs and localhost are flagged.

## Epic 2: Domain Normalization

### Story 2.1: Extract Root Domain

Acceptance criteria:

- `https://www.nike.com` becomes `nike.com`.
- Query strings and fragments are removed.
- Common subdomains like `shop.` and `m.` are normalized where possible.

### Story 2.2: Deduplicate Domains

Acceptance criteria:

- Duplicate domains in one batch are processed once.
- Duplicate source rows are preserved in validation/report data.

## Epic 3: Snov.io Discovery

### Story 3.1: Snov Login

Acceptance criteria:

- Worker logs in using environment variables.
- Login success is validated.
- Failed login is logged and retried according to retry policy.

### Story 3.2: Snov Personal Extraction

Acceptance criteria:

- Personal tab URL is generated per domain.
- Lazy-loaded rows are fully captured.
- Required fields are stored.

### Story 3.3: Snov Emails Extraction

Acceptance criteria:

- Emails tab runs only if Personal results are insufficient.
- Extracted records use `SNOV_EMAILS` source.

## Epic 4: Apollo Discovery

### Story 4.1: Company Name Resolution

Acceptance criteria:

- Company name is derived from domain, title, OG title, or schema data.
- Highest-confidence company name is used for search.

### Story 4.2: Apollo Contact Extraction

Acceptance criteria:

- Apollo runs only after insufficient Snov results.
- Worker extracts email, full name, job title, LinkedIn URL, and company name.

## Epic 5: LinkedIn Discovery

### Story 5.1: LinkedIn Company Discovery

Acceptance criteria:

- LinkedIn runs only after insufficient Apollo results.
- Company profile fields are extracted.

### Story 5.2: Role-Based Employee Search

Acceptance criteria:

- Executive roles are searched first.
- Marketing roles are searched second.
- Sales/operations/technical roles are searched third.

## Epic 6: Website Generic Contact Discovery

### Story 6.1: Crawl Priority Pages

Acceptance criteria:

- Homepage is crawled.
- Priority internal pages are discovered.
- Maximum 10 pages are visited per domain.

### Story 6.2: Extract Generic Emails

Acceptance criteria:

- Emails are extracted from visible text and mailto links.
- Duplicates are removed.
- Email format is validated.

## Epic 7: Ranking and Selection

### Story 7.1: Apply Priority Rules

Acceptance criteria:

- Executive contacts rank before all others.
- Marketing contacts rank before operational contacts.
- Generic emails rank last.
- Up to 2 selected contacts are marked per domain unless fewer are available.

## Epic 8: Exports and Reports

### Story 8.1: CSV Export

Acceptance criteria:

- CSV export includes all required output columns.
- Export uses selected contacts.

### Story 8.2: XLSX Export

Acceptance criteria:

- XLSX export includes same data as CSV.
- Export status is tracked.

### Story 8.3: Processing Report

Acceptance criteria:

- Report includes invalid rows, failed domains, source counts, success rate, and average processing time.

## Epic 9: Monitoring and Resilience

### Story 9.1: Retry Policy

Acceptance criteria:

- Failed attempts retry up to 3 times.
- Backoff sequence is 30s, 60s, 120s.

### Story 9.2: Audit Logging

Acceptance criteria:

- Source used is logged.
- Timestamp is logged.
- Job outcome is logged.
- Error details are logged.
