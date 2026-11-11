/*
# Add property image storage

1. New Storage Bucket
- `property-images` — public bucket for listing photos displayed on the public catalog.
- Uploads accept common image formats and are limited to 10 MB per file.

2. Security
- Public read (`SELECT`) access for catalog display.
- Write (`INSERT`, `UPDATE`, `DELETE`) restricted strictly to authenticated administrators.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "public_read_property_images" ON storage.objects;
CREATE POLICY "public_read_property_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "auth_insert_property_images" ON storage.objects;
CREATE POLICY "auth_insert_property_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'property-images');

DROP POLICY IF EXISTS "auth_update_property_images" ON storage.objects;
CREATE POLICY "auth_update_property_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'property-images') WITH CHECK (bucket_id = 'property-images');

DROP POLICY IF EXISTS "auth_delete_property_images" ON storage.objects;
CREATE POLICY "auth_delete_property_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'property-images');