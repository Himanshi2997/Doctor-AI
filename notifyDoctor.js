const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Read raw env values and trim whitespace to avoid accidental newlines/spaces
const _rawBot = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";
const _rawChat = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID || "";
const BOT_TOKEN = _rawBot ? _rawBot.toString().trim() : null;
const CHAT_ID = _rawChat ? _rawChat.toString().trim() : null;
const pool = require("./db");

async function fetchLatestPatientFromDb() {
  try {
    const clientRes = await pool.query(
      `SELECT id, name, email FROM patients WHERE id = (SELECT max(id) FROM patients)`
    );
    if (!clientRes.rows || clientRes.rows.length === 0) return null;
    const p = clientRes.rows[0];

    const symptomsRes = await pool.query(
      `SELECT symptom, followups FROM symptoms WHERE patient_id = $1`,
      [p.id]
    );
    const symptoms = [];
    const answers = {};
    if (symptomsRes.rows && symptomsRes.rows.length > 0) {
      for (const row of symptomsRes.rows) {
        symptoms.push(row.symptom);
        try {
          const f = row.followups;
          if (f && typeof f === "object") {
            for (const [q, a] of Object.entries(f)) answers[q] = a;
          }
        } catch (e) {
          // ignore parse issues
        }
      }
    }

    return { id: p.id, name: p.name, email: p.email, symptoms, answers };
  } catch (err) {
    console.error("fetchLatestPatientFromDb error", err.message || err);
    return null;
  }
}

function runPythonCreateMeeting() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "googlemeet.py");
    // pass DB_* env vars to the Python script so it can connect using the same credentials
    const env = Object.assign({}, process.env);
    try {
      if (pool && pool.config) {
        env.DB_HOST = pool.config.host;
        env.DB_NAME = pool.config.database;
        env.DB_USER = pool.config.user;
        env.DB_PASSWORD = pool.config.password;
        env.DB_PORT = String(pool.config.port);
      }
    } catch (e) {
      // ignore
    }

    const py = spawn("python3", [scriptPath], {
      cwd: path.join(__dirname, ".."),
      env,
    });

    let stdout = "";
    let stderr = "";
    py.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    py.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    py.on("close", (code) => {
      if (code === 0) {
        // meeting.txt should be created by the python script
        const meetingFile = path.join(__dirname, "..", "meeting.txt");
        try {
          const link = fs.readFileSync(meetingFile, "utf8").trim();
          resolve(link);
        } catch (err) {
          reject(
            new Error("meeting.txt not found or unreadable: " + err.message)
          );
        }
      } else {
        reject(new Error(`python script exited ${code}: ${stderr || stdout}`));
      }
    });
  });
}

function formatPatientMessage(patient, meetingLink) {
  let message = `Hi Doc! You have an appointment with ${
    patient.name
  }\n\n${meetingLink}\n\n🩺 Patient Interaction Summary\nEmail: ${
    patient.email
  }\nSymptoms: ${
    Array.isArray(patient.symptoms)
      ? patient.symptoms.join(", ")
      : patient.symptoms
  }\n`;

  if (patient.answers && typeof patient.answers === "object") {
    for (const [question, answer] of Object.entries(patient.answers)) {
      message += `\n${question}\nAnswer: ${answer}\n`;
    }
  }

  return message;
}

async function notifyDoctor(patient) {
  const result = { sent: false, meetingLink: null, error: null };

  // if no patient provided, try fetching latest from DB (ind2 compatibility)
  if (!patient) {
    patient = await fetchLatestPatientFromDb();
    if (!patient) {
      const msg = "No patient found in DB to notify";
      console.warn(msg);
      result.error = msg;
      return result;
    }
  }

  // Create meeting regardless of Telegram credentials; only the actual send is skipped
  try {
    const meetingLink = await runPythonCreateMeeting();
    result.meetingLink = meetingLink;
  } catch (err) {
    console.error("notifyDoctor error (meeting):", err.message || err);
    result.error = err.message || String(err);
    return result;
  }

  // Format the message payload
  const text = formatPatientMessage(patient, result.meetingLink);
  const payload = { chat_id: CHAT_ID || null, text };

  if (!BOT_TOKEN || !CHAT_ID) {
    const msg =
      "Telegram BOT_TOKEN or CHAT_ID not set in env; send skipped, payload returned";
    console.warn(msg);
    result.error = msg;
    result.payload = payload;
    return result;
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const res = await axios.post(url, { chat_id: CHAT_ID, text });
    console.log(
      "✅ notifyDoctor: Telegram message sent",
      "message_id:",
      res?.data?.result?.message_id
    );
    result.sent = true;
    result.payload = payload;
    return result;
  } catch (err) {
    console.error("notifyDoctor error (send):", err.message || err);
    // If axios returned a response, log status and body for diagnosis
    if (err && err.response) {
      try {
        console.error(
          "notifyDoctor send response status:",
          err.response.status
        );
        console.error(
          "notifyDoctor send response data:",
          JSON.stringify(err.response.data)
        );
      } catch (e) {
        // ignore stringify issues
      }
    } else if (err && err.request) {
      console.error("notifyDoctor send no response (request made):", err.request);
    }

    // Log a masked version of the token to help spot malformed tokens without
    // printing secrets in full.
    const maskedToken = BOT_TOKEN
      ? BOT_TOKEN.length > 12
        ? `${BOT_TOKEN.slice(0, 6)}...${BOT_TOKEN.slice(-4)}`
        : "***"
      : null;
    console.error("notifyDoctor BOT_TOKEN masked:", maskedToken, "CHAT_ID:", CHAT_ID);

    result.error = (err && err.response && err.response.data) || err.message || String(err);
    result.payload = payload;
    return result;
  }
}

module.exports = {
  notifyDoctor,
  runPythonCreateMeeting,
  formatPatientMessage,
  fetchLatestPatientFromDb,
};
