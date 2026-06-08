const knex = require("knex")
const knexConfig = require("../../knexfile")

const config = knexConfig.development || knexConfig

const db = knex(config)

module.exports = { db }
