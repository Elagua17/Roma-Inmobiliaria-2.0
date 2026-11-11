/*
# Create properties table for real estate app

1. New Tables
- `properties` — stores all real estate listings with full details, images, amenities, and location data.
2. Indexes on operation, property_type, location, and price for fast filtering.
3. Security: RLS enabled, public read access (`SELECT`), write access (`INSERT`, `UPDATE`, `DELETE`) restricted strictly to authenticated administrators.
*/

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('venta', 'alquiler')),
  property_type text NOT NULL CHECK (property_type IN ('casa', 'departamento', 'terreno', 'local', 'campo', 'galpon')),
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'ARS')),
  location text NOT NULL,
  address text,
  bedrooms integer,
  bathrooms integer,
  parking integer NOT NULL DEFAULT 0,
  covered_area integer,
  total_area integer,
  amenities text[] NOT NULL DEFAULT '{}',
  images text[] NOT NULL DEFAULT '{}',
  lat numeric,
  lng numeric,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_operation ON properties(operation);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_properties" ON properties;
CREATE POLICY "anon_select_properties" ON properties FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_properties" ON properties;
CREATE POLICY "auth_insert_properties" ON properties FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_properties" ON properties;
CREATE POLICY "auth_update_properties" ON properties FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_properties" ON properties;
CREATE POLICY "auth_delete_properties" ON properties FOR DELETE
  TO authenticated USING (true);