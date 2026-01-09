-- Create table for giveaway participants
CREATE TABLE public.giveaway_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    giveaway_id integer NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(giveaway_id, user_id)
);

-- Add winner column to giveaways table
ALTER TABLE public.giveaways ADD COLUMN winner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.giveaway_participants ENABLE ROW LEVEL SECURITY;

-- Members can view participants
CREATE POLICY "Members can view participants"
ON public.giveaway_participants
FOR SELECT
USING (is_member_or_admin(auth.uid()));

-- Members can participate
CREATE POLICY "Members can participate"
ON public.giveaway_participants
FOR INSERT
WITH CHECK (is_member_or_admin(auth.uid()) AND auth.uid() = user_id);

-- Members can remove their participation
CREATE POLICY "Members can remove participation"
ON public.giveaway_participants
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage participants
CREATE POLICY "Admins can manage participants"
ON public.giveaway_participants
FOR ALL
USING (is_admin_or_developer(auth.uid()));