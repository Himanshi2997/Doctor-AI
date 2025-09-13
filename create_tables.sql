-- Create patients and symptoms tables with constraints for upsert
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS symptoms (
  id SERIAL PRIMARY KEY,
  patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
  symptom VARCHAR(255) NOT NULL,
  followups JSONB NOT NULL,
  UNIQUE (patient_id, symptom)
);
