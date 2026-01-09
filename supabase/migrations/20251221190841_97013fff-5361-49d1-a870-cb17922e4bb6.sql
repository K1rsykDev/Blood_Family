-- Add gradient nickname colors to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nickname_gradient_start text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nickname_gradient_end text DEFAULT NULL;