# Functional Test Cases — Auth & Batch Workflow (Cross-Page)

## Metadata
- **Source:** README core pages, `docs/product-requirements.md` (Upload & Processing workflows), `docs/api-endpoints.md` (auth, batches, contacts, exports)
- **Stack:** React 18 SPA, REST `/api/v1`, Playwright automation
- **Flow:** Login → Upload → Start → View contacts → Export
- **API base:** `/api/v1`
- **Default credentials:** `admin@emailharvest.local` / `admin123`
- **Coverage:** End-to-end happy path, failure recovery, state consistency across routes — TC-POS-001–006, TC-NEG-001–005, TC-EDGE-001–004, TC-LOG-001–005

## Positive Test Cases

### TC-POS-001: Full happy path — login, upload CSV, start, view contacts, export CSV

**Type:** Business Logic | E2E  
**Priority:** High  
**Preconditions:**
- Application running with MySQL migrated and admin seeded
- Sample CSV with `store_url` column and 5+ valid domains

**Test data:**
- `email`: `admin@emailharvest.local`
- `password`: `admin123`
- File: `workflow-stores.csv`
- Export format: `csv`

**Steps:**
1. Navigate to `/login` and authenticate
2. Confirm redirect to `/dashboard`
3. Go to `/upload`, upload CSV, review validation summary
4. Click Start Processing; land on `/batches/:batchId`
5. Wait for batch to reach `completed` (or partial with contacts)
6. Navigate to `/contacts` and filter by domain from uploaded file
7. Return to batch detail and trigger CSV export with `include_report: true`
8. Download export via `/api/v1/exports/{exportId}/download`

**Expected result:**
- Each step succeeds without manual intervention
- `batch_id` consistent across upload, detail, and export APIs
- Contacts visible on `/contacts` match batch `contacts_found`
- Downloaded CSV contains uploaded store_url values and discovered contact fields

### TC-POS-002: Login → upload XLSX → pause → resume → complete → export XLSX

**Type:** Business Logic | E2E  
**Priority:** High  
**Preconditions:**
- Admin logged in path from step 1
- XLSX file with `store_url` column (10+ rows)

**Test data:**
- File: `workflow-stores.xlsx`
- Export format: `xlsx`

**Steps:**
1. Login and upload XLSX on `/upload`
2. Start batch and open `/batches/:batchId`
3. Pause while `processing`
4. Resume until `completed`
5. Export XLSX from batch detail

**Expected result:**
- Pause/resume transitions reflected in batch status
- XLSX export downloads successfully
- No duplicate domain processing after pause/resume

### TC-POS-003: Workflow preserves auth across page navigations

**Type:** Business Logic | Security  
**Priority:** High  
**Preconditions:**
- Fresh browser context

**Test data:**
- Admin credentials

**Steps:**
1. Login once at `/login`
2. Visit `/dashboard` → `/upload` → `/batches/:id` → `/contacts` → `/reports` without re-login

**Expected result:**
- No redirect to login mid-flow
- Authorization header present on all `/api/v1/*` calls

### TC-POS-004: Upload invalid rows then verify reports invalid URL count

**Type:** Business Logic | E2E  
**Priority:** Medium  
**Preconditions:**
- CSV with 3 invalid and 7 valid rows

**Test data:**
- Mixed validity file

**Steps:**
1. Complete login and upload flow
2. Start and complete batch processing
3. Open `/reports` for this batch

**Expected result:**
- Upload showed `invalid_rows: 3`
- Reports page invalid URL count equals 3
- Valid domains processed count equals 7 (minus duplicates if any)

### TC-POS-005: Domain drill-down from batch workflow to domain timeline

**Type:** Business Logic | E2E  
**Priority:** Medium  
**Preconditions:**
- Completed batch from TC-POS-001

**Test data:**
- Known domain from CSV

**Steps:**
1. From `/batches/:batchId` open domain list
2. Click domain row → `/domains/:domainId`
3. Verify source timeline and contacts

**Expected result:**
- Domain normalized from original store_url in CSV
- Timeline shows source attempts in Snov → Apollo → LinkedIn → Website order
- Contacts on domain page appear in global `/contacts` filter for same domain

### TC-POS-006: Dashboard reflects new batch after workflow start

**Type:** Business Logic | E2E  
**Priority:** Medium  
**Preconditions:**
- Note dashboard batch count before workflow

**Test data:**
- New upload in workflow

**Steps:**
1. Record total batches on `/dashboard`
2. Run upload + start through `/upload`
3. Return to `/dashboard`

**Expected result:**
- Total batches incremented by 1
- New batch appears in recent activity with correct status

## Negative Test Cases

### TC-NEG-001: Attempt upload mid-workflow after session expiry

**Type:** Business Logic | Security  
**Priority:** High  
**Preconditions:**
- User logged in then token cleared before upload

**Test data:**
- Cleared auth storage

**Steps:**
1. Login successfully
2. Clear token/localStorage manually
3. Navigate to `/upload` and attempt file upload

**Expected result:**
- Redirect to `/login` or 401 on upload API
- No batch created while unauthenticated

### TC-NEG-002: Start processing without store_url column blocks workflow

**Type:** Business Logic | E2E  
**Priority:** High  
**Preconditions:**
- Logged in admin

**Test data:**
- CSV missing `store_url` column

**Steps:**
1. Login → `/upload`
2. Upload invalid schema file
3. Attempt to proceed to batch processing

