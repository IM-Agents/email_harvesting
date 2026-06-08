# Functional Test Cases: Login Form

## Metadata
- **Source:** User login with email & password validation
- **Stack:** React + REST API + Playwright
- **Coverage:**
  - Valid credentials → TC-POS-001
  - Invalid email/password → TC-NEG-001, TC-NEG-002
  - Empty fields → TC-NEG-003
  - Boundaries (max length) → TC-EDGE-001
  - Rate limiting → TC-LOG-001

---

## Positive Test Cases

### TC-POS-001: Login with valid credentials

**Type:** UI  
**Priority:** High  
**Preconditions:**
- App running at `BASE_URL`
- User account exists: `user@example.com` / `password123`

**Test data:**
- Email: `user@example.com`
- Password: `password123`

**Steps:**
1. Navigate to `/login`
2. Fill email field with `user@example.com`
3. Fill password field with `password123`
4. Click "Sign In"

**Expected result:**
- Redirect to `/dashboard`
- Greeting "Welcome, user@example.com" visible

**Automation mapping:**
- **Layer:** UI
- **Entry:** `{BASE_URL}/login`
- **Actions:** Fill `[data-testid="email"]`, fill `[data-testid="password"]`, click `button:has-text("Sign In")`
- **Assertions:** URL contains `/dashboard`; text "Welcome" visible

---

## Negative Test Cases

### TC-NEG-001: Login with invalid email format

**Type:** UI  
**Priority:** High  
**Preconditions:** Same as TC-POS-001

**Test data:**
- Email: `invalid-email`
- Password: `password123`

**Steps:**
1. Navigate to `/login`
2. Fill email: `invalid-email`
3. Fill password: `password123`
4. Click "Sign In"

**Expected result:**
- Form shows error: "Invalid email format"
- Not redirected; page remains `/login`

**Automation mapping:**
- **Layer:** UI
- **Actions:** Fill `[data-testid="email"]` with `invalid-email`, click Sign In
- **Assertions:** Error text visible; URL unchanged

---

### TC-NEG-002: Login with wrong password

**Type:** UI  
**Priority:** High  
**Preconditions:** Same as TC-POS-001

**Test data:**
- Email: `user@example.com`
- Password: `wrongpassword`

**Steps:**
1. Navigate to `/login`
2. Fill email: `user@example.com`
3. Fill password: `wrongpassword`
4. Click "Sign In"

**Expected result:**
- Error message: "Invalid email or password"
- Account remains locked/secure

**Automation mapping:**
- **Layer:** API + UI (verify auth endpoint returns 401)
- **Actions:** POST `/api/auth/login` with wrong password, verify response
- **Assertions:** Status 401; error message displayed

---

### TC-NEG-003: Login with empty fields

**Type:** UI  
**Priority:** Medium  
**Preconditions:** Same as TC-POS-001

**Test data:**
- Email: (empty)
- Password: (empty)

**Steps:**
1. Navigate to `/login`
2. Leave both fields empty
3. Click "Sign In"

**Expected result:**
- Error(s): "Email required", "Password required"
- Button may be disabled until fields filled

**Automation mapping:**
- **Layer:** UI
- **Actions:** Click Sign In without filling fields
- **Assertions:** Required-field errors visible; form unchanged

---

## Edge Cases

### TC-EDGE-001: Email at max length (254 chars)

**Type:** UI  
**Priority:** Low  
**Preconditions:** Same as TC-POS-001; valid 254-char email exists

**Test data:**
- Email: (254-char valid email)
- Password: `password123`

**Steps:**
1. Navigate to `/login`
2. Fill email with max-length address
3. Fill password
4. Click "Sign In"

**Expected result:**
- System accepts input; login succeeds or shows standard error (not truncation error)

**Automation mapping:**
- **Layer:** UI
- **Actions:** Fill email field with 254-char string, submit
- **Assertions:** No truncation message; standard behavior

---

### TC-EDGE-002: Whitespace-only password

**Type:** UI  
**Priority:** Low  
**Preconditions:** Same as TC-POS-001

**Test data:**
- Email: `user@example.com`
- Password: `   ` (3 spaces)

**Steps:**
1. Navigate to `/login`
2. Fill email: `user@example.com`
3. Fill password with spaces only
4. Click "Sign In"

**Expected result:**
- Treated as invalid password or auth fails cleanly

**Automation mapping:**
- **Layer:** UI
- **Actions:** Fill password with whitespace
- **Assertions:** Auth fails or validation message shown

---

## Logical Validation Cases

### TC-LOG-001: Rate limiting after 5 failed attempts

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- User account `test@example.com` exists
- No prior failed login attempts

**Test data:**
- Incorrect password: `wrong` (repeated 5 times)

**Steps:**
1. Navigate to `/login`
2. Attempt login with `test@example.com` / `wrong` (5 times)
3. On 6th attempt, try same incorrect credentials

**Expected result:**
- After 5 failures, error message: "Too many attempts. Try again in 15 minutes."
- 6th attempt blocked

**Automation mapping:**
- **Layer:** API
- **Actions:** POST `/api/auth/login` 6 times with wrong password
- **Assertions:** Response 5–6: Status 429; message about rate limit

---

### TC-LOG-002: Session persistence after logout + login

**Type:** Workflow  
**Priority:** Medium  
**Preconditions:**
- User logged in; session active

**Steps:**
1. User logged in at `/dashboard`
2. Click "Logout"
3. Redirect to `/login`
4. Log back in with same credentials

**Expected result:**
- Login succeeds
- Dashboard loads; no stale session errors

**Automation mapping:**
- **Layer:** UI + API
- **Actions:** Logout, clear cookies, log in again
- **Assertions:** New session token issued; dashboard accessible

---

_Generated using Cursor skill **testcase-generation** · **File:** `example-login-tcs.md`_
