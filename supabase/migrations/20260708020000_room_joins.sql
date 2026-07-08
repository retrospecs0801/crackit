-- Create room_joins table to track study activity
CREATE TABLE IF NOT EXISTS public.room_joins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient date range queries per user
CREATE INDEX IF NOT EXISTS idx_room_joins_user_joined_at ON public.room_joins (user_id, joined_at);

-- Enable RLS
ALTER TABLE public.room_joins ENABLE ROW LEVEL SECURITY;

-- Policy: User can insert their own room joins
CREATE POLICY "Users can insert their own room joins"
  ON public.room_joins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: User can view their own room joins
CREATE POLICY "Users can view their own room joins"
  ON public.room_joins
  FOR SELECT
  USING (auth.uid() = user_id);
