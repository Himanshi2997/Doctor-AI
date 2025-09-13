const {
  runPythonCreateMeeting,
  formatPatientMessage,
} = require("../services/notifyDoctor");
const { fetchLatestPatientFromDb } = require("../services/notifyDoctor");

(async function main() {
  try {
    // get latest patient
    const patient = await fetchLatestPatientFromDb();
    if (!patient) {
      console.error("No patient found in DB.");
      process.exit(1);
    }

    // create meeting (runs python) and get link
    const meetingLink = await runPythonCreateMeeting();

    const text = formatPatientMessage(patient, meetingLink);

    const payload = {
      chat_id: process.env.TELEGRAM_CHAT_ID || "<CHAT_ID>",
      text,
    };

    console.log("--- DRY RUN: Telegram payload ---");
    console.log(JSON.stringify(payload, null, 2));
    console.log("--- End payload ---");
    process.exit(0);
  } catch (err) {
    console.error("dryrun error", err.message || err);
    process.exit(2);
  }
})();
