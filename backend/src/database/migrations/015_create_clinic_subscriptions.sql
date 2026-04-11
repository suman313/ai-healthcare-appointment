CREATE TABLE IF NOT EXISTS clinic_subscriptions (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-assign Free plan to all existing clinics that don't have a subscription
INSERT INTO clinic_subscriptions (clinic_id, plan_id, status)
SELECT c.id, (SELECT id FROM subscription_plans WHERE name = 'Free' LIMIT 1), 'active'
FROM clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM clinic_subscriptions cs WHERE cs.clinic_id = c.id
);
