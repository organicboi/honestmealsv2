-- Enable storage extension if not already enabled (usually enabled by default on Supabase)
-- CREATE EXTENSION IF NOT EXISTS "storage";

-- Create the bucket if it doesn't exist (this might fail if run as non-superuser, usually done in dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress_photos', 'progress_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'progress_photos' AND
  auth.uid() = owner
);

-- Policy to allow users to view their own images (or public if we want)
-- Since we want to show them in the app, and they are "progress photos", maybe keep them private to the user?
-- But the app needs to load them. If the bucket is public, anyone with the URL can see.
-- If the bucket is private, we need signed URLs.
-- For simplicity in this demo, let's make them public readable but only owner can upload/delete.
-- Actually, let's make them publicly readable for now to avoid signed URL complexity in the client component, 
-- but in a real app, we'd use signed URLs or RLS.
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'progress_photos');

-- Policy to allow users to delete their own images
CREATE POLICY "Allow users to delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'progress_photos' AND
  auth.uid() = owner
);