**Expected result:**
- Workflow stops at validation; no `/batches/:id` processing page with active job
- Error message references required `store_url` column

### TC-NEG-003: Export before batch produces contacts

**Type:** Business Logic | E2E  
**Priority:** High  
**Preconditions:**
- Batch started but zero contacts so far

**Test data:**
- Early-stage processing batch

**Steps:**
1. Complete login and upload/start
2. Immediately attempt export on batch detail

**Expected result:**
- Export disabled or queued with empty-data warning per UX rules
- Workflow does not silently download empty file without notice

### TC-NEG-004: Navigate to batch detail with wrong batchId after upload

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Valid batch created

**Test data:**
- Incorrect id in URL

**Steps:**
1. After upload, manually change URL to `/batches/999999999`

**Expected result:**
- Not found state; user can navigate back to dashboard/upload
- Valid batch from upload still accessible via dashboard link

### TC-NEG-005: Cancel batch mid-workflow stops contact growth

**Type:** Business Logic | E2E  
**Priority:** High  
**Preconditions:**
- Processing batch from upload workflow

**Test data:**
- Active batch id

**Steps:**
1. Login → upload → start
2. Cancel batch from detail page
3. Check `/contacts` for new contacts from this batch after cancel

**Expected result:**
- Batch status cancelled
- Contact count stabilizes; no new contacts attributed after cancel

## Edge Cases

### TC-EDGE-001: Workflow with single-row CSV

**Type:** Business Logic | E2E  
**Priority:** Medium  
**Preconditions:**
- CSV with one valid store_url

**Test data:**
- 1-row file

**Steps:**
1. Run full workflow for single domain
2. Export results

**Expected result:**
- Batch completes with `valid_domains: 1`
- Export contains zero or more contacts for that one domain
- Reports metrics remain valid (no divide-by-zero)

### TC-EDGE-002: Duplicate domains in file processed once

**Type:** Business Logic | E2E  
**Priority:** High  
**Preconditions:**
- CSV with duplicate store_urls

**Test data:**
- 10 rows, 4 unique domains

**Steps:**
1. Upload and complete workflow
2. Compare `total_rows`, `valid_domains`, processed count

**Expected result:**
- Processing count reflects deduplicated domains (4)
- Contacts not duplicated per duplicate row

### TC-EDGE-003: Browser refresh mid-batch on detail page

**Type:** Business Logic | E2E  
**Priority:** Medium  
**Preconditions:**
- Batch processing in flight

**Test data:**
- Active batch id from session

**Steps:**
1. Reach `/batches/:batchId` during processing
2. Hard refresh browser
3. Confirm still authenticated and progress visible

**Expected result:**
- Session persists; no redirect to login
- Progress resumes display from current API state

### TC-EDGE-004: Workflow using API base path under QA subpath preview

**Type:** Business Logic | E2E  
**Priority:** High  
**Preconditions:**
- Preview running with `PUBLIC_PATH='/qa/email_harvesting'`

**Test data:**
- Same credentials and CSV

**Steps:**
1. Open `http://127.0.0.1:{PORT}/qa/email_harvesting/login`
2. Run abbreviated workflow: login → upload → start
3. Verify API calls hit `/qa/email_harvesting/api/v1/...` not bare `/v1/...`

**Expected result:**
- No 404 on API routes due to missing `/api` prefix
- Workflow completes under subpath deploy

## Logical Validation Cases

### TC-LOG-001: End-to-end data lineage — store_url in file equals export store_url column

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Completed workflow with contacts

**Test data:**
- Known store_url values in source CSV

**Steps:**
1. Record store_urls from input CSV
2. Download export CSV
3. Match store_url column in export to inputs

**Expected result:**
- Every exported contact row references a store_url from the upload (normalized linkage)
- No store_urls in export that were not in batch input set

### TC-LOG-002: Batch report metrics match workflow observations

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Completed TC-POS-001 batch

**Test data:**
- Same batchId

**Steps:**
1. Collect contacts_found from batch detail at completion
2. Open `/reports` for batch
3. Compare discovery rate and source breakdown

**Expected result:**
- Report metrics consistent with batch detail and contacts page counts
- Executive rate ≤ 100% and ≤ discovery rate contextually

### TC-LOG-003: Logout and re-login does not orphan in-progress batch

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Batch processing on server

**Test data:**
- Processing batch id

**Steps:**
1. Start workflow batch
2. Logout (if available) or clear session and login again
3. Navigate to `/batches/:batchId` via dashboard

**Expected result:**
- Batch continues server-side processing
- Re-authenticated user sees current progress

### TC-LOG-004: Operator role workflow excludes admin settings but includes upload path

**Type:** Business Logic | Authorization  
**Priority:** High  
**Preconditions:**
- Operator account seeded

**Test data:**
- Operator credentials

**Steps:**
1. Login as operator
2. Run upload → start → contacts view
3. Attempt `/settings`

**Expected result:**
- Upload and batch workflow succeed for operator if role permits
- Settings route blocked for non-admin

### TC-LOG-005: Idempotent export requests do not corrupt download

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Completed batch with contacts

**Test data:**
- Double POST export same format

**Steps:**
1. Request CSV export twice in succession
2. Poll both export ids
3. Download each file

**Expected result:**
- Both exports complete or second returns existing job reference
- Downloaded files contain equivalent contact data
- No server error on duplicate export

---

_Generated using Cursor skill **testcase-generation** · **File:** `auth-batch-workflow.md`_
