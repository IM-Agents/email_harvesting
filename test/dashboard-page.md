# Functional Test Cases — Dashboard Page

## Metadata
- **Source:** `docs/frontend-requirements.md` (Dashboard), `docs/api-endpoints.md` (GET `/batches`), README
- **Stack:** React 18 SPA, REST `/api/v1`, Playwright automation
- **Route:** `/dashboard`
- **API base:** `/api/v1`
- **Coverage:** Batch summary metrics, recent activity, navigation, auth gate — TC-POS-001–006, TC-NEG-001–005, TC-EDGE-001–004, TC-LOG-001–004

## Positive Test Cases

### TC-POS-001: Dashboard loads summary metrics for authenticated admin

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in as `admin@emailharvest.local` / `admin123`
- At least one batch exists in the system

**Test data:**
- Auth: default admin

**Steps:**
1. Navigate to `/dashboard`
2. Wait for metrics cards to load

**Expected result:**
- Page renders without error
- Metrics visible: total batches, processing, completed, failed (or equivalent labels)
- Contacts discovered and average discovery rate displayed
- Data matches GET `/api/v1/batches` aggregated counts

### TC-POS-002: Recent batch activity list displays latest batches

**Type:** UI  
**Priority:** High  
**Preconditions:**
- Multiple batches with varied statuses exist

**Test data:**
- Known batch IDs and statuses from seed or prior uploads

**Steps:**
1. Open `/dashboard`
2. Inspect recent activity / batch list section

**Expected result:**
- Recent batches shown with name/id, status badge, and timestamps
- Each row links to `/batches/:batchId`
- List sorted by recency (newest first)

### TC-POS-003: Navigate to upload from dashboard CTA

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- User authenticated on dashboard

**Test data:**
- None

**Steps:**
1. On `/dashboard`, click Upload / New Batch action (button or nav)

**Expected result:**
- Browser navigates to `/upload`
- Upload page components render

### TC-POS-004: Batch status badges use consistent colors

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Batches in `queued`, `processing`, `completed`, `failed`, `paused` states exist

**Test data:**
- Batches covering multiple statuses

**Steps:**
1. Load `/dashboard`
2. Compare status badge styling across rows

**Expected result:**
- Each status has distinct, consistent color/label per design system
- Badges are readable on desktop and mobile

### TC-POS-005: Dashboard responsive layout on tablet

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Viewport ~768px width
- User logged in

**Test data:**
- Admin session

**Steps:**
1. Set tablet viewport
2. Open `/dashboard`

**Expected result:**
- Metric cards reflow without horizontal overflow
- Recent activity remains scrollable/readable
- Navigation accessible

### TC-POS-006: Empty state when no batches exist

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Fresh database or user with zero batches

**Test data:**
- Admin on empty tenant

**Steps:**
1. Navigate to `/dashboard`

**Expected result:**
- Metrics show zeros or em dash appropriately
- Empty-state message with prompt to upload first batch
- Link/button to `/upload` is visible

## Negative Test Cases

### TC-NEG-001: Unauthenticated access to dashboard

**Type:** UI | Security  
**Priority:** High  
**Preconditions:**
- No auth token

**Test data:**
- None

**Steps:**
1. Navigate directly to `/dashboard`

**Expected result:**
- Redirect to `/login`
- No batch metrics leaked in HTML

### TC-NEG-002: Dashboard API failure shows error state

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Simulate GET `/api/v1/batches` failure (500 or network offline)

**Test data:**
- Mock or intercept failed API

**Steps:**
1. Log in and open `/dashboard` with API failing

**Expected result:**
- User-friendly error message or retry control
- Page does not show stale fabricated metrics
- No uncaught JS console errors

### TC-NEG-003: Invalid/expired token on dashboard refresh

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Corrupt or expired token in storage

**Test data:**
- Invalid JWT string

**Steps:**
1. Set invalid token
2. Navigate to `/dashboard`

**Expected result:**
- Redirect to `/login` or global auth error
- Protected batch data not displayed

