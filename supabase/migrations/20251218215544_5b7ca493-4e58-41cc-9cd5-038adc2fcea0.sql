-- Add can_change_username permission to custom_roles
ALTER TABLE public.custom_roles 
ADD COLUMN IF NOT EXISTS can_change_username boolean NOT NULL DEFAULT false;