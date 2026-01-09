-- Create blood_leaders table for the leaders page content
CREATE TABLE public.blood_leaders (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blood_leaders ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "Anyone can view blood_leaders" 
ON public.blood_leaders 
FOR SELECT 
USING (true);

-- Only developers can update
CREATE POLICY "Developers can update blood_leaders" 
ON public.blood_leaders 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'developer'
));

-- Only developers can insert
CREATE POLICY "Developers can insert blood_leaders" 
ON public.blood_leaders 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'developer'
));

-- Insert default content
INSERT INTO public.blood_leaders (content) VALUES ('# Керівники Blood Family

## Лідер
- **Kiril Blood** - Засновник та головний лідер

## Заступники
- Додайте заступників тут

## Старші учасники
- Додайте старших учасників тут
');

-- Create function to check if user is developer
CREATE OR REPLACE FUNCTION public.is_developer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role = 'developer'
  )
$$;

-- Update RLS policy for profiles to allow developers to update all profiles
CREATE POLICY "Developers can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid() AND p.role = 'developer'
));