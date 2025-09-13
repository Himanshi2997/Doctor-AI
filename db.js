const { Pool } = require("pg");

// Central DB config - defaults mirror previous hardcoded values but allow env overrides
const dbConfig = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "postgres",
  password: process.env.DB_PASSWORD || "Himanshi@2000",
  port: Number(process.env.DB_PORT) || 5432,
};

const pool = new Pool(dbConfig);

// attach config so other modules (e.g. notifyDoctor) can reuse credentials
pool.config = dbConfig;

module.exports = pool;
