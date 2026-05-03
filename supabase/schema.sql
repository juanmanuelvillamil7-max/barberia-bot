-- ============================================================
-- Barbería Bot — Schema SQL
-- Run this in Supabase → SQL Editor
-- ============================================================

-- Servicios de la barbería
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales de servicios
INSERT INTO services (name, duration_minutes, price) VALUES
  ('Corte de pelo', 30, 5000),
  ('Barba', 20, 3000),
  ('Corte + Barba', 45, 7000),
  ('Cejas', 10, 1500),
  ('Color', 60, 8000)
ON CONFLICT DO NOTHING;

-- Turnos agendados
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service_id UUID REFERENCES services(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de conversaciones (para contexto del LLM)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(client_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversations_activity ON conversations(last_activity);

-- ============================================================
-- RLS (Row Level Security) — deshabilitado porque usamos
-- service role key en el servidor (bypassa RLS igualmente)
-- ============================================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Función para limpiar conversaciones inactivas (llamar con pg_cron o manualmente)
CREATE OR REPLACE FUNCTION clean_old_conversations()
RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET messages = '[]'::jsonb
  WHERE last_activity < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
