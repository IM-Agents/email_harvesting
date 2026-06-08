# Figma Navigation Tree — Email Harvesting Platform

**File Key:** `q0ikOnEhEtl5wsnqI72SE0`  
**Prototype Base URL:** https://www.figma.com/design/q0ikOnEhEtl5wsnqI72SE0/Email-Harvesting-Platform

## Requirements

- Responsive UI for mobile (375px), tablet (768px), and desktop (1440px)
- Eight core application pages per `docs/frontend-requirements.md`
- Design tokens: primary `#2563EB`, success `#16A34A`, warning `#D97706`, error `#DC2626`
- Accessibility: labeled inputs, keyboard navigation, ARIA progress indicators

## Navigation Tree

[ENTRY] /login → Login Page  
├── [SCREEN] Login — Desktop → https://www.figma.com/design/q0ikOnEhEtl5wsnqI72SE0?node-id=0-1  
├── [SCREEN] Login — Tablet → _responsive CSS; Figma frame pending MCP quota_  
├── [SCREEN] Login — Mobile → _responsive CSS; Figma frame pending MCP quota_  

[AUTH] /dashboard → Dashboard  
├── [SCREEN] Dashboard — Desktop → _create in Figma page `02 — Dashboard`_  

[AUTH] /upload → Upload Batch  
├── [SCREEN] Upload Batch — Desktop → _create in Figma page `03 — Upload`_  

[AUTH] /batches/:id → Batch Detail  
├── [SCREEN] Batch Detail — Desktop → _create in Figma page `04 — Batch Detail`_  

[AUTH] /domains/:id → Domain Detail  
├── [SCREEN] Domain Detail — Desktop → _create in Figma page `05 — Domain Detail`_  

[AUTH] /contacts → Contacts Results  
├── [SCREEN] Contacts — Desktop → _create in Figma page `06 — Contacts`_  

[AUTH] /reports → Reports  
├── [SCREEN] Reports — Desktop → _create in Figma page `07 — Reports`_  

[AUTH] /settings → Settings (admin)  
├── [SCREEN] Settings — Desktop → _create in Figma page `08 — Settings`_  

## Responsive note

Figma file created; Login page frames were started via MCP before rate limit. Tablet/mobile variants and remaining pages are implemented in React with Tailwind responsive utilities (`sm:`, `lg:`). Append verified `node-id` URLs when Figma MCP quota resets.

## App routes ↔ test files

| Route | Context | Test file |
|-------|---------|-----------|
| `/login` | Public auth | `test/login-page.md` |
| `/dashboard` | Authenticated home | `test/dashboard-page.md` |
| `/upload` | File upload | `test/upload-batch-page.md` |
| `/batches/:batchId` | Batch progress | `test/batch-detail-page.md` |
| `/domains/:domainId` | Domain inspection | `test/domain-detail-page.md` |
| `/contacts` | Contact browse/filter | `test/contacts-page.md` |
| `/reports` | Batch reporting | `test/reports-page.md` |
| `/settings` | Admin settings | `test/settings-page.md` |
| Auth + batch workflow | Cross-page | `test/auth-batch-workflow.md` |

## Agent Figma TODO (page-wise)

| # | Page | Figma page name | Status |
|---|------|-----------------|--------|
| 1 | Design Tokens | Design Tokens | Planned |
| 2 | Login | 01 — Login | In progress (file created) |
| 3 | Dashboard | 02 — Dashboard | Pending |
| 4 | Upload Batch | 03 — Upload | Pending |
| 5 | Batch Detail | 04 — Batch Detail | Pending |
| 6 | Domain Detail | 05 — Domain Detail | Pending |
| 7 | Contacts | 06 — Contacts | Pending |
| 8 | Reports | 07 — Reports | Pending |
| 9 | Settings | 08 — Settings | Pending |
