-- Enable REPLICA IDENTITY FULL for notifications tracking
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.contracts REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;