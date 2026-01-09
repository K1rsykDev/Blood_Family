-- Create notifications table for storing user notifications
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- info, success, warning, contract_paid, etc.
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create telegram connections table
CREATE TABLE public.telegram_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  telegram_chat_id text,
  connection_code text NOT NULL UNIQUE,
  is_connected boolean NOT NULL DEFAULT false,
  connected_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create support tickets table
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  telegram_chat_id text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'support', -- support, idea
  status text NOT NULL DEFAULT 'open', -- open, answered, closed
  admin_response text,
  responded_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
CREATE POLICY "Service role can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

-- RLS policies for telegram_connections
CREATE POLICY "Users can view own telegram connection" 
ON public.telegram_connections FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram connection" 
ON public.telegram_connections FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram connection" 
ON public.telegram_connections FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for support_tickets
CREATE POLICY "Users can view own support tickets" 
ON public.support_tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Developers can view all support tickets" 
ON public.support_tickets FOR SELECT 
USING (is_developer(auth.uid()));

CREATE POLICY "Developers can update support tickets" 
ON public.support_tickets FOR UPDATE 
USING (is_developer(auth.uid()));

-- Function to generate unique connection code
CREATE OR REPLACE FUNCTION generate_connection_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_telegram_connections_code ON public.telegram_connections(connection_code);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);