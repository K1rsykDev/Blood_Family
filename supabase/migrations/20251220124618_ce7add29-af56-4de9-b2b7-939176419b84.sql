-- Add social media URL columns to site_settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS social_tiktok text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS social_youtube text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS social_discord text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS social_telegram text DEFAULT NULL;