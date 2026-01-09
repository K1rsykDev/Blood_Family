-- Update is_member_or_admin function to include developer role
CREATE OR REPLACE FUNCTION public.is_member_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role IN ('member', 'admin', 'developer')
  )
$$;