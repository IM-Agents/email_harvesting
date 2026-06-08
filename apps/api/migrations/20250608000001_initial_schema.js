/**
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable("users", (table) => {
    table.bigIncrements("id").primary()
    table.string("name", 150).notNullable()
    table.string("email", 255).notNullable().unique()
    table.string("password_hash", 255).notNullable()
    table.enum("role", ["admin", "operator", "viewer"]).notNullable().defaultTo("operator")
    table.timestamps(true, true)
  })

  await knex.schema.createTable("batches", (table) => {
    table.bigIncrements("id").primary()
    table.bigInteger("user_id").unsigned().notNullable().references("id").inTable("users")
    table.string("original_file_name", 255).notNullable()
    table.string("file_storage_key", 500).notNullable()
    table
      .enum("status", ["uploaded", "queued", "processing", "paused", "completed", "failed", "cancelled"])
      .notNullable()
      .defaultTo("uploaded")
    table.integer("total_rows").unsigned().defaultTo(0)
    table.integer("valid_domains").unsigned().defaultTo(0)
    table.integer("invalid_rows").unsigned().defaultTo(0)
    table.integer("processed_domains").unsigned().defaultTo(0)
    table.integer("contacts_found").unsigned().defaultTo(0)
    table.integer("failed_domains").unsigned().defaultTo(0)
    table.dateTime("started_at").nullable()
    table.dateTime("completed_at").nullable()
    table.timestamps(true, true)
  })

  await knex.schema.createTable("batch_rows", (table) => {
    table.bigIncrements("id").primary()
    table.bigInteger("batch_id").unsigned().notNullable().references("id").inTable("batches")
    table.integer("row_number").unsigned().notNullable()
    table.text("store_url").nullable()
    table.string("normalized_domain", 255).nullable()
    table.enum("validation_status", ["valid", "invalid", "duplicate"]).notNullable()
    table.string("validation_error", 500).nullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.index(["batch_id", "validation_status"], "idx_batch_rows_batch_status")
    table.index(["normalized_domain"], "idx_batch_rows_domain")
  })

  await knex.schema.createTable("domains", (table) => {
    table.bigIncrements("id").primary()
    table.bigInteger("batch_id").unsigned().notNullable().references("id").inTable("batches")
    table.text("store_url").notNullable()
    table.string("domain", 255).notNullable()
    table.string("company_name", 255).nullable()
    table
      .enum("status", ["queued", "processing", "completed", "no_contacts_found", "invalid_domain", "failed"])
      .notNullable()
      .defaultTo("queued")
    table.integer("selected_contact_count").unsigned().defaultTo(0)
    table.dateTime("processing_started_at").nullable()
    table.dateTime("processing_completed_at").nullable()
    table.text("error_message").nullable()
    table.timestamps(true, true)
    table.unique(["batch_id", "domain"], { indexName: "uq_batch_domain" })
    table.index(["batch_id", "status"], "idx_domains_batch_status")
    table.index(["domain"], "idx_domains_domain")
  })

  await knex.schema.createTable("source_attempts", (table) => {
    table.bigIncrements("id").primary()
    table.bigInteger("domain_id").unsigned().notNullable().references("id").inTable("domains")
    table
      .enum("source", ["SNOV_PERSONAL", "SNOV_EMAILS", "APOLLO", "LINKEDIN", "DOMAIN_CONTACT"])
      .notNullable()
    table
      .enum("status", [
        "pending",
        "running",
        "success",
        "insufficient_contacts",
        "login_failed",
        "captcha_detected",
        "timeout",
        "proxy_failed",
        "page_structure_changed",
        "failed",
      ])
      .notNullable()
      .defaultTo("pending")
    table.tinyint("attempt_number").unsigned().notNullable().defaultTo(1)
    table.integer("contacts_extracted").unsigned().defaultTo(0)
    table.integer("qualifying_contacts").unsigned().defaultTo(0)
    table.dateTime("started_at").nullable()
    table.dateTime("completed_at").nullable()
    table.text("error_message").nullable()
    table.json("raw_metadata").nullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.index(["domain_id", "source"], "idx_source_attempts_domain_source")
    table.index(["status"], "idx_source_attempts_status")
  })

  await knex.schema.createTable("contacts", (table) => {
    table.bigIncrements("id").primary()
    table.bigInteger("batch_id").unsigned().notNullable().references("id").inTable("batches")
    table.bigInteger("domain_id").unsigned().notNullable().references("id").inTable("domains")
    table.bigInteger("source_attempt_id").unsigned().nullable().references("id").inTable("source_attempts")
    table.text("store_url").notNullable()
    table.string("domain", 255).notNullable()
    table.string("company_name", 255).nullable()
    table.string("email", 255).nullable()
    table.string("first_name", 150).nullable()
    table.string("last_name", 150).nullable()
    table.string("full_name", 255).nullable()
    table.string("job_title", 255).nullable()
    table.string("linkedin_url", 500).nullable()
    table.tinyint("priority_level").unsigned().notNullable()
    table.integer("rank_score").notNullable().defaultTo(999)
    table.boolean("is_selected").notNullable().defaultTo(false)
    table.dateTime("discovered_at").notNullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.index(["batch_id"], "idx_contacts_batch")
    table.index(["domain_id", "is_selected"], "idx_contacts_domain_selected")
    table.index(["email"], "idx_contacts_email")
  })

  await knex.schema.createTable("exports", (table) => {
    table.bigIncrements("id").primary()
    table.bigInteger("batch_id").unsigned().notNullable().references("id").inTable("batches")
    table.enum("format", ["csv", "xlsx"]).notNullable()
    table.enum("status", ["queued", "processing", "completed", "failed"]).notNullable().defaultTo("queued")
    table.string("storage_key", 500).nullable()
    table.string("file_name", 255).nullable()
    table.boolean("include_report").notNullable().defaultTo(false)
    table.text("error_message").nullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.dateTime("completed_at").nullable()
    table.index(["batch_id", "status"], "idx_exports_batch_status")
  })

  await knex.schema.createTable("audit_logs", (table) => {
    table.bigIncrements("id").primary()
    table.bigInteger("batch_id").unsigned().nullable().references("id").inTable("batches")
    table.bigInteger("domain_id").unsigned().nullable().references("id").inTable("domains")
    table.string("event_type", 100).notNullable()
    table.string("source", 50).nullable()
    table.text("message").notNullable()
    table.json("details").nullable()
    table.timestamp("created_at").defaultTo(knex.fn.now())
    table.index(["batch_id"], "idx_audit_batch")
    table.index(["domain_id"], "idx_audit_domain")
    table.index(["event_type"], "idx_audit_event_type")
  })

  await knex.schema.createTable("app_settings", (table) => {
    table.string("key", 100).primary()
    table.json("value").notNullable()
    table.timestamp("updated_at").defaultTo(knex.fn.now())
  })
}

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("app_settings")
  await knex.schema.dropTableIfExists("audit_logs")
  await knex.schema.dropTableIfExists("exports")
  await knex.schema.dropTableIfExists("contacts")
  await knex.schema.dropTableIfExists("source_attempts")
  await knex.schema.dropTableIfExists("domains")
  await knex.schema.dropTableIfExists("batch_rows")
  await knex.schema.dropTableIfExists("batches")
  await knex.schema.dropTableIfExists("users")
}
