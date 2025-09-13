// // require("dotenv").config();
// // const express = require("express");
// // const http = require("http");
// // const { Server } = require("socket.io");
// // const { llmControlledReply, validateWithLLM } = require("./services/llmService");
// // const { getFollowUpQuestions } = require("./services/symptomService");
// // const { findClosestSymptom } = require("./services/symptomService");

// // const app = express();
// // const server = http.createServer(app);
// // const io = new Server(server, { cors: { origin: "*" } });

// // // --- Simple regex validators ---
// // function isValidName(name) {
// //   return /^[A-Za-z\s'-]{2,50}$/.test(name);
// // }
// // function isValidEmail(email) {
// //   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// // }

// // let sessions = {};

// // io.on("connection", (socket) => {
// //   console.log("🔗 New user:", socket.id);

// //   socket.on("session:start", () => {
// //     if (sessions[socket.id]?.started) return;

// //     sessions[socket.id] = {
// //       started: true,
// //       step: "name",
// //       patient: { name: "", email: "", symptoms: [], answers: {} }
// //     };

// //     socket.emit("bot:message", {
// //       text: "Hello! I’m your cardiology assistant. May I know your name?"
// //     });
// //   });

// //   socket.on("user:message", async (msg) => {
// //     const session = sessions[socket.id];
// //     if (!session) return;

// //     const { patient, step } = session;

// //     // STEP 1: NAME
// //     if (step === "name") {

// ... (removed misplaced top-level socket handler)
// //       if (isValidName(msg)) {
// //         patient.name = msg;
// //         session.step = "email";
// //         const reply = await llmControlledReply(`The patient name is ${msg}. Acknowledge politely.`);
// //         socket.emit("bot:message", { text: reply });
// //         socket.emit("bot:message", { text: "Could you share your email address?" });
// //       } else {
// //         socket.emit("bot:message", { text: "That doesn’t look like a valid name. Could you please re-enter your name?" });
// //       }

// //     // STEP 2: EMAIL
// //     } else if (step === "email") {
// //       if (isValidEmail(msg)) {
// //         patient.email = msg;
// //         session.step = "symptom";
// //         const reply = await llmControlledReply(`The patient email is ${msg}. Confirm politely.`);
// //         socket.emit("bot:message", { text: reply });
// //         socket.emit("bot:message", { text: "Please describe your main symptom (e.g. chest pain, shortness of breath)." });
// //       } else {
// //         socket.emit("bot:message", { text: "That doesn’t look like a valid email. Could you please enter a correct email address?" });
// //       }

// //     // STEP 3: SYMPTOM
// //    // STEP 3: SYMPTOM
// // } else if (step === "symptom") {
// //   // Ask LLM to detect symptom from user's message
// //   const detectedSymptom = await llmControlledReply(
// //     `Identify the main symptom from this patient message: "${msg}".
// //     Respond only with one of the following symptoms if it matches: chest pain, shortness of breath, fatigue.
// //     If it doesn't match any, respond with "unknown".`
// //   );

// //   if (["chest pain", "shortness of breath", "fatigue"].includes(detectedSymptom.toLowerCase())) {
// //     patient.symptoms.push(detectedSymptom);

// //     // Ask LLM to generate the **first follow-up question only**
// //     const firstQuestion = await llmControlledReply(
// //       `The patient reported "${detectedSymptom}".
// //       Ask one follow-up question to better understand the symptom.
// //       Respond only with a single clear question.`
// //     );

// //     session.followUps = [firstQuestion];
// //     session.currentQ = 0;
// //     session.step = "followups";

// //     const ack = await llmControlledReply(
// //       `Acknowledged that the patient is experiencing "${detectedSymptom}". Respond politely.`
// //     );
// //     socket.emit("bot:message", { text: ack });
// //     socket.emit("bot:message", { text: session.followUps[0] });

// //   } else {
// //     const helpMsg = await llmControlledReply(
// //       `The patient said "${msg}" which is not recognized.
// //       Please ask them to choose from: chest pain, shortness of breath, or fatigue.`
// //     );
// //     socket.emit("bot:message", { text: helpMsg });
// //   }

