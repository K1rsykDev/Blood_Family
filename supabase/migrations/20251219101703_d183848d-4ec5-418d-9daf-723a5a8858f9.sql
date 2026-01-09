-- Table for leave family requests
CREATE TABLE public.leave_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    username_ingame text NOT NULL,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    responded_by uuid REFERENCES public.profiles(id),
    CONSTRAINT leave_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Table for vacation requests
CREATE TABLE public.vacations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    responded_by uuid REFERENCES public.profiles(id),
    CONSTRAINT vacations_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Add position, priority and responsibilities to profiles for player ordering
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position_responsibility text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sort_priority integer NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;

-- RLS for leave_requests
CREATE POLICY "Users can view own leave requests" ON public.leave_requests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and developers can view all leave requests" ON public.leave_requests
FOR SELECT USING (is_admin_or_developer(auth.uid()));

CREATE POLICY "Members can create leave requests" ON public.leave_requests
FOR INSERT WITH CHECK (auth.uid() = user_id AND is_member_or_admin(auth.uid()));

CREATE POLICY "Admins and developers can update leave requests" ON public.leave_requests
FOR UPDATE USING (is_admin_or_developer(auth.uid()));

-- RLS for vacations
CREATE POLICY "Users can view own vacations" ON public.vacations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active vacations" ON public.vacations
FOR SELECT USING (status = 'approved' AND end_date >= CURRENT_DATE);

CREATE POLICY "Admins and developers can view all vacations" ON public.vacations
FOR SELECT USING (is_admin_or_developer(auth.uid()));

CREATE POLICY "Members can create vacations" ON public.vacations
FOR INSERT WITH CHECK (auth.uid() = user_id AND is_member_or_admin(auth.uid()));

CREATE POLICY "Admins and developers can update vacations" ON public.vacations
FOR UPDATE USING (is_admin_or_developer(auth.uid()));

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vacations;