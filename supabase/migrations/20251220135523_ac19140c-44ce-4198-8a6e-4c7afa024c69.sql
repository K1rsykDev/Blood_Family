-- Add maintenance mode column to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS maintenance_mode boolean DEFAULT false;