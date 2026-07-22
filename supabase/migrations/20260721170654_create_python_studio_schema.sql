/*
# Python Studio Database Schema

## Overview
Persistent storage for Python Studio — a browser-based Python IDE.
No authentication required (single-tenant / shared access via anon key).

## Tables

### 1. `snippets`
Stores saved Python code files/snippets with metadata.
- `id` — UUID primary key
- `name` — file name (e.g. "main.py")
- `content` — the full Python source code
- `language` — editor language hint ("python", "javascript", etc.)
- `description` — optional short description
- `is_pinned` — whether the snippet is pinned/favorited
- `run_count` — how many times this snippet has been run
- `last_run_at` — timestamp of the most recent run
- `created_at` — creation timestamp
- `updated_at` — last modification timestamp

### 2. `run_history`
Records every code execution with inputs, outputs, and metadata.
- `id` — UUID primary key
- `snippet_id` — optional FK to `snippets` (null if code was run without saving)
- `code` — the exact code that was executed (snapshot)
- `inputs` — JSONB array of user inputs provided during the run
- `output` — the full terminal output (stdout + echoed inputs)
- `exit_code` — 0 for success, 1 for error
- `duration_ms` — execution time in milliseconds
- `error_message` — error text if exit_code != 0
- `created_at` — when the run happened

### 3. `settings`
Key-value store for persisted user preferences (theme, font, etc.).
One row per setting key. Simpler than a single large JSONB column —
lets individual settings be updated atomically.
- `key` — setting name (primary key)
- `value` — JSONB value (string, number, boolean, object)
- `updated_at` — last changed timestamp

## Security
- RLS enabled on all tables.
- `TO anon, authenticated` on all policies — app runs with anon key (no login).
- `USING (true)` is intentional: all data is shared/public within this single-tenant app.
*/

-- ─── snippets ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS snippets (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL DEFAULT 'untitled.py',
  content      text        NOT NULL DEFAULT '',
  language     text        NOT NULL DEFAULT 'python',
  description  text        NOT NULL DEFAULT '',
  is_pinned    boolean     NOT NULL DEFAULT false,
  run_count    integer     NOT NULL DEFAULT 0,
  last_run_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_snippets" ON snippets;
CREATE POLICY "anon_select_snippets" ON snippets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_snippets" ON snippets;
CREATE POLICY "anon_insert_snippets" ON snippets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_snippets" ON snippets;
CREATE POLICY "anon_update_snippets" ON snippets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_snippets" ON snippets;
CREATE POLICY "anon_delete_snippets" ON snippets FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS snippets_is_pinned_idx ON snippets (is_pinned);
CREATE INDEX IF NOT EXISTS snippets_updated_at_idx ON snippets (updated_at DESC);
CREATE INDEX IF NOT EXISTS snippets_language_idx   ON snippets (language);

-- ─── run_history ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS run_history (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id    uuid        REFERENCES snippets(id) ON DELETE SET NULL,
  code          text        NOT NULL DEFAULT '',
  inputs        jsonb       NOT NULL DEFAULT '[]',
  output        text        NOT NULL DEFAULT '',
  exit_code     integer     NOT NULL DEFAULT 0,
  duration_ms   integer     NOT NULL DEFAULT 0,
  error_message text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE run_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_run_history" ON run_history;
CREATE POLICY "anon_select_run_history" ON run_history FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_run_history" ON run_history;
CREATE POLICY "anon_insert_run_history" ON run_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_run_history" ON run_history;
CREATE POLICY "anon_update_run_history" ON run_history FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_run_history" ON run_history;
CREATE POLICY "anon_delete_run_history" ON run_history FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS run_history_snippet_id_idx  ON run_history (snippet_id);
CREATE INDEX IF NOT EXISTS run_history_created_at_idx  ON run_history (created_at DESC);
CREATE INDEX IF NOT EXISTS run_history_exit_code_idx   ON run_history (exit_code);

-- ─── settings ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
  key        text        PRIMARY KEY,
  value      jsonb       NOT NULL DEFAULT 'null',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE
  TO anon, authenticated USING (true);

-- ─── auto-update updated_at on snippets ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS snippets_updated_at ON snippets;
CREATE TRIGGER snippets_updated_at
  BEFORE UPDATE ON snippets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
