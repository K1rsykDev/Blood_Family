-- Create a function to check if user is admin or developer
CREATE OR REPLACE FUNCTION public.is_admin_or_developer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role IN ('admin', 'developer')
  )
$$;

-- Update applications policies
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
CREATE POLICY "Admins and developers can update applications" 
ON public.applications 
FOR UPDATE 
USING (is_admin_or_developer(auth.uid()));

DROP POLICY IF EXISTS "Admins can view applications" ON public.applications;
CREATE POLICY "Admins and developers can view applications" 
ON public.applications 
FOR SELECT 
USING (is_admin_or_developer(auth.uid()));

-- Update contracts policies
DROP POLICY IF EXISTS "Admins can update contracts" ON public.contracts;
CREATE POLICY "Admins and developers can update contracts" 
ON public.contracts 
FOR UPDATE 
USING (is_admin_or_developer(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all contracts" ON public.contracts;
CREATE POLICY "Admins and developers can view all contracts" 
ON public.contracts 
FOR SELECT 
USING (is_admin_or_developer(auth.uid()));

-- Update giveaways policies
DROP POLICY IF EXISTS "Admins can manage giveaways" ON public.giveaways;
CREATE POLICY "Admins and developers can manage giveaways" 
ON public.giveaways 
FOR ALL 
USING (is_admin_or_developer(auth.uid()));

-- Update news policies
DROP POLICY IF EXISTS "Admins can manage news" ON public.news;
CREATE POLICY "Admins and developers can manage news" 
ON public.news 
FOR ALL 
USING (is_admin_or_developer(auth.uid()));

-- Update site_settings policies
DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
CREATE POLICY "Admins and developers can update settings" 
ON public.site_settings 
FOR UPDATE 
USING (is_admin_or_developer(auth.uid()));

-- Update profiles policies for admin updates
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins and developers can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_admin_or_developer(auth.uid()));

-- Remove the old developer-specific policy since it's now covered
DROP POLICY IF EXISTS "Developers can update all profiles" ON public.profiles;