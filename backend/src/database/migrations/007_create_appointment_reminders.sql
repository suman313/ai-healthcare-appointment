CREATE TABLE IF NOT EXISTS appointment_reminders (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_time TIMESTAMP NOT NULL,
  sent_status BOOLEAN DEFAULT FALSE
);
