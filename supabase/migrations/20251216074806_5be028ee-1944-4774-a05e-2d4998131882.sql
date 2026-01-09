-- Add banner_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add show_admin_code to site_settings
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS show_admin_code BOOLEAN DEFAULT false;

-- Create profile_likes table for player likes
CREATE TABLE IF NOT EXISTS public.profile_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

-- Enable RLS on profile_likes
ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for profile_likes
CREATE POLICY "Users can view likes" ON public.profile_likes
FOR SELECT USING (true);

CREATE POLICY "Users can create likes" ON public.profile_likes
FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete own likes" ON public.profile_likes
FOR DELETE USING (auth.uid() = from_user_id);

-- Make profiles public viewable (for player profiles)
CREATE POLICY "Anyone can view profiles" ON public.profiles
FOR SELECT USING (true);

-- Drop old restrictive select policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;