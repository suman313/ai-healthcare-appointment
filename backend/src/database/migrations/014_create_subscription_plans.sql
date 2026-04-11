CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_doctors INTEGER NOT NULL DEFAULT 1,
  max_appointments_per_month INTEGER NOT NULL DEFAULT 30,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  max_sms_per_month INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default plans
INSERT INTO subscription_plans (name, price, max_doctors, max_appointments_per_month, sms_enabled, max_sms_per_month, features)
VALUES
  ('Free',         0,    1,  30,   false, 0,    '["1 Doctor", "30 Appointments/month", "Email Notifications", "Patient Booking Page"]'),
  ('Basic',        999,  3,  500,  true,  1000, '["3 Doctors", "500 Appointments/month", "Email + SMS Notifications", "Medical Records", "Prescriptions"]'),
  ('Professional', 2499, 10, 2000, true,  5000, '["10 Doctors", "2000 Appointments/month", "Email + SMS Notifications", "Medical Records", "Prescriptions", "Billing & Revenue", "Analytics"]'),
  ('Clinic Chain', 4999, -1, -1,   true,  -1,   '["Unlimited Doctors", "Unlimited Appointments", "Email + SMS Notifications", "All Features", "Priority Support"]')
ON CONFLICT DO NOTHING;
