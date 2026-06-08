# Email Harvesting & Contact Discovery Automation Platform

## Project Summary

Build an automation platform that accepts CSV/XLS/XLSX files containing `store_url` values, normalizes domains, discovers business contacts through a strict multi-source fallback workflow, ranks contacts by role priority, and exports structured CSV/XLSX results.

The product is designed for Sales Operations, Lead Generation, Business Development, and Marketing Agency teams that need high-volume contact discovery while minimizing third-party API credit consumption.

## Required Stack

- Frontend: React 18
- Backend API: Node.js 24.13.1
- Database: MySQL 8+
- Browser automation: Playwright with Chromium
- Website crawler service: Python, Requests, BeautifulSoup, Playwright
- File processing: CSV, XLS, XLSX parsers
- Storage: S3-compatible object storage for uploaded files and generated exports
- Queue/workers: Redis + BullMQ or equivalent queue system
- Authentication: application user authentication plus environment-based credentials for third-party portals

## Core Workflow

1. User uploads CSV/XLS/XLSX file with required `store_url` column.
2. System validates file and extracts URLs.
3. System normalizes each URL into a domain.
4. Duplicate and invalid domains are removed or flagged.
5. For each valid domain, system runs contact discovery in this strict sequence:
   - Snov.io personal contacts
   - Snov.io emails tab
   - Apollo
   - LinkedIn
   - Website generic contact discovery
6. System stops fallback once minimum qualifying contact threshold is met.
7. System ranks selected contacts by priority level.
8. System stores results, processing reports, failures, and audit logs.
9. User downloads CSV/XLSX export.

## Minimum Contact Target

- Target: 2 contacts per company/domain
- Preferred contacts: CEO, Founder, Co-Founder, Owner, Managing Director, Director, President, Chief Executive Officer
- Fallback categories: Marketing, Growth, Business Development, Operations, Sales, IT, CTO, then generic emails

## Key Product Constraints

- Snov.io, Apollo, and LinkedIn discovery must use authenticated browser automation only.
- No Snov.io or Apollo APIs may be called.
- No third-party API credits should be consumed during Phase 1 discovery.
- Source fallback order must be strictly enforced.
- Browser sessions must be reused during a batch to avoid repeated logins.
- Credentials must be loaded from environment variables.
- Credentials must not be stored in source code or database.
- Frontend UI must be responsive for mobile, tablet, and desktop.

## Documentation Index

- [Product Requirements](./product-requirements.md)
- [Architecture](./architecture.md)
- [Functional Specification](./functional-specification.md)
- [API Endpoints](./api-endpoints.md)
- [Database Schema and Queries](./database-schema.md)
- [Automation Workflow](./automation-workflow.md)
- [Frontend Requirements](./frontend-requirements.md)
- [Environment Variables](./environment-variables.md)
- [Implementation Plan](./implementation-plan.md)
- [Backlog and Acceptance Criteria](./backlog.md)
- [RAID Log](./raid-log.md)

## Success Metrics

- Contact discovery rate: at least 70% of domains return at least one contact.
- Executive contact rate: at least 50% of domains return executive-level contacts.
- Average processing time: under 60 seconds per domain.
- Export success rate: at least 99% successful export generation.
- Manual edit reduction: at least 80% of projects require less than 20% manual edits.

## Important Compliance Note

This platform depends on browser automation against third-party websites. Implementation must respect applicable laws, contractual obligations, website terms, rate limits, privacy requirements, and account security policies. Add rate limiting, proxy controls, audit logging, CAPTCHA detection, and safe failure handling before production-scale processing.
