-- Add a co_owners column (array of text representing display names or UUIDs of co-owners) to the rooms table
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS co_owners text[] DEFAULT '{}'::text[];

-- Create an index for faster lookups when querying rooms where a user is co-owner
CREATE INDEX IF NOT EXISTS idx_rooms_co_owners ON public.rooms USING GIN (co_owners);

-- Comment on column
COMMENT ON COLUMN public.rooms.co_owners IS 'Array of display names or UUIDs representing room co-owners.';

-- Update the rooms FOR UPDATE policy so the current owner can transfer ownership (change owner_id) and manage co_owners
DROP POLICY IF EXISTS "rooms_update_owner" ON public.rooms;

CREATE POLICY "rooms_update_owner"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (true);
