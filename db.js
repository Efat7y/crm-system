const mysql = require("mysql2")
const mysqlPromise = require("mysql2/promise")

const DB_HOST = process.env.DB_HOST || "localhost"
const DB_PORT = Number.parseInt(process.env.DB_PORT || "3306", 10)
const DB_USER = process.env.DB_USER || "root"
const DB_PASSWORD = process.env.DB_PASSWORD || ""
const DB_NAME = process.env.DB_NAME || "crm"

const baseConnectionConfig = {
  host: DB_HOST,
  port: Number.isNaN(DB_PORT) ? 3306 : DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  charset: "utf8mb4_unicode_ci"
}

const pool = mysql.createPool({
  ...baseConnectionConfig,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

const db = pool.promise()

async function ensureDatabaseExists() {
  const connection = await mysqlPromise.createConnection(baseConnectionConfig)

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(DB_NAME)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
  } finally {
    await connection.end()
  }
}

db.ensureDatabaseExists = ensureDatabaseExists
db.databaseName = DB_NAME
db.connectionInfo = {
  host: baseConnectionConfig.host,
  port: baseConnectionConfig.port,
  user: baseConnectionConfig.user
}

module.exports = db
