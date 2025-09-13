const fs = require("fs");
const path = require("path");
const natural = require("natural"); // for fuzzy matching

const dataPath = path.join(__dirname, "..", "Datasetab94d2b.json");
const dataset = JSON.parse(fs.readFileSync(dataPath, "utf8"));

// Build map: normalized symptom title -> entry
const symptomMap = new Map();
dataset.forEach((entry) => {
  const key = entry.symptom.trim().toLowerCase();
  symptomMap.set(key, entry.follow_up_questions || {});
});

function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase();
}

// fuzzy match using Jaro-Winkler but compare against normalized symptom titles
function findClosestSymptom(userInput) {
  const input = normalize(userInput);
  if (!input) return null;

  // exact match first
  if (symptomMap.has(input)) return input;

  // try substring match
  for (const key of symptomMap.keys()) {
    if (key.includes(input) || input.includes(key)) return key;
  }

  // fallback to Jaro-Winkler fuzzy match
  let best = null;
  let bestScore = 0;
  for (const key of symptomMap.keys()) {
    const score = natural.JaroWinklerDistance(input, key);
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }

  if (bestScore >= 0.7) return best;
  return null;
}

// Flatten follow_up_questions object into an ordered list of questions
function getFollowUpQuestions(symptomKey) {
  const obj = symptomMap.get(normalize(symptomKey));
  if (!obj) return [];
  const questions = [];
  // Respect the category order in the JSON if present
  for (const cat of Object.keys(obj)) {
    const arr = obj[cat] || [];
    for (const q of arr) questions.push(q);
  }
  return questions;
}

module.exports = { getFollowUpQuestions, findClosestSymptom };
