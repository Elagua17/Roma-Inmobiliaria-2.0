/*
# Security hardening, clients table, and missing schema updates

1. New Tables & Columns
- `clients` — stores client personal details and notes (restricted strictly to authenticated admins).
- `properties.client_id` — optional foreign key linking a property to its owner/client.
- `properties.whatsapp_clicks` and `properties.shares` — counters for WhatsApp inquiries and share actions.
- Updated `properties_property_type_check` constraint to include `'campo'` and `'galpon'`.

2. New RPC Functions
- `increment_whatsapp(p_property_id uuid)` — atomically increments `whatsapp_clicks`.
- `increment_share(p_property_id uuid)` — atomically increments `shares`.

3. Row Level Security (RLS) Hardening
- `properties`: Keep `SELECT` public (`anon`, `authenticated`), but restrict `INSERT`, `UPDATE`, and `DELETE` strictly to `authenticated`.
- `clients`: Restrict all operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) strictly to `authenticated`.
- `storage.objects` (`property-images`): Keep `SELECT` public, restrict `INSERT`, `UPDATE`, and `DELETE` strictly to `authenticated`.
- `property_visits`: Remove direct `anon` insert policy (inserts are handled safely via `SECURITY DEFINER` function `increment_visit`).
*/

-- 1. Create clients table if not exists
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_all_clients" ON clients;
DROP POLICY IF EXISTS "auth_select_clients" ON clients;
DROP POLICY IF EXISTS "auth_insert_clients" ON clients;
DROP POLICY IF EXISTS "auth_update_clients" ON clients;
DROP POLICY IF EXISTS "auth_delete_clients" ON clients;

CREATE POLICY "auth_select_clients" ON clients FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "auth_insert_clients" ON clients FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_clients" ON clients FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_clients" ON clients FOR DELETE
  TO authenticated USING (true);

-- 2. Update properties columns and constraints
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares integer NOT NULL DEFAULT 0;

ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check
  CHECK (property_type IN ('casa', 'departamento', 'terreno', 'local', 'campo', 'galpon'));

-- 3. Harden RLS policies on properties (public read, authenticated write)
DROP POLICY IF EXISTS "anon_insert_properties" ON properties;
DROP POLICY IF EXISTS "anon_update_properties" ON properties;
DROP POLICY IF EXISTS "anon_delete_properties" ON properties;
DROP POLICY IF EXISTS "auth_insert_properties" ON properties;
DROP POLICY IF EXISTS "auth_update_properties" ON properties;
DROP POLICY IF EXISTS "auth_delete_properties" ON properties;

CREATE POLICY "auth_insert_properties" ON properties FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_properties" ON properties FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_properties" ON properties FOR DELETE
  TO authenticated USING (true);

-- 4. Harden RLS policies on storage.objects for property-images
DROP POLICY IF EXISTS "public_insert_property_images" ON storage.objects;
DROP POLICY IF EXISTS "public_update_property_images" ON storage.objects;
DROP POLICY IF EXISTS "public_delete_property_images" ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_property_images" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_property_images" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_property_images" ON storage.objects;

CREATE POLICY "auth_insert_property_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "auth_update_property_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'property-images') WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "auth_delete_property_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'property-images');

-- 5. Harden property_visits policies (writes only via increment_visit SECURITY DEFINER)
DROP POLICY IF EXISTS "anon_insert_visits" ON property_visits;
DROP POLICY IF EXISTS "anon_select_visits" ON property_visits;
DROP POLICY IF EXISTS "auth_select_visits" ON property_visits;

CREATE POLICY "auth_select_visits" ON property_visits FOR SELECT
  TO authenticated USING (true);

-- 6. RPC functions for WhatsApp and Share tracking
CREATE OR REPLACE FUNCTION increment_whatsapp(p_property_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_count integer;
BEGIN
  UPDATE properties
  SET whatsapp_clicks = COALESCE(whatsapp_clicks, 0) + 1
  WHERE id = p_property_id
  RETURNING whatsapp_clicks INTO v_new_count;

  RETURN v_new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_whatsapp(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_whatsapp(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION increment_share(p_property_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_count integer;
BEGIN
  UPDATE properties
  SET shares = COALESCE(shares, 0) + 1
  WHERE id = p_property_id
  RETURNING shares INTO v_new_count;

  RETURN v_new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_share(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_share(uuid) TO anon, authenticated;

-- Restrict generate_ref_code to authenticated users only with advisory lock against race conditions
CREATE OR REPLACE FUNCTION generate_ref_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_max_num integer;
  v_new_code text;
BEGIN
  IF auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM pg_advisory_xact_lock(98451234);

  SELECT COALESCE(MAX(CAST(
    regexp_replace(ref_code, '^PROP-', '') AS integer
  )), 0)
  INTO v_max_num
  FROM properties
  WHERE ref_code ~ '^PROP-[0-9]+$';

  v_new_code := 'PROP-' || lpad((v_max_num + 1)::text, 4, '0');
  RETURN v_new_code;
END;
$$;

REVOKE EXECUTE ON FUNCTION generate_ref_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION generate_ref_code() TO authenticated;
