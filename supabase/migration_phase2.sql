ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_email TEXT;
CREATE TABLE IF NOT EXISTS barbershop_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Barbería',
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO barbershop_config (name, address) VALUES ('Barbería El Navajero', 'Buenos Aires, Argentina') ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);
