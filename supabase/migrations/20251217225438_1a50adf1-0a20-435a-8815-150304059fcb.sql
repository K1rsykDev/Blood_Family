-- Add nav_labels column to site_settings for customizable navbar tab names
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS nav_labels jsonb DEFAULT '{
  "home": "Головна",
  "leaders": "Керівники Blood",
  "apply": "Заявка",
  "info": "Інформація",
  "reports": "Контракти",
  "news": "Новини",
  "giveaways": "Розіграші"
}'::jsonb;