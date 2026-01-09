-- Create cinema rooms table
CREATE TABLE public.cinema_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  max_seats integer NOT NULL DEFAULT 10,
  current_video_url text,
  video_playing boolean DEFAULT false,
  video_time numeric DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create cinema room members table
CREATE TABLE public.cinema_room_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.cinema_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create cinema chat messages table
CREATE TABLE public.cinema_chat (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.cinema_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cinema_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_chat ENABLE ROW LEVEL SECURITY;

-- RLS policies for cinema_rooms
CREATE POLICY "Members can view cinema rooms" ON public.cinema_rooms
  FOR SELECT USING (is_member_or_admin(auth.uid()));

CREATE POLICY "Members can create cinema rooms" ON public.cinema_rooms
  FOR INSERT WITH CHECK (is_member_or_admin(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Room creator can update room" ON public.cinema_rooms
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Room creator can delete room" ON public.cinema_rooms
  FOR DELETE USING (auth.uid() = created_by);

-- RLS policies for cinema_room_members
CREATE POLICY "Members can view room members" ON public.cinema_room_members
  FOR SELECT USING (is_member_or_admin(auth.uid()));

CREATE POLICY "Members can join rooms" ON public.cinema_room_members
  FOR INSERT WITH CHECK (is_member_or_admin(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Members can leave rooms" ON public.cinema_room_members
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for cinema_chat
CREATE POLICY "Members can view chat" ON public.cinema_chat
  FOR SELECT USING (is_member_or_admin(auth.uid()));

CREATE POLICY "Members can send messages" ON public.cinema_chat
  FOR INSERT WITH CHECK (is_member_or_admin(auth.uid()) AND auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cinema_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cinema_room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cinema_chat;

-- Create trigger for updated_at
CREATE TRIGGER update_cinema_rooms_updated_at
  BEFORE UPDATE ON public.cinema_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();