-- Migration 0002: Add default_start_time, default_end_time to priest_profiles, and create priest_availability_exceptions table

-- 1. Add default working hours to priest_profiles
ALTER TABLE priest_profiles 
ADD COLUMN IF NOT EXISTS default_start_time TIME,
ADD COLUMN IF NOT EXISTS default_end_time TIME;

-- 2. Create exception_type enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exception_type') THEN
    CREATE TYPE exception_type AS ENUM ('BLOCK', 'CUSTOM_HOURS');
  END IF;
END $$;

-- 3. Create priest_availability_exceptions table
CREATE TABLE IF NOT EXISTS priest_availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priest_id UUID NOT NULL REFERENCES priest_profiles(id) ON DELETE CASCADE,
  exception_type exception_type NOT NULL DEFAULT 'BLOCK',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Create indices for fast range lookups
CREATE INDEX IF NOT EXISTS idx_priest_availability_exceptions_priest_id 
ON priest_availability_exceptions (priest_id);

CREATE INDEX IF NOT EXISTS idx_priest_availability_exceptions_priest_range 
ON priest_availability_exceptions (priest_id, start_at, end_at);

-- 5. Add duration_minutes to puja_catalog
ALTER TABLE puja_catalog 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 120;
