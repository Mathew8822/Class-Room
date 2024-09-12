const { Pool } = require("pg");
const db = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/classroommanager?schema=public",
});

async function query(sql, params, callback) {
  return db.query(sql, params, callback);
}

module.exports = { query };
