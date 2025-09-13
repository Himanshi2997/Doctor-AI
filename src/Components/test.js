import ollama from "ollama";

async function askAssistant(prompt) {
  const res = await ollama.chat({
    model: "llama3",
    messages: [{ role: "user", content: prompt }]
  });
  return res.message.content;
}