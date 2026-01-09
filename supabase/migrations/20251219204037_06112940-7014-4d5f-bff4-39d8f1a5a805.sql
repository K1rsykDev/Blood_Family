-- Add member_count column to site_settings
ALTER TABLE public.site_settings
ADD COLUMN member_count integer DEFAULT 150;