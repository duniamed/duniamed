-- Add is_online column to specialists table for instant consultation availability
ALTER TABLE public.specialists 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Add index for better query performance when filtering online specialists
CREATE INDEX IF NOT EXISTS idx_specialists_is_online ON public.specialists(is_online) WHERE is_online = true;

-- Add comment
COMMENT ON COLUMN public.specialists.is_online IS 'Whether the specialist is currently online and available for instant consultations';