const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  question: String,
  answer: String,
});

const symptomSchema = new mongoose.Schema({
  symptom: String,
  answers: [answerSchema],
});

const patientSchema = new mongoose.Schema({
  name: String,
  email: String,
  symptoms: [symptomSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Patient", patientSchema);