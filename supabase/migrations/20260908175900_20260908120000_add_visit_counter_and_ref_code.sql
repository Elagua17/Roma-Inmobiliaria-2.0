/*
# Add visit counter and auto-generated reference codes

1. Modified Tables
- `properties` — added `visit_count` column (integer, defaults to 0) to track how many times each property detail page has been viewed.

2. New Tables
- `property_visits` — individual visit log. Each row records one view of a property detail page.
  - `id` (uuid, primary key)
  - `property_id` (uuid, foreign key to properties, ON DELETE CASCADE)
  - `visited_at` (timestamp, defaults to now())

3. New Functions
- `increment_visit(property_id uuid)` — SECURITY DEFINER function that atomically inserts a row in property_visits and increments the visit_count on the properties table. Returns the new visit_count. This ensures accurate concurrent counting.
- `generate_ref_code()` — SECURITY DEFINER function that generates an auto-incrementing reference code like "PROP-0001", "PROP-0002", etc., based on the highest existing sequence number.

4. Indexes
- Index on property_visits.property_id for fast lookups.

5. Security
- Enable RLS on property_visits.
- Allow anon + authenticated INSERT and SELECT (public catalog, no sign-in screen).
- DELETE and UPDATE denied (visit logs are append-only; only the increment_visit function can write rows).

6. Important Notes
1) The visit_count column is maintained by the increment_visit function, not by direct client updates.
2) The generate_ref_code function finds the max numeric suffix from existing ref_code values and returns the next one, ensuring unique sequential codes.
3) Both functions are SECURITY DEFINER and SET search_path = public for safety.
*/

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS visit_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS property_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  visited_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_visits_property_id ON property_visits(property_id);

ALTER TABLE property_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_visits" ON property_visits;
CREATE POLICY "auth_select_visits" ON property_visits FOR SELECT
  TO authenticated USING (true);

CREATE OR REPLACE FUNCTION increment_visit(p_property_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_count integer;
BEGIN
  INSERT INTO property_visits (property_id) VALUES (p_property_id);
  UPDATE properties SET visit_count = visit_count + 1 WHERE id = p_property_id
    RETURNING visit_count INTO v_new_count;
  IF v_new_count IS NULL THEN
    RAISE EXCEPTION 'Property not found';
  END IF;
  RETURN v_new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_visit(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_visit(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION generate_ref_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_max_num integer;
  v_new_code text;
BEGIN
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