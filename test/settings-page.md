# Functional Test Cases — Settings Page

## Metadata
- **Source:** `docs/frontend-requirements.md` (Settings — admin only), `docs/api-endpoints.md` (GET/PATCH `/admin/settings`), `docs/environment-variables.md`
- **Stack:** React 18 SPA, REST `/api/v1`, Playwright automation
- **Route:** `/settings`
- **API base:** `/api/v1`
- **Admin credentials:** `admin@emailharvest.local` / `admin123`
- **Coverage:** worker_count, source timeouts, retry backoff, proxy indicator, headless indicator — TC-POS-001–006, TC-NEG-001–006, TC-EDGE-001–004, TC-LOG-001–004

## Positive Test Cases

### TC-POS-001: Admin user loads settings page with current configuration

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in as admin (`admin@emailharvest.local` / `admin123`)

**Test data:**
- Admin session

**Steps:**
1. Navigate to `/settings`
2. Wait for GET `/api/v1/admin/settings`

**Expected result:**
- Page loads for admin role
- Worker count displayed (e.g., default 10 or env `WORKER_COUNT`)
- Source timeout values shown for snov, apollo, linkedin, website
- Retry backoff values listed
- Proxy enabled indicator reflects `PROXY_ENABLED` config
- Headless browser indicator reflects `HEADLESS` config

### TC-POS-002: Update worker_count via settings form

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Admin on `/settings`

**Test data:**
- `worker_count`: `25` (allowed tier: 5, 10, 25, or 50 per architecture)

**Steps:**
1. Change worker count field to 25
2. Save settings
3. Confirm PATCH `/api/v1/admin/settings`

**Expected result:**
- API returns success
- UI shows updated worker count after save
- Success toast or inline confirmation

### TC-POS-003: Update source timeout values

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Admin on settings page

**Test data:**
```json
{
  "source_timeouts": {
    "snov": 30000,
    "apollo": 30000,
    "linkedin": 30000,
    "website": 20000
  }
}
```

**Steps:**
1. Modify one or more timeout fields
2. Save settings

**Expected result:**
- PATCH accepts partial or full timeout object
- Saved values persist on page reload

### TC-POS-004: Update retry backoff seconds array

**Type:** UI | API  
**Priority:** Medium  
**Preconditions:**
- Admin on settings

**Test data:**
- `retry_backoff_seconds`: `[30, 60, 120]`

**Steps:**
1. Edit retry backoff values
2. Save

**Expected result:**
- Values stored and displayed correctly
- Order preserved [30, 60, 120]

### TC-POS-005: Proxy enabled indicator read-only display

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Environment has `PROXY_ENABLED=true` or `false`

**Test data:**
- Current env proxy state

**Steps:**
1. View proxy section on settings page

**Expected result:**
- Indicator shows enabled/disabled status from server config
- If read-only, no editable fields for PROXY_HOST/PORT (env-driven per docs)
- Help text explains proxy is environment-configured

### TC-POS-006: Headless browser indicator display

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- `HEADLESS=true` or `false` in environment

**Test data:**
- Headless env value

**Steps:**
1. View headless indicator on settings

**Expected result:**
- Shows whether browser automation runs headless
- Matches GET `/admin/settings` response or derived env snapshot

## Negative Test Cases

### TC-NEG-001: Non-admin user denied access to settings

**Type:** UI | Authorization  
**Priority:** High  
**Preconditions:**
- Operator or viewer account logged in (if seeded)

**Test data:**
- Non-admin credentials

**Steps:**
1. Navigate to `/settings`
2. Attempt GET `/api/v1/admin/settings` directly

**Expected result:**
- UI shows forbidden message or redirects away
- API returns 403 Forbidden
- Settings form not editable

### TC-NEG-002: Unauthenticated access to settings

**Type:** UI | Security  
**Priority:** High  
**Preconditions:**
- No session

**Test data:**
- None

**Steps:**
1. Navigate to `/settings`

**Expected result:**
- Redirect to `/login`

### TC-NEG-003: Save worker_count with invalid value (0 or negative)

**Type:** UI | Validation  
**Priority:** High  
**Preconditions:**
- Admin on settings

**Test data:**
- `worker_count`: `0`

**Steps:**
1. Enter invalid worker count
2. Attempt save

**Expected result:**
- Client or server validation error
- PATCH rejected; previous value retained

### TC-NEG-004: Save worker_count outside allowed tiers

