// services/llmService.js
const axios = require("axios");

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Polite assistant reply
async function llmControlledReply(prompt) {
  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a polite assistant that rephrases messages in natural language. Never invent medical advice."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Perplexity API response structure
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("LLM error:", err.response?.data || err.message);
    return prompt; // fallback
  }
}

// Validate user input
async function validateWithLLM(question, userResponse, type) {
  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: `You are a strict validator. Check if the user response is valid for the type "${type}". Respond only with "valid" or "invalid".`
          },
          { role: "user", content: `Question: "${question}"\nAnswer: "${userResponse}"` }
        ],
        temperature: 0,
        max_tokens: 10
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const result = response.data.choices[0].message.content.trim().toLowerCase();
    return result.includes("valid") ? "valid" : "invalid";
  } catch (err) {
    console.error("Validation LLM error:", err.response?.data || err.message);
    return "invalid";
  }
}

module.exports = { llmControlledReply, validateWithLLM };