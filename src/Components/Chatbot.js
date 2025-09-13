import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { FaUserCircle } from "react-icons/fa";
import { MdOutlineMedicalServices } from "react-icons/md";

// ✅ Connect to backend
const socket = io("http://localhost:5001");

// basic client-side socket debug
socket.on("connect", () => {
  console.log("Socket connected", socket.id);
  // emit session:start after successful connect
  socket.emit("session:start", { sessionId: Date.now().toString() });
});
socket.on("connect_error", (err) => console.error("Socket connect_error", err));
socket.on("disconnect", (reason) => console.log("Socket disconnected", reason));

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Start session once
  useEffect(() => {
    socket.emit("session:start", { sessionId: Date.now().toString() });

    socket.on("bot:message", (msg) => {
      addMessage("bot", msg.text);
      // if backend signals finalization via text, request save
      if (typeof msg.text === "string" && msg.text.includes("Thank you")) {
        socket.emit("save:session");
      }
    });
    socket.on("bot:ask", (msg) => addMessage("bot", msg.questionText));
    socket.on("bot:finished", () => {
      addMessage("bot", "✅ Thank you. We’ve scheduled your consultation.");
      socket.emit("save:session");
    });

    socket.on("save:ok", ({ patientId }) => {
      addMessage("bot", `Saved conversation (patient id ${patientId})`);
    });
    socket.on("save:error", (err) => {
      addMessage("bot", `Failed to save conversation: ${err}`);
    });

    return () => {
      socket.off("bot:message");
      socket.off("bot:ask");
      socket.off("bot:finished");
    };
  }, []); // empty deps = only once

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (from, text) => {
    if (!text) return;
    setTyping(false);
    setMessages((prev) => [...prev, { from, text }]);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    addMessage("user", input);
    setTyping(true);

    // ✅ Send raw string, backend expects plain message
    socket.emit("user:message", input);

    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={styles.page}>
      <div style={styles.chatContainer}>
        {/* Header */}
        <div style={styles.header}>
          <MdOutlineMedicalServices size={24} style={{ marginRight: 8 }} />
          <span>Doctor’s AI Assistant</span>
        </div>

        {/* Chat window */}
        <div style={styles.chatWindow}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.messageRow,
                justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.from === "bot" && (
                <MdOutlineMedicalServices
                  size={28}
                  color="#1A1A45"
                  style={{ marginRight: 6 }}
                />
              )}

              <div
                style={{
                  ...styles.message,
                  background: msg.from === "user" ? "#DCF8C6" : "#1A1A45",
                  color: msg.from === "user" ? "#000" : "#fff",
                  borderBottomRightRadius: msg.from === "user" ? "0px" : "15px",
                  borderBottomLeftRadius: msg.from === "user" ? "15px" : "0px",
                }}
              >
                {msg.text}
              </div>

              {msg.from === "user" && (
                <FaUserCircle
                  size={28}
                  color="#555"
                  style={{ marginLeft: 6 }}
                />
              )}
            </div>
          ))}

          {typing && (
            <div style={styles.typingIndicator}>Assistant is typing...</div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
          />
          <button style={styles.sendBtn} onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    width: "100vw",
    height: "100vh",
    backgroundImage: "url('../../ecgback.jpeg')", // <-- Add this
    backgroundSize: "cover", // scale image to cover entire area
    backgroundPosition: "center", // center the image
    backgroundRepeat: "no-repeat", // don’t repeat
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    fontFamily: "Arial, sans-serif",
    padding: "20px 5% 20px 5%",
    boxSizing: "border-box",
  },
  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    height: "100%",
  },
  header: {
    //background: "#007BFF",
    background: "#1A1A45",
    color: "#fff",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: "16px",
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px",
  },
  chatWindow: {
    flex: 1,
    padding: "10px",
    //backgroundImage: "url('../../back.jpeg')", // <-- Add this
    background: "#D5D5E3",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    // background: "#f9f9f9",
  },
  messageRow: {
    display: "flex",
    alignItems: "center",
    margin: "6px 0",
  },
  message: {
    padding: "10px 14px",
    borderRadius: "15px",
    maxWidth: "70%",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  typingIndicator: {
    fontStyle: "italic",
    fontSize: "12px",
    color: "#555",
    margin: "6px 0",
  },
  inputRow: {
    display: "flex",
    borderTop: "1px solid #301414ff",
    padding: "8px",
    background: "#fff",
    borderBottomLeftRadius: "12px",
    borderBottomRightRadius: "12px",
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "20px",
    outline: "none",
    fontSize: "14px",
    marginRight: "8px",
  },
  sendBtn: {
    background: "#1A1A45",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Chatbot;
