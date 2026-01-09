-- Add discord_id to applications table
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS discord_id VARCHAR(255);

-- Add comment
COMMENT ON COLUMN public.applications.discord_id IS 'Discord ID for contact';