### TC-NEG-004: Broken link to non-existent batch from stale cache

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Dashboard shows batch id that was deleted server-side

**Test data:**
- `batchId`: deleted id

**Steps:**
1. Click batch link from dashboard list

**Expected result:**
- Batch detail shows not-found or error state
- User can navigate back to dashboard

### TC-NEG-005: Unauthorized role cannot access admin-only dashboard widgets

**Type:** UI | Authorization  
**Priority:** Medium  
**Preconditions:**
- Viewer account logged in (if role-specific widgets exist)

**Test data:**
- Viewer credentials

**Steps:**
1. Open `/dashboard` as viewer

**Expected result:**
- Core metrics visible per role policy
- Admin-only actions (settings shortcuts) hidden or disabled

## Edge Cases

### TC-EDGE-001: Dashboard with very large batch count

**Type:** UI | Performance  
**Priority:** Medium  
**Preconditions:**
- Hundreds+ batches in database

**Test data:**
- Large dataset seed

**Steps:**
1. Load `/dashboard`
2. Measure time to interactive

**Expected result:**
- Summary metrics load within acceptable time (< 3s on dev)
- Recent list paginated or limited (e.g., top 10) — not full table dump
- No browser hang

### TC-EDGE-002: All batches in single status (e.g., all processing)

**Type:** UI  
**Priority:** Low  
**Preconditions:**
- All batches share `processing` status

**Test data:**
- Homogeneous batch set

**Steps:**
1. Open `/dashboard`

**Expected result:**
- Processing count equals total; other status counts zero
- UI remains coherent, no division-by-zero in discovery rate

### TC-EDGE-003: Dashboard refresh while batch status changes

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Batch transitions from `processing` to `completed` during session

**Test data:**
- Active processing batch

**Steps:**
1. Open dashboard showing processing batch
2. Wait for batch completion (or poll)
3. Refresh page

**Expected result:**
- Metrics update to reflect completed state
- Status badge on recent row updates

### TC-EDGE-004: Long batch/file names in recent list

**Type:** UI  
**Priority:** Low  
**Preconditions:**
- Batch with 200+ character uploaded file name

**Test data:**
- Long filename batch

**Steps:**
1. View batch row on dashboard

**Expected result:**
- Text truncates with ellipsis or wraps without breaking layout
- Tooltip or full name available on hover/focus if truncated

## Logical Validation Cases

### TC-LOG-001: Dashboard metrics reconcile with batch detail totals

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Known batch with documented `contacts_found`, status

**Test data:**
- Specific `batchId`

**Steps:**
1. Note contacts discovered on dashboard aggregate
2. Open `/batches/:batchId`
3. Compare contacts found on detail page

**Expected result:**
- Per-batch contacts count matches detail page
- Dashboard aggregate includes this batch in totals

### TC-LOG-002: Navigation graph from dashboard to all primary pages

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Admin logged in

**Test data:**
- Nav links: Upload, Contacts, Reports, Settings

**Steps:**
1. From `/dashboard`, use main navigation to visit each primary route
2. Return to dashboard via nav or logo

**Expected result:**
- Each route loads successfully
- Dashboard remains default home after return

### TC-LOG-003: Processing batch count decreases when batch completes

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- One batch processing; others static

**Test data:**
- Processing batch id

**Steps:**
1. Record processing count on dashboard
2. Allow batch to complete
3. Reload dashboard

**Expected result:**
- Processing count decrements by one
- Completed count increments by one
- Contacts discovered metric increases if batch found contacts

### TC-LOG-004: Average discovery rate calculation consistency

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Multiple completed batches with known contact/domain ratios

**Test data:**
- Batch set with documented stats

**Steps:**
1. Compute expected average discovery rate manually from batch reports
2. Compare to dashboard displayed rate

**Expected result:**
- Displayed average discovery rate matches documented formula (within rounding)
- Rate shows sensible value (0–100%) not NaN or Infinity

---

_Generated using Cursor skill **testcase-generation** · **File:** `dashboard-page.md`_
