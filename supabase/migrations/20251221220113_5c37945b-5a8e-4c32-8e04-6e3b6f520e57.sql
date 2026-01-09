-- Add vacation_type column to vacations table
ALTER TABLE public.vacations 
ADD COLUMN vacation_type text NOT NULL DEFAULT 'ooc';

-- Add check constraint for valid values
ALTER TABLE public.vacations 
ADD CONSTRAINT vacations_type_check CHECK (vacation_type IN ('ooc', 'ic'));