// //     // STEP 4: FOLLOW-UPS
// //     } else if (step === "followups") {
// //       const currentQuestion = session.followUps[session.currentQ];
// //       const validation = await validateWithLLM(currentQuestion, msg, "answer");

// //       if (validation === "valid") {
// //         patient.answers[currentQuestion] = msg;

// //         const ack = await llmControlledReply(`The patient answered: "${msg}" to the question "${currentQuestion}". Acknowledge politely.`);
// //         socket.emit("bot:message", { text: ack });

// //         session.currentQ++;
// //         if (session.currentQ < session.followUps.length) {
// //           socket.emit("bot:message", { text: session.followUps[session.currentQ] });
// //         } else {
// //           session.step = "done";
// //           socket.emit("bot:message", { text: "✅ Thank you. Your details have been recorded. A doctor will review them shortly." });
// //           console.log("📌 Final patient record:", patient);
// //         }
// //       } else {
// //         socket.emit("bot:message", { text: `I didn’t quite understand. Could you please answer the question directly: ${currentQuestion}` });
// //       }
// //     }
// //   });
// // });

// // app.get("/ping", (req, res) => res.send("Backend is alive ✅"));

// // const PORT = process.env.PORT || 5001;
// // server.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

// require("dotenv").config();
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const { llmControlledReply, validateWithLLM } = require("./services/llmService");
// const { getFollowUpQuestions, findClosestSymptom } = require("./services/symptomService");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

// // --- Simple regex validators ---
// function isValidName(name) {
//   return /^[A-Za-z\s'-]{2,50}$/.test(name);
// }
// function isValidEmail(email) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }

// let sessions = {};

// io.on("connection", (socket) => {
//   console.log("🔗 New user:", socket.id);

//   socket.on("session:start", () => {
//     if (sessions[socket.id]?.started) return;

//     sessions[socket.id] = {
//       started: true,
//       step: "name",
//       patient: { name: "", email: "", symptoms: [], answers: {} }
//     };

//     socket.emit("bot:message", { text: "Hello! I’m your cardiology assistant. May I know your name?" });
//   });

//   socket.on("user:message", async (msg) => {
//     const session = sessions[socket.id];
//     if (!session) return;

//     const { patient, step } = session;

//     // STEP 1: NAME
//     if (step === "name") {
//       if (isValidName(msg)) {
//         patient.name = msg;
//         session.step = "email";
//         const reply = await llmControlledReply(
//           `The patient's name is "${msg}". Respond politely to acknowledge in natural language.`
//         );
//         socket.emit("bot:message", { text: reply });
//         socket.emit("bot:message", { text: "Could you share your email address?" });
//       } else {
//         socket.emit("bot:message", { text: "That doesn’t look like a valid name. Could you please re-enter your name?" });
//       }

//     // STEP 2: EMAIL
//     } else if (step === "email") {
//       if (isValidEmail(msg)) {
//         patient.email = msg;
//         session.step = "symptom";
//         const reply = await llmControlledReply(
//           `The patient's email is "${msg}". Respond politely to acknowledge in natural language.`
//         );
//         socket.emit("bot:message", { text: reply });
//         socket.emit("bot:message", { text: "Please describe your main symptom (e.g., chest pain, shortness of breath, fatigue)." });
//       } else {
//         socket.emit("bot:message", { text: "That doesn’t look like a valid email. Could you please enter a correct email address?" });
//       }

//     // STEP 3: SYMPTOM
//    // STEP 3: SYMPTOM
// } else if (step === "symptom") {
//   const closest = findClosestSymptom(msg);

//   if (closest) {
//     // Add the recognized symptom
//     patient.symptoms.push(closest);

//     // Get follow-up questions directly from dataset
//     const followUps = getFollowUpQuestions(closest);
//     if (!followUps || followUps.length === 0) {
//       session.step = "done";
//       socket.emit("bot:message", { text: `✅ Thank you. Your symptom "${closest}" has been recorded.` });
//       return;
//     }

