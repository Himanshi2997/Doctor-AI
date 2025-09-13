const pool = require("../services/db");
const fs = require("fs");
const path = require("path");

const sqlFile =
  process.argv[2] || path.join(__dirname, "../models/create_tables.sql");

(async () => {
  try {
    const sql = fs.readFileSync(sqlFile, "utf8");
    // Split statements on semicolon and run each non-empty statement
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      console.log("Executing:", stmt.split("\n")[0].slice(0, 120) + "...");
      await pool.query(stmt);
    }

    console.log("All statements executed successfully.");
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Error running SQL file:", err);
    try {
      await pool.end();
    } catch (e) {}
    process.exit(1);
  }
})();
