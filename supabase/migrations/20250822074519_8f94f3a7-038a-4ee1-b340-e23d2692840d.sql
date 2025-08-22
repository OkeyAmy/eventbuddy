-- Add others field to events table for AI to append custom information
ALTER TABLE public.events 
ADD COLUMN others jsonb DEFAULT '{}'::jsonb;

-- Add comment to document the field
COMMENT ON COLUMN public.events.others IS 'JSON field for AI to store additional event information that users want to track';