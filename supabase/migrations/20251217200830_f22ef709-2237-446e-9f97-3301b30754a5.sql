-- Create custom_roles table for role management
CREATE TABLE public.custom_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    color text NOT NULL DEFAULT '#22c55e',
    has_admin_access boolean NOT NULL DEFAULT false,
    has_reports_access boolean NOT NULL DEFAULT true,
    has_news_access boolean NOT NULL DEFAULT true,
    has_giveaways_access boolean NOT NULL DEFAULT true,
    has_roulette_access boolean NOT NULL DEFAULT false,
    has_developer_access boolean NOT NULL DEFAULT false,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Anyone can view custom roles
CREATE POLICY "Anyone can view custom_roles"
ON public.custom_roles
FOR SELECT
USING (true);

-- Only developers can manage custom roles
CREATE POLICY "Developers can insert custom_roles"
ON public.custom_roles
FOR INSERT
WITH CHECK (is_developer(auth.uid()));

CREATE POLICY "Developers can update custom_roles"
ON public.custom_roles
FOR UPDATE
USING (is_developer(auth.uid()));

CREATE POLICY "Developers can delete custom_roles"
ON public.custom_roles
FOR DELETE
USING (is_developer(auth.uid()));

-- Add custom_role_id to profiles
ALTER TABLE public.profiles ADD COLUMN custom_role_id uuid REFERENCES public.custom_roles(id);

-- Create Канабіс role
INSERT INTO public.custom_roles (name, display_name, color, has_admin_access, has_reports_access, has_news_access, has_giveaways_access, has_roulette_access, has_developer_access)
VALUES ('kanabis', 'Канабіс', '#22c55e', true, true, true, true, true, false);