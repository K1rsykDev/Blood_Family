-- Add BC balance and nickname glow to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bc_balance integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_nickname_glow boolean NOT NULL DEFAULT false;

-- Create BC transactions table for history
CREATE TABLE public.bc_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL, -- 'contract_payment', 'admin_grant', 'shop_purchase'
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bc_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.bc_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Developers can view all transactions
CREATE POLICY "Developers can view all transactions"
ON public.bc_transactions
FOR SELECT
USING (is_developer(auth.uid()));

-- Service role can insert transactions (for automated payments)
CREATE POLICY "Allow insert transactions"
ON public.bc_transactions
FOR INSERT
WITH CHECK (true);