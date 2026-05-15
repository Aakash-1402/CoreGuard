-- CoreGuard Database Schema
-- Run once: psql $DATABASE_URL -f src/server/db/schema.sql

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('operator', 'manager');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE severity_enum AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status_enum AS ENUM ('new', 'reviewed', 'escalated', 'ignored', 'resolved');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier TEXT NOT NULL,
  part_asset TEXT NOT NULL,
  severity severity_enum NOT NULL,
  status event_status_enum NOT NULL DEFAULT 'new',
  summary TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  recommended_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_detected_at ON events(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);

-- Audit Log (append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) NOT NULL,
  changed_by UUID REFERENCES users(id) NOT NULL,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event_id);

-- Prevent UPDATE and DELETE on audit_log (append-only)
CREATE OR REPLACE FUNCTION prevent_audit_modification() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: modification not allowed';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_audit_no_update BEFORE UPDATE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
  CREATE TRIGGER trg_audit_no_delete BEFORE DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Notes (immutable after insert)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_event ON notes(event_id);

-- Evidence (immutable after insert)
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  type TEXT NOT NULL,
  added_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_event ON evidence(event_id);

-- Prevent UPDATE and DELETE on evidence (immutable after creation)
CREATE OR REPLACE FUNCTION prevent_evidence_modification() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'evidence is immutable after creation: modification not allowed';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_evidence_no_update BEFORE UPDATE ON evidence
    FOR EACH ROW EXECUTE FUNCTION prevent_evidence_modification();
  CREATE TRIGGER trg_evidence_no_delete BEFORE DELETE ON evidence
    FOR EACH ROW EXECUTE FUNCTION prevent_evidence_modification();
EXCEPTION WHEN duplicate_object THEN null;
END $$;