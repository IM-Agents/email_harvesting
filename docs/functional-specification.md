# Functional Specification

## FR-1 File Upload

### Supported Formats

- `.csv`
- `.xls`
- `.xlsx`

### Required Column

- `store_url`

### Validation Rules

- Reject unsupported file types.
- Reject empty files.
- Reject files missing `store_url`.
- Reject rows with empty `store_url`.
- Mark malformed URLs as invalid.
- Store invalid rows in processing report.

## FR-2 Domain Extraction

### Input Example

`https://www.nike.com`

### Output Example

`nike.com`

### Normalization Rules

Remove:

- `http://`
- `https://`
- `www.`
- query strings
- hash fragments
- trailing slashes

Convert common store/mobile subdomains where possible:

- `shop.brand.com` → `brand.com`
- `m.brand.com` → `brand.com`

### Validation Rejects

- Empty URLs
- Malformed URLs
- Internal IP addresses
- Private IP ranges
- Localhost domains
- Non-domain values

## FR-3 Contact Discovery Workflow

Discovery must execute in this strict sequence:

1. Snov.io personal contacts
2. Snov.io emails tab
3. Apollo
4. LinkedIn
5. Website generic contacts

Stop condition:

- Stop source fallback when at least 2 qualifying contacts are found.

## FR-4 Snov.io Discovery

### Objective

Primary contact discovery source. Snov.io must always run before every other source. Discovery must use authenticated browser automation only and must not call Snov.io APIs.

### Authentication

- Launch Playwright Chromium browser.
- Navigate to `https://app.snov.io/login`.
- Login using `SNOV_EMAIL` and `SNOV_PASSWORD`.
- Validate dashboard, user avatar, or account menu.
- Reuse authenticated session for all domains in the batch.

### Personal Contacts Search

URL pattern:

`https://app.snov.io/domain-search?name={domain}&tab=personal`

Extract:

- email
- first_name
- last_name
- full_name
- job_title
- linkedin_url

Set source:

- `SNOV_PERSONAL`

### Emails Tab Search

Run only if Personal tab produces fewer than required contacts.

URL pattern:

`https://app.snov.io/domain-search?name={domain}&tab=emails`

Extract:

- email
- full_name
- job_title

Set source:

- `SNOV_EMAILS`

## FR-5 Apollo Discovery

### Trigger

Execute only when Snov.io produces zero qualifying contacts or fewer than the minimum target contacts after Snov Personal and Snov Emails.

### Authentication

- Navigate to `https://app.apollo.io`.
- Login using `APOLLO_EMAIL` and `APOLLO_PASSWORD`.
- Validate successful login.
- Reuse authenticated session.

### Company Name Discovery

Use the highest-confidence name from:

1. Domain-derived name, e.g. `nike.com` → `Nike`
2. Homepage `<title>`
3. Open Graph `og:title`
4. Schema.org organization data

### Search and Extraction

- Search company name.
- Open company profile.
- Navigate to People, Employees, or Contacts section.
- Load available contacts.

Extract:

- email
- full_name
- job_title
- linkedin_url
- company_name

Set source:

- `APOLLO`

## FR-6 LinkedIn Company Discovery

### Trigger

Execute only when Apollo yields no qualifying contacts or insufficient qualifying contacts.

### Authentication

- Navigate to `https://www.linkedin.com/login`.
- Login using `LINKEDIN_EMAIL` and `LINKEDIN_PASSWORD`.
- Validate successful login.
- Reuse authenticated session.

### Company Discovery

Extract:

- company_name
- industry
- employee_count
- company_url

### Employee Discovery Search Order

Search executive roles first:

- CEO
- Founder
- Owner
- President
- Director
- Managing Director

If insufficient contacts, search marketing roles:

- Marketing Manager
- Head of Marketing
- VP Marketing
- Growth Manager

If still insufficient, search operational roles:

- Sales Manager
- Operations Manager
- CTO
- Head of Operations
- Head of Sales

Extract:

- full_name
- job_title
- linkedin_profile
- company

Attempt email discovery using:

- Company website
- Public references
- Previous source data

Set source:

- `LINKEDIN`

## FR-7 Generic Website Contact Discovery

### Trigger

Execute only when Snov.io, Apollo, and LinkedIn fail to provide sufficient contacts.

### Crawl Workflow

1. Open homepage.
2. Download HTML.
3. Extract emails from visible text.
4. Extract emails from mailto links.
5. Discover priority internal links.
6. Visit up to 10 pages per domain.
7. Extract emails from footer, header, and contact sections.
8. Deduplicate emails.
9. Validate email format.
10. Store source as `DOMAIN_CONTACT`.

### Priority Pages

- `/contact`
- `/contact-us`
- `/about`
- `/about-us`
- `/team`
- `/company`
- `/support`
- `/help`

### Generic Email Priority

- `info@`
- `contact@`
- `support@`
- `sales@`
- `hello@`
- `admin@`
- `team@`

## FR-8 Ranking and Selection

Minimum target:

- 2 contacts per company

Priority 1:

- CEO
- Founder
- Co-Founder
- Owner
- Managing Director
- Director
- President
- Chief Executive Officer

Priority 2:

- Marketing Manager
- Ecommerce Manager
- Growth Manager
- Business Development Manager
- Head of Marketing
- VP Marketing

Priority 3:

- Operations Manager
- Sales Manager
- IT Manager
- CTO
- Head of Operations
- Head of Sales

Priority 4:

- support@
- contact@
- info@
- hello@
- sales@

Sorting order example:

1. CEO
2. Founder
3. Owner
4. Director
5. Marketing Manager
6. Growth Manager
7. Sales Manager
8. CTO
9. info@
10. support@

## FR-9 Retry Logic

Retry count:

- 3 retries

Backoff:

- 30 seconds
- 60 seconds
- 120 seconds

Failure conditions:

- Login failure
- Website unavailable
- CAPTCHA detected
- Timeout
- Proxy failure
- Unexpected page structure

## FR-10 Export Output

Export formats:

- CSV
- XLSX

Output columns:

- store_url
- domain
- company_name
- email
- contact_name
- job_title
- source
- priority_level
- discovered_at
