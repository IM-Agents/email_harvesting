# Functional Test Cases — Login Page

## Metadata
- **Source:** `docs/frontend-requirements.md` (Login Page), `docs/api-endpoints.md` (POST `/auth/login`), README default credentials
- **Stack:** React 18 SPA, REST `/api/v1`, Playwright automation
- **Route:** `/login`
- **API base:** `/api/v1`
- **Coverage:** Authentication UI, session redirect, validation, accessibility, role entry — TC-POS-001–006, TC-NEG-001–006, TC-EDGE-001–004, TC-LOG-001–004

## Positive Test Cases

### TC-POS-001: Successful login with default admin credentials

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Application is running and `/login` is reachable
- User `admin@emailharvest.local` exists with password `admin123`

**Test data:**
- `email`: `admin@emailharvest.local`
- `password`: `admin123`

**Steps:**
1. Navigate to `/login`
2. Enter email and password in labeled fields
3. Click the Login button

**Expected result:**
- POST `/api/v1/auth/login` returns `success: true` with `access_token` and user object
- Browser redirects to `/dashboard`
- Auth token is stored (localStorage or session per app convention)
- No error message is shown on the login form

### TC-POS-002: Login form displays required fields and labels

**Type:** UI  
**Priority:** High  
**Preconditions:**
- User is logged out
- `/login` loads without errors

**Test data:**
- None

**Steps:**
1. Navigate to `/login`
2. Inspect form controls and associated labels

**Expected result:**
- Email input is visible with accessible label
- Password input is visible with accessible label (masked)
- Login submit button is visible and enabled
- Error message area exists but is empty on initial load

### TC-POS-003: Password field masks input

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- User is on `/login`

**Test data:**
- `password`: `admin123`

**Steps:**
1. Focus the password field
2. Type the password value

**Expected result:**
- Characters are not displayed in plain text
- Input type is `password` or equivalent masking behavior

### TC-POS-004: Submit login via keyboard (Enter key)

**Type:** UI | Accessibility  
**Priority:** Medium  
**Preconditions:**
- Valid admin account exists

**Test data:**
- `email`: `admin@emailharvest.local`
- `password`: `admin123`

**Steps:**
1. Navigate to `/login`
2. Fill email and password fields
3. Press Enter while focus is in the password field

**Expected result:**
- Form submits equivalent to clicking Login
- User is redirected to `/dashboard`
- POST `/api/v1/auth/login` succeeds

### TC-POS-005: Authenticated user visiting `/login` redirects away

**Type:** UI | Business Logic  
**Priority:** Medium  
**Preconditions:**
- User is already logged in with valid session

**Test data:**
- Session from TC-POS-001

**Steps:**
1. With active session, navigate directly to `/login`

**Expected result:**
- User is redirected to `/dashboard` (or default authenticated landing route)
- Login form is not shown

### TC-POS-006: Login page is responsive on mobile viewport

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Viewport width ≤ 768px

**Test data:**
- Valid credentials as in TC-POS-001

**Steps:**
1. Set viewport to mobile width
2. Open `/login`
3. Complete login

**Expected result:**
- Form fields and button remain usable without horizontal scroll
- Login succeeds and redirect works on mobile layout

## Negative Test Cases

### TC-NEG-001: Login with incorrect password

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Admin user exists

**Test data:**
- `email`: `admin@emailharvest.local`
- `password`: `wrongpassword`

**Steps:**
1. Navigate to `/login`
2. Enter valid email and invalid password
3. Click Login

**Expected result:**
- POST `/api/v1/auth/login` returns `success: false` with auth error
- User remains on `/login`
- Clear error message displayed (e.g., invalid credentials)
- Password field may be cleared or retained per UX; token is not stored

### TC-NEG-002: Login with unknown email

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Email is not registered

**Test data:**
- `email`: `unknown@example.com`
- `password`: `anypassword`

**Steps:**
1. Navigate to `/login`
2. Submit the form

**Expected result:**
- Login fails with non-success API response
- Generic or specific invalid-credentials message shown
- No redirect to dashboard

### TC-NEG-003: Submit with empty email

**Type:** UI | Validation  
**Priority:** High  
**Preconditions:**
- User on `/login`

**Test data:**
- `email`: (empty)
- `password`: `admin123`

**Steps:**
1. Leave email empty
2. Enter password
3. Click Login

**Expected result:**
- Client-side validation prevents submit or API returns validation error
- Inline error tied to email field
- No auth token issued

### TC-NEG-004: Submit with empty password

