const io = require("socket.io-client");

const socket = io("http://localhost:5001");

let step = 0;

socket.on("connect", () => {
  console.log("auto: connected", socket.id);
  socket.emit("session:start");
});

socket.on("bot:message", (msg) => {
  const text = msg && msg.text ? String(msg.text) : "";
  console.log("auto bot:", text);

  if (/May I know your name|know your name/i.test(text) && step === 0) {
    setTimeout(() => {
      socket.emit("user:message", "Auto Patient");
      step = 1;
    }, 200);
  } else if (/email address|email/i.test(text) && step === 1) {
    setTimeout(() => {
      socket.emit("user:message", "auto.patient@example.com");
      step = 2;
    }, 200);
  } else if (
    /main symptom|describe your main symptom/i.test(text) &&
    step === 2
  ) {
    setTimeout(() => {
      socket.emit("user:message", "chest pain");
      step = 3;
    }, 300);
  } else if (
    /Thank you|details have been recorded|scheduled your consultation/i.test(
      text
    )
  ) {
    console.log("auto: session complete trigger seen");
    // wait for telegram link or save:ok then exit
  } else {
    // assume follow-up question → answer generically
    setTimeout(() => {
      socket.emit("user:message", "Auto answer");
    }, 300);
  }
});

socket.on("telegram:link", ({ link }) => {
  console.log("auto received telegram link:", link);
  socket.disconnect();
});

socket.on("save:ok", ({ patientId }) => {
  console.log("auto save ok, patientId=", patientId);
});

socket.on("disconnect", () => console.log("auto: disconnected"));
