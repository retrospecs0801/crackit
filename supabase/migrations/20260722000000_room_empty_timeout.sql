-- Add last_empty_at timestamp column to rooms table to accurately track when the last participant left
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS last_empty_at timestamptz DEFAULT now();