//     session.followUps = followUps;
//     session.currentQ = 0;
//     session.step = "followups";

//     // Polite acknowledgment (LLM) without repeating options or advice
//     const ack = await llmControlledReply(
//       `The patient reported "${closest}". Respond politely in natural language.`
//     );
//     socket.emit("bot:message", { text: ack });

//     // Ask **first follow-up question from dataset**
//     socket.emit("bot:message", { text: session.followUps[0] });

//   } else {
//     // Symptom not recognized
//     socket.emit("bot:message", {
//       text: `The symptom "${msg}" was not recognized. Please choose one of the following: chest pain, shortness of breath, or fatigue.`
//     });
//   }

//     // STEP 4: FOLLOW-UPS
//     } else if (step === "followups") {
//       const currentQuestion = session.followUps[session.currentQ];

//       // Validate user answer with LLM
//       const validation = await validateWithLLM(currentQuestion, msg, "answer");

//       if (validation === "valid") {
//         patient.answers[currentQuestion] = msg;

//         const ack = await llmControlledReply(
//           `The patient answered: "${msg}" to the question "${currentQuestion}". Respond politely.`
//         );
//         socket.emit("bot:message", { text: ack });

//         session.currentQ++;

//         if (session.currentQ < session.followUps.length) {
//           socket.emit("bot:message", { text: session.followUps[session.currentQ] });
//         } else {
//           // Generate next follow-up question dynamically if more info needed
//           const lastSymptom = patient.symptoms[patient.symptoms.length - 1];
//           const nextQuestion = await llmControlledReply(
//             `The patient reported "${lastSymptom}" and answered previous follow-up questions. Ask **one more clear follow-up question** to better understand this symptom. Respond only with the question.`
//           );

//           if (nextQuestion && nextQuestion.length > 5) {
//             session.followUps.push(nextQuestion);
//             socket.emit("bot:message", { text: nextQuestion });
//           } else {
//             session.step = "done";
//             socket.emit("bot:message", { text: "✅ Thank you. Your details have been recorded. A doctor will review them shortly." });
//             console.log("📌 Final patient record:", patient);
//           }
//         }

//       } else {
//         socket.emit("bot:message", { text: `I didn’t quite understand. Could you please answer the question directly: ${currentQuestion}` });
//       }
//     }
//   });
// });

// app.get("/ping", (req, res) => res.send("Backend is alive ✅"));

