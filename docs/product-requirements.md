# Product Requirements Document

## Product Name

Email Harvesting & Contact Discovery Automation Platform

## Version

1.0

## Status

Draft

## Target Users

- Sales Operations teams
- Lead Generation teams
- Business Development teams
- Marketing agencies

## Product Summary

The platform enables users to upload a CSV or Excel file containing store URLs and automatically discover relevant business email contacts through a prioritized multi-source workflow. It processes uploaded store URLs, extracts normalized domains, removes duplicates, validates each domain, then runs sequential discovery against Snov.io, Apollo, LinkedIn, and company websites.

The system prioritizes executive-level contacts and falls back to marketing, operations, sales, technical, and generic company contacts until the required contact threshold is reached.

## Business Goals

- Automate email discovery for large domain batches.
- Reduce manual prospecting effort.
- Maximize executive-level contact acquisition.
- Minimize third-party API credit usage.
- Increase contact coverage through multi-source fallback mechanisms.
- Produce structured exportable contact lists.

## User Goals

Users must be able to:

- Upload CSV, XLS, and XLSX files.
- Process hundreds or thousands of domains.
- Retrieve relevant business contacts automatically.
- Track processing status and completion.
- Download structured CSV and XLSX result files.
- Identify invalid URLs and failed domains.

## In Scope

### Input Processing

- CSV upload
- XLS upload
- XLSX upload
- Required `store_url` column validation
- Invalid row reporting

### Domain Standardization

- URL cleaning
- Domain extraction
- Duplicate removal
- Domain validation
- Subdomain normalization where possible

### Contact Discovery

- Snov.io authenticated browser scraping
- Apollo authenticated browser scraping
- LinkedIn authenticated browser discovery
- Company website crawling and generic email extraction

### Contact Prioritization

- Executive contacts
- Marketing contacts
- Operational contacts
- Generic company contacts

### Output Generation

- CSV export
- XLSX export
- Processing reports
- Audit logs

## Out of Scope for Phase 1

- Email verification services
- Email sending
- CRM integrations
- Lead scoring
- Enrichment APIs
- AI-based contact ranking

## User Stories

### Upload Workflow

1. As a user, I want to upload a CSV file so the system can process store URLs automatically.
2. As a user, I want to upload XLS/XLSX files so I can use existing spreadsheets.
3. As a user, I want invalid URLs identified so I can correct bad input data.
4. As a user, I want duplicate domains removed so processing time is not wasted.
5. As a user, I want progress visibility so I know how many domains remain.
6. As a user, I want downloadable results so I can import contacts into other systems.

### Processing Workflow

1. As a user, I want the system to prioritize executive contacts so outbound campaigns reach decision-makers.
2. As a user, I want fallback discovery sources so contact coverage is maximized.
3. As an admin, I want browser sessions reused so third-party login activity is minimized.
4. As an operator, I want source-level failure logs so I can diagnose failed runs.

## Acceptance Summary

- File upload accepts CSV, XLS, and XLSX only.
- Missing `store_url` column blocks processing with a clear validation error.
- Valid URLs are normalized into root domains where possible.
- Empty URLs, malformed URLs, internal IPs, and localhost domains are rejected.
- Discovery order is strictly Snov.io → Apollo → LinkedIn → Website Crawl.
- Minimum target is 2 contacts per company where available.
- Result exports include all required output columns.
