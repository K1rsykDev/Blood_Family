-- Create table for message reactions
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('dm', 'general')),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view reactions"
ON public.message_reactions
FOR SELECT
USING (true);

-- Users can add reactions
CREATE POLICY "Users can add reactions"
ON public.message_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON public.message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Add reply_to_id column to direct_messages
ALTER TABLE public.direct_messages ADD COLUMN reply_to_id UUID REFERENCES public.direct_messages(id) ON DELETE SET NULL;

-- Add reply_to_id column to general_chat
ALTER TABLE public.general_chat ADD COLUMN reply_to_id UUID REFERENCES public.general_chat(id) ON DELETE SET NULL;

-- Enable realtime for message_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;