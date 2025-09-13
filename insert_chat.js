// Usage:
// node scripts/insert_chat.js '{"name":"Alice","email":"alice@example.com","symptoms":["chest pain"],"answers":{"How long": "2 days"}}'
// or
// node scripts/insert_chat.js /absolute/path/to/chat.json

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// DB config - default to postgres database per your request
const pool = new Pool({
  user: process.env.PGUSER || "postgres",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "postgres",
  password: process.env.PGPASSWORD || "Himanshi@2000",
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
});

async function upsertChat(chat) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // find existing patient by email
    let res = await client.query("SELECT id FROM patients WHERE email = $1", [
      chat.email,
    ]);
    let patientId;
    if (res.rows.length > 0) {
      patientId = res.rows[0].id;
      // update name if different
      await client.query("UPDATE patients SET name = $1 WHERE id = $2", [
        chat.name,
        patientId,
      ]);
    } else {
      res = await client.query(
        "INSERT INTO patients (name, email) VALUES ($1, $2) RETURNING id",
        [chat.name, chat.email]
      );
      patientId = res.rows[0].id;
    }

    // Insert or update symptoms
    const symptoms = chat.symptoms || [];
    const answers = chat.answers || {};

    for (const symptom of symptoms) {
      // prepare followups json: include all answers (you can filter by question if you have mapping)
      const followupsJson = JSON.stringify(answers);

      // check if symptom exists for this patient
      res = await client.query(
        "SELECT id FROM symptoms WHERE patient_id = $1 AND symptom = $2",
        [patientId, symptom]
      );
      if (res.rows.length > 0) {
        // update
        await client.query("UPDATE symptoms SET followups = $1 WHERE id = $2", [
          followupsJson,
          res.rows[0].id,
        ]);
      } else {
        // insert
        await client.query(
          "INSERT INTO symptoms (patient_id, symptom, followups) VALUES ($1, $2, $3)",
          [patientId, symptom, followupsJson]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Chat upserted successfully. patientId=", patientId);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error inserting chat:", err);
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Provide JSON string or path to JSON file");
    process.exit(1);
  }

  let chat;
  try {
    const maybePath = path.resolve(arg);
    if (fs.existsSync(maybePath) && fs.lstatSync(maybePath).isFile()) {
      chat = JSON.parse(fs.readFileSync(maybePath, "utf8"));
    } else {
      chat = JSON.parse(arg);
    }
  } catch (err) {
    console.error("Invalid JSON or file path", err.message);
    process.exit(1);
  }

  await upsertChat(chat);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
