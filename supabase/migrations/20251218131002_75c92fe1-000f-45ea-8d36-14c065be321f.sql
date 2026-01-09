
-- Add can_view_contracts permission to custom_roles
ALTER TABLE public.custom_roles ADD COLUMN IF NOT EXISTS can_view_contracts boolean NOT NULL DEFAULT false;

-- Create direct_messages table for private messaging
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create general_chat table for public chat
CREATE TABLE public.general_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create conversations table to track who users have messaged
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for direct_messages
CREATE POLICY "Users can view own messages" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own received messages" ON public.direct_messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- RLS policies for general_chat
CREATE POLICY "Members can view general chat" ON public.general_chat
  FOR SELECT USING (is_member_or_admin(auth.uid()));

CREATE POLICY "Members can send to general chat" ON public.general_chat
  FOR INSERT WITH CHECK (is_member_or_admin(auth.uid()) AND auth.uid() = user_id);

-- RLS policies for conversations
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.general_chat;

-- Add delete policies for applications (developers only)
CREATE POLICY "Developers can delete applications" ON public.applications
  FOR DELETE USING (is_developer(auth.uid()));

-- Add delete policies for contracts (developers only)  
CREATE POLICY "Developers can delete contracts" ON public.contracts
  FOR DELETE USING (is_developer(auth.uid()));
