-- Create shop_items table
CREATE TABLE public.shop_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  field text NOT NULL,
  icon text NOT NULL DEFAULT 'sparkles',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view active shop items
CREATE POLICY "Anyone can view active shop items"
ON public.shop_items
FOR SELECT
USING (is_active = true);

-- Developers can view all shop items
CREATE POLICY "Developers can view all shop items"
ON public.shop_items
FOR SELECT
USING (is_developer(auth.uid()));

-- Developers can manage shop items
CREATE POLICY "Developers can insert shop items"
ON public.shop_items
FOR INSERT
WITH CHECK (is_developer(auth.uid()));

CREATE POLICY "Developers can update shop items"
ON public.shop_items
FOR UPDATE
USING (is_developer(auth.uid()));

CREATE POLICY "Developers can delete shop items"
ON public.shop_items
FOR DELETE
USING (is_developer(auth.uid()));

-- Insert default item
INSERT INTO public.shop_items (name, description, price, field, icon)
VALUES ('Підсвічування нікнейму', 'Ваш нікнейм буде підсвічуватись красивим ефектом в профілі та на сторінці гравців', 5000, 'has_nickname_glow', 'sparkles');