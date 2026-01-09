-- Add static column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS static character varying;