// const PORT = process.env.PORT || 5001;
// server.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const {
  getFollowUpQuestions,
  findClosestSymptom,
} = require("./services/symptomService");
const pool = require("./services/db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- Simple regex validators ---
function isValidName(name) {
  return /^[A-Za-z\s'-]{2,50}$/.test(name);
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

let sessions = {};

io.on("connection", (socket) => {
  console.log("🔗 New user:", socket.id);

  socket.on("session:start", () => {
    if (sessions[socket.id]?.started) return;

    sessions[socket.id] = {
      started: true,
      step: "name",
      patient: { name: "", email: "", symptoms: [], answers: {} },
      followUps: [],
      currentQ: 0,
    };

    socket.emit("bot:message", {
      text: "Hello! I’m your cardiology assistant. May I know your name?",
    });
  });

  // allow frontend to request saving the current session to DB
  socket.on("save:session", async () => {
    const session = sessions[socket.id];
    if (!session) {
      socket.emit("save:error", "no session found");
      return;
    }

    const patient = session.patient || {
      name: "",
      email: "",
      symptoms: [],
      answers: {},
    };

    try {
      // Upsert patient by email
      const upsertPatientQuery = `
        INSERT INTO patients (name, email)
        VALUES ($1, $2)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      const patientResult = await pool.query(upsertPatientQuery, [
        patient.name,
        patient.email,
      ]);
      const patientId = patientResult.rows[0].id;

      // Upsert each symptom
      for (const symptom of patient.symptoms || []) {
        const followupsJson = JSON.stringify(patient.answers || {});
        const upsertSymptomQuery = `
          INSERT INTO symptoms (patient_id, symptom, followups)
          VALUES ($1, $2, $3)
          ON CONFLICT (patient_id, symptom)
          DO UPDATE SET followups = EXCLUDED.followups
        `;
        await pool.query(upsertSymptomQuery, [
          patientId,
          symptom,
          followupsJson,
        ]);
      }

      // Only generate telegram deep-link if we have at least one recorded symptom
      const notificationEmitted =
        Array.isArray(patient.symptoms) && patient.symptoms.length > 0;
      socket.emit("save:ok", { patientId, notificationEmitted });
      if (notificationEmitted) {
        const botName = process.env.TELEGRAM_BOT || "your_bot_username";
        const tgLink = `https://t.me/${botName}?start=${encodeURIComponent(
          "patient:" + patientId
        )}`;
        console.log("telegram link generated (save:session):", tgLink);
        socket.emit("telegram:link", { link: tgLink });

        // also attempt to notify doctor for explicit save requests
        try {
          const { notifyDoctor } = require("./services/notifyDoctor");
          notifyDoctor(patient)
            .then((res) => {
              if (res && res.meetingLink) {
                socket.emit("meeting:link", {
                  link: res.meetingLink,
                  sent: res.sent,
                });
              } else {
                socket.emit("meeting:link", {
                  link: null,
                  sent: res && res.sent,
                  error: res && res.error,
                });
              }
            })
            .catch((e) =>
              console.error("notifyDoctor failed (save:session)", e)
            );
        } catch (e) {
          console.error("failed to require notifyDoctor (save:session)", e);
        }
      }

      // also attempt to notify doctor for explicit save requests
      try {
        const { notifyDoctor } = require("./services/notifyDoctor");
        notifyDoctor(patient)
          .then((res) => {
            if (res && res.meetingLink) {
              socket.emit("meeting:link", {
                link: res.meetingLink,
                sent: res.sent,
              });
            } else {
              socket.emit("meeting:link", {
                link: null,
                sent: res && res.sent,
                error: res && res.error,
              });
            }
          })
          .catch((e) => console.error("notifyDoctor failed (save:session)", e));
      } catch (e) {
        console.error("failed to require notifyDoctor (save:session)", e);
      }
    } catch (err) {
      console.error("save:session error:", err);
      socket.emit("save:error", String(err));
    }
  });

  socket.on("user:message", (msg) => {
    console.log("<- user:message", socket.id, msg);
    const session = sessions[socket.id];
    if (!session) return;

    const { patient, step } = session;

    console.log("session step before handling:", session.step);
    // STEP 1: NAME
    if (step === "name") {
      if (isValidName(msg)) {
        patient.name = msg;
        session.step = "email";
        socket.emit("bot:message", {
          text: `Hi ${msg}, nice to meet you! Could you share your email address?`,
        });
      } else {
        socket.emit("bot:message", {
          text: "That doesn’t look like a valid name. Please re-enter your name.",
        });
      }

      // STEP 2: EMAIL
    } else if (step === "email") {
      if (isValidEmail(msg)) {
        patient.email = msg;
        session.step = "symptom";
        socket.emit("bot:message", {
          text: "Thank you! Please describe your main symptom (e.g., chest pain, shortness of breath, fatigue).",
        });
      } else {
        socket.emit("bot:message", {
          text: "That doesn’t look like a valid email. Please enter a correct email address.",
        });
      }

      // STEP 3: SYMPTOM
    } else if (step === "symptom") {
      const closest = findClosestSymptom(msg);

      if (closest) {
        patient.symptoms.push(closest);
        session.followUps = getFollowUpQuestions(closest);
        session.currentQ = 0;

        if (session.followUps.length > 0) {
          session.step = "followups";
          socket.emit("bot:message", {
            text: `Got it! Let's start with some follow-up questions.`,
          });
          socket.emit("bot:message", { text: session.followUps[0] });
        } else {
          session.step = "done";
          socket.emit("bot:message", {
            text: "✅ Thank you. Your details have been recorded. A doctor will review them shortly.",
          });
        }
      } else {
        socket.emit("bot:message", {
          text: `The symptom "${msg}" is not recognized. Please choose one of the following: chest pain, shortness of breath, or fatigue.`,
        });
      }

      // STEP 4: FOLLOW-UPS
    } else if (step === "followups") {
      const currentQuestion = session.followUps[session.currentQ];
      patient.answers[currentQuestion] = msg;

      session.currentQ++;
      if (session.currentQ < session.followUps.length) {
        socket.emit("bot:message", {
          text: session.followUps[session.currentQ],
        });
      } else {
        session.step = "done";
        socket.emit("bot:message", {
          text: "✅ Thank you. Your details have been recorded. A doctor will review them shortly.",
        });
        console.log("📌 Final patient record:", patient);
        // Save patient and symptoms to PostgreSQL
        (async () => {
          try {
            // Upsert patient by email
            const upsertPatientQuery = `
              INSERT INTO patients (name, email)
              VALUES ($1, $2)
              ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
              RETURNING id
            `;
            const patientResult = await pool.query(upsertPatientQuery, [
              patient.name,
              patient.email,
            ]);
            const patientId = patientResult.rows[0].id;

            // For each symptom, upsert by patient_id + symptom
            for (const symptom of patient.symptoms) {
              // Collect followups relevant to this symptom
              let followupsJson = {};
              if (patient.answers) {
                for (const [question, answer] of Object.entries(
                  patient.answers
                )) {
                  followupsJson[question] = answer;
                }
              }

              const upsertSymptomQuery = `
                INSERT INTO symptoms (patient_id, symptom, followups)
                VALUES ($1, $2, $3)
                ON CONFLICT (patient_id, symptom)
                DO UPDATE SET followups = EXCLUDED.followups
              `;

              await pool.query(upsertSymptomQuery, [
                patientId,
                symptom,
                JSON.stringify(followupsJson),
              ]);
            }
            console.log("✅ Patient and symptoms upserted to DB");
            const notificationEmitted =
              Array.isArray(patient.symptoms) && patient.symptoms.length > 0;
            socket.emit("save:ok", { patientId, notificationEmitted });
            if (notificationEmitted) {
              try {
                const botName = process.env.TELEGRAM_BOT || "your_bot_username";
                const tgLink = `https://t.me/${botName}?start=${encodeURIComponent(
                  "patient:" + patientId
                )}`;
                console.log("telegram link generated:", tgLink);
                socket.emit("telegram:link", { link: tgLink });
              } catch (err) {
                console.error("telegram link error", err);
              }

              // attempt to notify doctor: create google meet and send telegram
              try {
                const { notifyDoctor } = require("./services/notifyDoctor");
                // pass the patient object we just saved
                notifyDoctor(patient)
                  .then((res) => {
                    if (res && res.meetingLink) {
                      socket.emit("meeting:link", {
                        link: res.meetingLink,
                        sent: res.sent,
                      });
                    } else {
                      socket.emit("meeting:link", {
                        link: null,
                        sent: res && res.sent,
                        error: res && res.error,
                      });
                    }
                  })
                  .catch((e) => console.error("notifyDoctor failed", e));
              } catch (e) {
                console.error("failed to require notifyDoctor", e);
              }
            }
          } catch (err) {
            console.error("DB save error:", err);
          }
        })();
        // Save conversation to PostgreSQL as JSON
        (async () => {
          try {
            await pool.query(
              "INSERT INTO conversations (session_id, messages) VALUES ($1, $2)",
              [socket.id, JSON.stringify(session.patient)]
            );
            console.log("✅ Conversation saved to DB");
          } catch (err) {
            console.error("DB save error:", err);
          }
        })();
      }
    }
  });
});

app.get("/ping", (req, res) => res.send("Backend is alive ✅"));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
