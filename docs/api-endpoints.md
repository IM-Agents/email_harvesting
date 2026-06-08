# API Endpoints

## API Conventions

Base path:

`/api/v1`

Response format:

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

Error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "store_url column is required",
    "details": {}
  }
}
```

## Authentication

### POST `/auth/login`

Purpose:

- Authenticate application users.

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User"
    }
  }
}
```

## File Upload and Batch Management

### POST `/batches/upload`

Purpose:

- Upload CSV/XLS/XLSX file and create processing batch.

Request:

- Multipart form-data
- Field: `file`

Validation:

- File extension must be `.csv`, `.xls`, or `.xlsx`.
- Required column: `store_url`.

Response:

```json
{
  "success": true,
  "data": {
    "batch_id": 1001,
    "status": "queued",
    "total_rows": 1200,
    "valid_domains": 1150,
    "invalid_rows": 50
  }
}
```

### GET `/batches`

Purpose:

- List user batches.

Query parameters:

- `page`
- `limit`
- `status`

### GET `/batches/{batchId}`

Purpose:

- Get batch detail and progress.

Response fields:

- batch_id
- status
- uploaded_file_name
- total_rows
- valid_domains
- invalid_rows
- processed_domains
- contacts_found
- failed_domains
- created_at
- completed_at

### POST `/batches/{batchId}/start`

Purpose:

- Start queued batch processing.

Response:

```json
{
  "success": true,
  "data": {
    "batch_id": 1001,
    "status": "processing"
  }
}
```

### POST `/batches/{batchId}/pause`

Purpose:

- Pause processing for a batch.

### POST `/batches/{batchId}/resume`

Purpose:

- Resume paused batch processing.

### POST `/batches/{batchId}/cancel`

Purpose:

- Cancel queued or processing batch.

## Domain Processing

### GET `/batches/{batchId}/domains`

Purpose:

- List domains for a batch.

Query parameters:

- `page`
- `limit`
- `status`
- `domain`

### GET `/domains/{domainId}`

Purpose:

- Get domain processing detail.

### POST `/domains/{domainId}/retry`

Purpose:

- Retry failed domain processing.

## Contacts

### GET `/batches/{batchId}/contacts`

Purpose:

- List discovered contacts for a batch.

Query parameters:

- `source`
- `priority_level`
- `domain`
- `page`
- `limit`

### GET `/domains/{domainId}/contacts`

Purpose:

- List contacts discovered for one domain.

## Exports

### POST `/batches/{batchId}/exports`

Purpose:

- Generate CSV or XLSX export.

Request:

```json
{
  "format": "csv",
  "include_report": true
}
```

Response:

```json
{
  "success": true,
  "data": {
    "export_id": 501,
    "status": "queued"
  }
}
```

### GET `/exports/{exportId}`

Purpose:

- Get export generation status.

### GET `/exports/{exportId}/download`

Purpose:

- Download generated export file.

## Reports and Audit Logs

### GET `/batches/{batchId}/report`

Purpose:

- Get processing summary report.

Response includes:

- total domains
- valid domains
- invalid rows
- contacts found
- contacts per source
- success rate
- failure rate
- average processing time

### GET `/batches/{batchId}/audit-logs`

Purpose:

- List source attempts and system events.

Query parameters:

- `domain_id`
- `source`
- `status`
- `from`
- `to`

## Admin Configuration

### GET `/admin/settings`

Purpose:

- Get worker, retry, timeout, and source configuration.

### PATCH `/admin/settings`

Purpose:

- Update operational settings.

Example:

```json
{
  "worker_count": 10,
  "source_timeouts": {
    "snov": 30000,
    "apollo": 30000,
    "linkedin": 30000,
    "website": 20000
  },
  "retry_backoff_seconds": [30, 60, 120]
}
```
