# Architecture

## Recommended Architecture

Use a modular service architecture with a React frontend, Node.js API backend, worker queue, Playwright browser automation workers, Python website crawler service, MySQL database, and S3-compatible file storage.

## System Components

### 1. React Frontend

Responsibilities:

- Upload CSV/XLS/XLSX files.
- Show upload validation errors.
- Show batch processing progress.
- Show per-domain status and summary metrics.
- Provide CSV/XLSX download actions.
- Render responsive UI for mobile, tablet, and desktop.

### 2. Node.js API Backend

Responsibilities:

- User/session authentication.
- File upload orchestration.
- Input validation.
- Batch/job creation.
- Domain normalization orchestration.
- Queue dispatch.
- Job status APIs.
- Export generation APIs.
- Audit log APIs.

### 3. Queue and Worker Layer

Recommended options:

- Redis + BullMQ
- RabbitMQ
- SQS-compatible queue

Responsibilities:

- Process uploaded files asynchronously.
- Dispatch domain discovery jobs.
- Control concurrency at 5, 10, 25, or 50 workers.
- Retry failed source attempts using configured backoff.
- Prevent duplicate processing for the same batch/domain.

### 4. Browser Automation Workers

Technology:

- Playwright
- Chromium
- Persistent browser contexts

Responsibilities:

- Login to Snov.io using environment variables.
- Login to Apollo using environment variables.
- Login to LinkedIn using environment variables.
- Reuse browser sessions across the batch.
- Detect CAPTCHA, timeout, proxy, and login failures.
- Extract contacts from target pages.

### 5. Python Website Crawler Service

Technology:

- Python
- Requests
- BeautifulSoup
- Playwright for dynamic websites

Responsibilities:

- Fetch homepages and priority internal pages.
- Extract visible emails and mailto links.
- Visit up to 10 pages per domain.
- Validate and deduplicate generic emails.

### 6. MySQL Database

Responsibilities:

- Store users.
- Store uploaded batch metadata.
- Store normalized domains.
- Store discovered contacts.
- Store source-level attempts.
- Store processing reports.
- Store audit logs.
- Store export metadata.

### 7. S3-Compatible Object Storage

Responsibilities:

- Store original uploaded files.
- Store generated CSV exports.
- Store generated XLSX exports.
- Store processing reports where needed.

## High-Level Data Flow

1. Frontend uploads file to backend.
2. Backend stores file and creates a batch record.
3. Backend parses file and creates domain records.
4. Queue dispatches per-domain discovery jobs.
5. Workers run strict source fallback.
6. Contacts are ranked and stored.
7. Progress metrics are updated.
8. Export generation creates CSV/XLSX file.
9. User downloads export.

## Scalability Requirements

- Support 10,000+ domains per batch.
- Process domains in parallel with configurable worker count: 5, 10, 25, or 50.
- Use source-specific rate limits to reduce account lockout and anti-bot risk.
- Use persistent sessions to avoid repeated login attempts.
- Keep processing idempotent so retries do not create duplicates.

## Recommended Concurrency Strategy

- File parsing worker: 1 per uploaded batch.
- Domain processing workers: configurable.
- Browser session pool: source-specific, account-specific.
- Website crawler workers: independent pool with stricter timeout.
- Export generation worker: async after batch completes or on-demand.

## Deployment Considerations

- Separate browser workers from API containers due to higher memory usage.
- Store browser session state securely in encrypted local/container storage or secured object storage.
- Run workers behind proxy infrastructure when required.
- Add health checks for API, queue, MySQL, Redis, object storage, and browser worker readiness.