**Type:** UI | Validation  
**Priority:** Medium  
**Preconditions:**
- Allowed values: 5, 10, 25, 50

**Test data:**
- `worker_count`: `7`

**Steps:**
1. Enter non-tier worker count
2. Save

**Expected result:**
- Validation error specifying allowed values
- No partial apply

### TC-NEG-005: PATCH settings with malformed JSON body

**Type:** API  
**Priority:** Medium  
**Preconditions:**
- Admin auth token

**Test data:**
- Invalid request body

**Steps:**
1. Send PATCH `/api/v1/admin/settings` with malformed payload via API client

**Expected result:**
- 400 validation error with clear message
- Settings unchanged

### TC-NEG-006: Settings API failure on load

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Simulate GET `/admin/settings` 500

**Test data:**
- API error mock

**Steps:**
1. Open `/settings` under failure

**Expected result:**
- Error state with retry
- Form not shown with hardcoded defaults masquerading as live config

## Edge Cases

### TC-EDGE-001: Save settings with maximum worker_count (50)

**Type:** UI | Business Logic  
**Priority:** Medium  
**Preconditions:**
- Admin access

**Test data:**
- `worker_count`: `50`

**Steps:**
1. Set worker count to maximum tier
2. Save and reload page

**Expected result:**
- Value persists at 50
- Warning about resource usage may appear (if documented in UI)

### TC-EDGE-002: Concurrent admin saves from two sessions

**Type:** Business Logic  
**Priority:** Low  
**Preconditions:**
- Two admin browser sessions

**Test data:**
- Session A sets worker 10; Session B sets worker 25

**Steps:**
1. Save from session A then session B in quick succession
2. Reload both

**Expected result:**
- Last write wins or optimistic locking error shown
- No corrupted config object

### TC-EDGE-003: Very large timeout value entry

**Type:** UI | Validation  
**Priority:** Low  
**Preconditions:**
- Admin on settings

**Test data:**
- `snov` timeout: `999999999`

**Steps:**
1. Enter excessive timeout
2. Save

**Expected result:**
- Rejected by max bound validation OR accepted with documented upper limit
- No server crash

### TC-EDGE-004: Settings page keyboard navigation and save

**Type:** Accessibility  
**Priority:** Medium  
**Preconditions:**
- Admin logged in

**Test data:**
- Tab through form fields

**Steps:**
1. Tab to worker count, change value via keyboard
2. Tab to Save and activate with Enter/Space

**Expected result:**
- Save succeeds without mouse
- Focus order logical; labels announced for screen readers

## Logical Validation Cases

### TC-LOG-001: Updated worker_count reflected in subsequent batch processing concurrency

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Ability to observe worker concurrency (logs or processing rate)

**Test data:**
- worker_count changed from 10 to 5

**Steps:**
1. PATCH worker_count to 5
2. Start new large batch
3. Monitor parallel domain processing

**Expected result:**
- Concurrent domain jobs respect new worker limit (within measurement tolerance)
- Setting change applies without API restart if hot-reload supported, or documented restart required

### TC-LOG-002: Settings GET after PATCH returns updated values

**Type:** API | Business Logic  
**Priority:** High  
**Preconditions:**
- Admin token

**Test data:**
- PATCH then GET

**Steps:**
1. PATCH `/admin/settings` with new timeouts
2. GET `/admin/settings` immediately

**Expected result:**
- Response body matches patched values exactly
- No stale cache in API layer

### TC-LOG-003: Admin nav shows Settings link; operator nav hides it

**Type:** Business Logic | Authorization  
**Priority:** High  
**Preconditions:**
- Admin and operator accounts

**Test data:**
- Role comparison

**Steps:**
1. Log in as admin — check main navigation
2. Log in as operator — check navigation

**Expected result:**
- Settings link visible only for admin role
- Direct URL still blocked for operator (TC-NEG-001)

### TC-LOG-004: Discard unsaved changes on navigate away

**Type:** UI | Business Logic  
**Priority:** Medium  
**Preconditions:**
- Admin editing settings

**Test data:**
- Modified worker count not saved

**Steps:**
1. Change worker count
2. Navigate to `/dashboard` without saving
3. Return to `/settings`

**Expected result:**
- Unsaved changes discarded OR browser prompts to confirm leave
- Reloaded values match server state, not abandoned edit

---

_Generated using Cursor skill **testcase-generation** · **File:** `settings-page.md`_
