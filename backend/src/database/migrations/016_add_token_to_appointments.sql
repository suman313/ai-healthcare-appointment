ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS manage_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Backfill existing appointments that have no token
UPDATE appointments SET manage_token = gen_random_uuid() WHERE manage_token IS NULL;
