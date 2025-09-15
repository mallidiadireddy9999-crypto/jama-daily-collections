-- Check current storage policies for ads bucket
-- First, let's ensure super admins can upload, view, update, and delete files in the ads bucket

-- Create policy for super admins to upload ads
CREATE POLICY "Super admins can upload ad files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'ads' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

-- Create policy for super admins to view ad files
CREATE POLICY "Super admins can view ad files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'ads' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

-- Create policy for super admins to update ad files
CREATE POLICY "Super admins can update ad files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'ads' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

-- Create policy for super admins to delete ad files
CREATE POLICY "Super admins can delete ad files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'ads' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow public access to view ad files (so Jama users can see them)
CREATE POLICY "Public can view ad files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ads');

-- Ensure the ads bucket exists and is public for viewing
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ads', 'ads', true) 
ON CONFLICT (id) DO UPDATE SET public = true;