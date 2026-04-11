CREATE TABLE IF NOT EXISTS ai_symptom_logs (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  ai_response TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
