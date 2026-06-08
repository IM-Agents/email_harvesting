# Frontend Requirements

## Framework

- React 18

## Responsiveness Requirement

The UI/design must be fully responsive across:

- Mobile
- Tablet
- Desktop

All upload, progress, report, and export screens must remain usable on small screens without horizontal overflow.

## Core Pages

### 1. Login Page

Purpose:

- Allow application users to authenticate.

Components:

- Email input
- Password input
- Login button
- Error message area

### 2. Dashboard

Purpose:

- Show batch summary and recent processing activity.

Metrics:

- Total batches
- Processing batches
- Completed batches
- Failed batches
- Contacts discovered
- Average discovery rate

### 3. Upload Batch Page

Purpose:

- Upload CSV/XLS/XLSX files.

Components:

- Drag-and-drop upload area
- File type hint
- Required column hint: `store_url`
- Validation results
- Start processing button

### 4. Batch Detail Page

Purpose:

- Track processing progress.

Sections:

- Batch metadata
- Progress bar
- Domain status counts
- Contacts found
- Contacts per source
- Failure count
- Average processing time
- Export actions

### 5. Domain Detail Drawer/Page

Purpose:

- Inspect one domain’s discovery path.

Sections:

- Original store URL
- Normalized domain
- Company name
- Source attempts timeline
- Discovered contacts
- Selected contacts
- Error details

### 6. Contacts Results Page

Purpose:

- Browse discovered contacts.

Filters:

- Domain
- Source
- Priority level
- Job title
- Has email

Columns:

- store_url
- domain
- company_name
- email
- contact_name
- job_title
- source
- priority_level
- discovered_at

### 7. Reports Page

Purpose:

- Show batch-level reporting.

Charts/metrics:

- Contact discovery rate
- Executive contact rate
- Contacts per source
- Failure rate
- Average processing time
- Invalid URL count

### 8. Settings Page

Purpose:

- Admin-only operational settings.

Fields:

- Worker count
- Source timeout values
- Retry backoff values
- Proxy enabled indicator
- Headless browser indicator

## UX Requirements

- Show clear upload requirements before file selection.
- Display invalid URL report after parsing.
- Show live progress during processing.
- Provide status labels with consistent colors.
- Disable export button until contacts or reports are available.
- Allow users to download CSV and XLSX separately.
- Show warning if third-party source login fails.
- Provide copyable error details for failed domains.

## Accessibility Requirements

- Keyboard-accessible upload and actions.
- Proper labels for inputs.
- Sufficient color contrast.
- ARIA-friendly progress indicators.
- Error messages tied to relevant controls.

## Suggested Component Structure

```text
src/
  components/
    FileUpload/
    ProgressSummary/
    BatchStatusBadge/
    ContactsTable/
    SourceTimeline/
    ExportActions/
    MetricsCards/
  pages/
    LoginPage/
    DashboardPage/
    UploadBatchPage/
    BatchDetailPage/
    ContactsPage/
    ReportsPage/
    SettingsPage/
  services/
    apiClient.ts
    batchService.ts
    contactService.ts
    exportService.ts
  hooks/
    useBatchProgress.ts
    useFileUpload.ts
  utils/
    formatters.ts
    constants.ts
```