**Type:** UI | Validation  
**Priority:** High  
**Preconditions:**
- User on `/login`

**Test data:**
- `email`: `admin@emailharvest.local`
- `password`: (empty)

**Steps:**
1. Enter email only
2. Click Login

**Expected result:**
- Validation error for required password
- No successful login or redirect

### TC-NEG-005: Submit with malformed email format

**Type:** UI | Validation  
**Priority:** Medium  
**Preconditions:**
- User on `/login`

**Test data:**
- `email`: `not-an-email`
- `password`: `admin123`

**Steps:**
1. Enter malformed email
2. Submit form

**Expected result:**
- Email format validation error displayed
- POST `/api/v1/auth/login` is not sent or returns validation error

### TC-NEG-006: Protected route access without authentication

**Type:** UI | Business Logic  
**Priority:** High  
**Preconditions:**
- No auth token in browser storage
- Clear cookies/session if applicable

**Test data:**
- Target route: `/dashboard`

**Steps:**
1. Navigate directly to `/dashboard` without logging in

**Expected result:**
- User is redirected to `/login`
- Original destination may be preserved for post-login redirect (if implemented)

## Edge Cases

### TC-EDGE-001: Email with leading/trailing whitespace

**Type:** UI | Validation  
**Priority:** Medium  
**Preconditions:**
- Valid admin account exists

**Test data:**
- `email`: `  admin@emailharvest.local  `
- `password`: `admin123`

**Steps:**
1. Enter email with surrounding spaces
2. Submit login

**Expected result:**
- Email is trimmed before API call OR login succeeds/fails consistently with documented behavior
- No spurious validation failure if trim is applied

### TC-EDGE-002: Very long password input

**Type:** UI | Security  
**Priority:** Low  
**Preconditions:**
- User on `/login`

**Test data:**
- `email`: `admin@emailharvest.local`
- `password`: 512-character string

**Steps:**
1. Paste oversized password
2. Submit form

**Expected result:**
- Application does not crash
- Login fails gracefully with error message
- No token issued

### TC-EDGE-003: Rapid double-click on Login button

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Valid credentials ready

**Test data:**
- `email`: `admin@emailharvest.local`
- `password`: `admin123`

**Steps:**
1. Fill form
2. Double-click Login quickly

**Expected result:**
- Only one login request is processed (button disabled or request deduplicated)
- Single redirect to `/dashboard`
- No duplicate session artifacts

### TC-EDGE-004: Login after session expiry

**Type:** UI | Business Logic  
**Priority:** Medium  
**Preconditions:**
- User had valid session that has expired or token was cleared server-side

**Test data:**
- Expired or invalid token in storage

**Steps:**
1. Attempt to access `/dashboard` → redirected to `/login`
2. Log in again with valid credentials

**Expected result:**
- Fresh token issued
- Redirect to `/dashboard` succeeds
- Previously expired token is replaced

## Logical Validation Cases

### TC-LOG-001: Login success enables navigation to all authenticated routes

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- User logged out

**Test data:**
- Admin credentials

**Steps:**
1. Log in via `/login`
2. Navigate sequentially to `/dashboard`, `/upload`, `/contacts`, `/reports`

**Expected result:**
- Each route loads without redirect back to login
- API calls include Authorization header with issued token

### TC-LOG-002: Logout (if exposed) invalidates session and blocks protected routes

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- User logged in as admin

**Test data:**
- Active session

**Steps:**
1. Trigger logout from app shell (if available) or clear token per app flow
2. Navigate to `/dashboard`

**Expected result:**
- User redirected to `/login`
- Subsequent API calls without token return 401

### TC-LOG-003: Error message clears on corrected re-submit

**Type:** UI | Business Logic  
**Priority:** Medium  
**Preconditions:**
- User on `/login`

**Test data:**
- First attempt: wrong password; second: correct password

**Steps:**
1. Submit invalid credentials and observe error
2. Correct password and submit again

**Expected result:**
- Error message clears on successful login
- Dashboard loads without stale error state

### TC-LOG-004: Non-admin user login lands on permitted routes only

**Type:** Business Logic | Authorization  
**Priority:** High  
**Preconditions:**
- Operator or viewer test account exists (if seeded)

**Test data:**
- Non-admin credentials per database seed

**Steps:**
1. Log in with operator/viewer account
2. Attempt to open `/settings`

**Expected result:**
- Login succeeds and dashboard accessible
- `/settings` is blocked, hidden from nav, or shows forbidden state for non-admin roles

---

_Generated using Cursor skill **testcase-generation** · **File:** `login-page.md`_
