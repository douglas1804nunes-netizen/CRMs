const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { env } = require('../config/env');

const pool = new Pool({
  connectionString: env.databaseUrl
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function initDb() {
  const initPath = path.resolve(__dirname, '../../database/init.sql');
  const sql = fs.readFileSync(initPath, 'utf8');
  await pool.query(sql);
}

module.exports = {
  pool,
  query,
  initDb
};
