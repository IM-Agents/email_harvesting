# RAID Log

## Risks

1. Third-party UI changes may break Playwright automation.
   - Mitigation: create source-specific selectors, smoke tests, and fallback failure detection.

2. Rate limiting and anti-bot systems may block discovery.
   - Mitigation: add configurable concurrency, source-specific throttling, proxy controls, and CAPTCHA detection.

3. Login sessions may expire during large batches.
   - Mitigation: validate session before each source run and re-login safely when needed.

4. CAPTCHA challenges may stop automation.
   - Mitigation: detect CAPTCHA and mark source attempt as blocked instead of looping retries.

5. Duplicate or low-quality contacts may pollute exports.
   - Mitigation: normalize emails, deduplicate by domain/email, apply ranking and selected-contact logic.

6. Browser workers may consume high memory at 10,000+ domain scale.
   - Mitigation: isolate workers, limit browser contexts, recycle contexts periodically, and monitor memory.

## Assumptions

1. Users provide files with a `store_url` column.
2. Third-party accounts are valid and credentials are supplied as environment variables.
3. Browser automation can access target sites through configured network/proxy.
4. Some domains may not have public contacts.
5. Phase 1 does not require CRM integration, email sending, or email verification.

## Issues

No current implementation issues yet. Initial build has not started.

## Dependencies

1. Snov.io account access.
2. Apollo account access.
3. LinkedIn account access.
4. Stable proxy infrastructure if required.
5. MySQL availability.
6. Redis/queue availability.
7. S3-compatible storage availability.
8. Playwright-compatible deployment environment.

## Open Decisions

1. Confirm whether Phase 1 should include application user roles beyond admin/operator/viewer.
2. Confirm preferred object storage provider.
3. Confirm queue technology: Redis/BullMQ is recommended.
4. Confirm whether partial exports should be available during processing.
