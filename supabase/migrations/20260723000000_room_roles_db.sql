-- Add a co_owners column (array of text representing display names or UUIDs of co-owners) to the rooms table
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS co_owners text[] DEFAULT '{}'::text[];

-- Create an index for faster lookups when querying rooms where a user is co-owner
CREATE INDEX IF NOT EXISTS idx_rooms_co_owners ON public.rooms USING GIN (co_owners);

-- Comment on column
COMMENT ON COLUMN public.rooms.co_owners IS 'Array of display names or UUIDs representing room co-owners.';
