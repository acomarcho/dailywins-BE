const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/dailywins";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;