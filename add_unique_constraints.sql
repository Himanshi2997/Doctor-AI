-- Add unique constraints needed for ON CONFLICT upserts
ALTER TABLE patients
  ADD CONSTRAINT patients_email_unique UNIQUE (email);

ALTER TABLE symptoms
  ADD CONSTRAINT symptoms_patient_symptom_unique UNIQUE (patient_id, symptom);
