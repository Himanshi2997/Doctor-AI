const io = require("socket.io-client");

const socket = io("http://localhost:5001");

socket.on("connect", () => {
  console.log("sim: connected", socket.id);
  socket.emit("session:start");

  setTimeout(() => socket.emit("user:message", "Test Patient"), 300);
  setTimeout(
    () => socket.emit("user:message", "test.patient@example.com"),
    800
  );
  setTimeout(() => socket.emit("user:message", "chest pain"), 1300);

  // give server time to ask followups; then answer generically a few times
  setTimeout(() => socket.emit("user:message", "It is sharp and sudden"), 2500);
  setTimeout(
    () => socket.emit("user:message", "Yes, lasts a few minutes"),
    3300
  );
  // after some time, check and exit
  setTimeout(() => {
    console.log("sim: finished sending messages");
    socket.disconnect();
  }, 6000);
});

socket.on("bot:message", (msg) => {
  console.log("sim bot:", msg.text);
});

socket.on("telegram:link", ({ link }) => {
  console.log("sim received telegram link:", link);
});

socket.on("disconnect", () => console.log("sim: disconnected"));
