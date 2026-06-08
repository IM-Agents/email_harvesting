# Database Schema and Key Queries

## Database

Recommended database: MySQL 8+

## Tables

### users

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'operator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### batches

```sql
CREATE TABLE batches (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  file_storage_key VARCHAR(500) NOT NULL,
  status ENUM('uploaded', 'queued', 'processing', 'paused', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'uploaded',
  total_rows INT UNSIGNED DEFAULT 0,
  valid_domains INT UNSIGNED DEFAULT 0,
  invalid_rows INT UNSIGNED DEFAULT 0,
  processed_domains INT UNSIGNED DEFAULT 0,
  contacts_found INT UNSIGNED DEFAULT 0,
  failed_domains INT UNSIGNED DEFAULT 0,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_batches_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### batch_rows

```sql
CREATE TABLE batch_rows (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT UNSIGNED NOT NULL,
  row_number INT UNSIGNED NOT NULL,
  store_url TEXT NULL,
  normalized_domain VARCHAR(255) NULL,
  validation_status ENUM('valid', 'invalid', 'duplicate') NOT NULL,
  validation_error VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_batch_rows_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  INDEX idx_batch_rows_batch_status (batch_id, validation_status),
  INDEX idx_batch_rows_domain (normalized_domain)
);
```

### domains

```sql
CREATE TABLE domains (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT UNSIGNED NOT NULL,
  store_url TEXT NOT NULL,
  domain VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NULL,
  status ENUM('queued', 'processing', 'completed', 'no_contacts_found', 'invalid_domain', 'failed') NOT NULL DEFAULT 'queued',
  selected_contact_count INT UNSIGNED DEFAULT 0,
  processing_started_at DATETIME NULL,
  processing_completed_at DATETIME NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_domains_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  UNIQUE KEY uq_batch_domain (batch_id, domain),
  INDEX idx_domains_batch_status (batch_id, status),
  INDEX idx_domains_domain (domain)
);
```

### source_attempts

```sql
CREATE TABLE source_attempts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  domain_id BIGINT UNSIGNED NOT NULL,
  source ENUM('SNOV_PERSONAL', 'SNOV_EMAILS', 'APOLLO', 'LINKEDIN', 'DOMAIN_CONTACT') NOT NULL,
  status ENUM('pending', 'running', 'success', 'insufficient_contacts', 'login_failed', 'captcha_detected', 'timeout', 'proxy_failed', 'page_structure_changed', 'failed') NOT NULL DEFAULT 'pending',
  attempt_number TINYINT UNSIGNED NOT NULL DEFAULT 1,
  contacts_extracted INT UNSIGNED DEFAULT 0,
  qualifying_contacts INT UNSIGNED DEFAULT 0,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  error_message TEXT NULL,
  raw_metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_source_attempts_domain FOREIGN KEY (domain_id) REFERENCES domains(id),
  INDEX idx_source_attempts_domain_source (domain_id, source),
  INDEX idx_source_attempts_status (status)
);
```

### contacts

```sql
CREATE TABLE contacts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT UNSIGNED NOT NULL,
  domain_id BIGINT UNSIGNED NOT NULL,
  source_attempt_id BIGINT UNSIGNED NULL,
  store_url TEXT NOT NULL,
  domain VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  first_name VARCHAR(150) NULL,
  last_name VARCHAR(150) NULL,
  full_name VARCHAR(255) NULL,
  job_title VARCHAR(255) NULL,
  linkedin_url VARCHAR(500) NULL,
  priority_level TINYINT UNSIGNED NOT NULL,
  rank_score INT NOT NULL DEFAULT 999,
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  discovered_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contacts_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  CONSTRAINT fk_contacts_domain FOREIGN KEY (domain_id) REFERENCES domains(id),
  CONSTRAINT fk_contacts_source_attempt FOREIGN KEY (source_attempt_id) REFERENCES source_attempts(id),
  INDEX idx_contacts_batch (batch_id),
  INDEX idx_contacts_domain_selected (domain_id, is_selected),
  INDEX idx_contacts_email (email),
  INDEX idx_contacts_source_priority (source_attempt_id, priority_level)
);
```

### exports

```sql
CREATE TABLE exports (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT UNSIGNED NOT NULL,
  format ENUM('csv', 'xlsx') NOT NULL,
  status ENUM('queued', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'queued',
  storage_key VARCHAR(500) NULL,
  file_name VARCHAR(255) NULL,
  include_report BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_exports_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  INDEX idx_exports_batch_status (batch_id, status)
);
```

### audit_logs

```sql
CREATE TABLE audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT UNSIGNED NULL,
  domain_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(100) NOT NULL,
  source VARCHAR(50) NULL,
  message TEXT NOT NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_batch (batch_id),
  INDEX idx_audit_domain (domain_id),
  INDEX idx_audit_event_type (event_type)
);
```

## Key Queries

### Batch Progress

```sql
SELECT
  b.id,
  b.status,
  b.total_rows,
  b.valid_domains,
  b.invalid_rows,
  COUNT(d.id) AS total_domains,
  SUM(d.status = 'completed') AS completed_domains,
  SUM(d.status = 'failed') AS failed_domains,
  SUM(d.status = 'no_contacts_found') AS no_contacts_found_domains,
  COUNT(c.id) AS selected_contacts
FROM batches b
LEFT JOIN domains d ON d.batch_id = b.id
LEFT JOIN contacts c ON c.batch_id = b.id AND c.is_selected = TRUE
WHERE b.id = ?
GROUP BY b.id;
```

### Contacts Per Source

```sql
SELECT
  sa.source,
  COUNT(c.id) AS contacts_found
FROM contacts c
JOIN source_attempts sa ON sa.id = c.source_attempt_id
WHERE c.batch_id = ?
GROUP BY sa.source
ORDER BY contacts_found DESC;
```

### Selected Export Rows

```sql
SELECT
  c.store_url,
  c.domain,
  c.company_name,
  c.email,
  c.full_name AS contact_name,
  c.job_title,
  sa.source,
  c.priority_level,
  c.discovered_at
FROM contacts c
LEFT JOIN source_attempts sa ON sa.id = c.source_attempt_id
WHERE c.batch_id = ?
  AND c.is_selected = TRUE
ORDER BY c.domain ASC, c.rank_score ASC, c.discovered_at ASC;
```

### Failed Domains

```sql
SELECT
  d.domain,
  d.status,
  d.error_message,
  d.processing_started_at,
  d.processing_completed_at
FROM domains d
WHERE d.batch_id = ?
  AND d.status IN ('failed', 'no_contacts_found', 'invalid_domain')
ORDER BY d.updated_at DESC;
```

### Source Failure Diagnostics

```sql
SELECT
  d.domain,
  sa.source,
  sa.status,
  sa.attempt_number,
  sa.error_message,
  sa.started_at,
  sa.completed_at
FROM source_attempts sa
JOIN domains d ON d.id = sa.domain_id
WHERE d.batch_id = ?
  AND sa.status NOT IN ('success', 'insufficient_contacts')
ORDER BY sa.created_at DESC;
```
