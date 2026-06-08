# Implementation Plan

## Milestone 1: Foundation and Data Model

Deliverables:

- Project setup for React, Node.js, MySQL, worker queue, and Python crawler service.
- Database migrations.
- Application authentication.
- File storage integration.
- Base API response/error conventions.

Acceptance criteria:

- Backend health check works.
- Database schema is migrated.
- File storage can upload and retrieve test files.
- React app can authenticate and call API.

## Milestone 2: Upload, Parsing, and Domain Normalization

Deliverables:

- CSV/XLS/XLSX upload endpoint.
- `store_url` validation.
- URL/domain normalization service.
- Duplicate detection.
- Invalid row report.
- Upload UI.

Acceptance criteria:

- Supported files upload successfully.
- Files missing `store_url` are rejected.
- Valid URLs normalize to expected domains.
- Invalid/internal/local domains are flagged.

## Milestone 3: Batch Queue and Progress Tracking

Deliverables:

- Batch creation.
- Domain job queue.
- Worker concurrency settings.
- Progress APIs.
- Batch detail UI.

Acceptance criteria:

- A batch can be queued, started, paused, resumed, and cancelled.
- Domain statuses update during processing.
- UI shows live progress.

## Milestone 4: Snov.io Browser Automation

Deliverables:

- Playwright login flow.
- Session validation and reuse.
- Personal tab extraction.
- Emails tab extraction.
- Snov source attempts and audit logs.

Acceptance criteria:

- Browser logs into Snov.io using environment variables.
- Session is reused across multiple domains.
- Contacts are extracted and stored.
- Snov runs before all other sources.

## Milestone 5: Apollo Browser Automation

Deliverables:

- Apollo login flow.
- Company name discovery.
- Apollo company search.
- People/contact extraction.
- Apollo source attempts and logs.

Acceptance criteria:

- Apollo runs only after insufficient Snov results.
- Contacts are extracted and ranked.
- Failures and timeouts are logged.

## Milestone 6: LinkedIn Browser Discovery

Deliverables:

- LinkedIn login flow.
- Company profile discovery.
- Role-based employee searches.
- Public email discovery attempt.
- LinkedIn source attempts and logs.

Acceptance criteria:

- LinkedIn runs only after insufficient Apollo results.
- Executive roles are searched first.
- Marketing and operational roles are searched as fallback.

## Milestone 7: Website Crawler

Deliverables:

- Python crawler service.
- Homepage fetch.
- Priority page discovery.
- Email regex extraction.
- Mailto extraction.
- Generic email prioritization.

Acceptance criteria:

- Crawler visits up to 10 pages per domain.
- Emails are extracted from visible text and mailto links.
- Duplicate emails are removed.
- `DOMAIN_CONTACT` source is stored.

## Milestone 8: Ranking, Exports, and Reporting

Deliverables:

- Ranking algorithm.
- Selected contact logic.
- CSV export.
- XLSX export.
- Processing report.
- Reporting UI.

Acceptance criteria:

- Selected contacts follow priority rules.
- Exports contain required columns.
- Reports show discovery rate, source breakdown, and failures.

## Milestone 9: Hardening and Production Readiness

Deliverables:

- Retry/backoff implementation.
- CAPTCHA detection.
- Proxy failure handling.
- Rate limiting.
- Error dashboards.
- Security review.
- Load test for 10,000+ domains.

Acceptance criteria:

- Retry policy works with 30s, 60s, 120s backoff.
- Source failures are isolated.
- System supports configured concurrency.
- Secrets are not stored in code or database.
