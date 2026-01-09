-- Add password_reset_required flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_reset_required boolean DEFAULT false;