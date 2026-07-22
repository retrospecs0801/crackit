-- Security Hardening Migration: Lock down RLS policies and restrict public/authenticated scraping of profiles & sensitive tables

-- 1. Helper function for secure check of display name availability (avoids exposing entire profiles table via RLS)
CREATE OR REPLACE FUNCTION public.check_display_name_available(check_name text, exclude_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(trim(display_name)) = lower(trim(check_name))
      AND (exclude_user_id IS NULL OR id <> exclude_user_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_display_name_available(text, uuid) TO authenticated, anon;

-- 2. Restrict public.profiles SELECT policy so /rest/v1/profiles?select=* cannot be scraped by arbitrary users
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

CREATE POLICY "profiles_select_restricted"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (requester_id = auth.uid() AND addressee_id = profiles.id)
         OR (addressee_id = auth.uid() AND requester_id = profiles.id)
    ) OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp1
      JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
      WHERE cp1.user_id = auth.uid() AND cp2.user_id = profiles.id
    ) OR
    EXISTS (
      SELECT 1 FROM public.room_joins r1
      JOIN public.room_joins r2 ON r1.room_id = r2.room_id
      WHERE r1.user_id = auth.uid() AND r2.user_id = profiles.id
        AND r1.joined_at >= (now() - interval '7 days')
        AND r2.joined_at >= (now() - interval '7 days')
    )
  );

-- 3. Harden public.rooms FOR UPDATE policy by adding WITH CHECK so owner_id cannot be transferred or violated
DROP POLICY IF EXISTS "rooms_update_owner" ON public.rooms;

CREATE POLICY "rooms_update_owner"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 4. Harden public.friendships FOR UPDATE policy so only addressee can accept friend requests
DROP POLICY IF EXISTS "Addressee can update friendship status" ON public.friendships;

CREATE POLICY "Addressee can update friendship status"
  ON public.friendships
  FOR UPDATE
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
  WITH CHECK (
    ((status = 'accepted' OR status = 'declined') AND auth.uid() = addressee_id) OR
    (status = 'declined' AND auth.uid() = requester_id) OR
    (status = 'pending' AND auth.uid() = requester_id)
  );

-- 5. Harden public.conversation_participants FOR INSERT by removing OR true
DROP POLICY IF EXISTS "Users can insert participation" ON public.conversation_participants;

CREATE POLICY "Users can insert participation"
  ON public.conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR is_conversation_member(conversation_id, auth.uid())
  );

-- 6. Restrict public.user_presence FOR SELECT so online status cannot be scraped globally via /rest/v1/user_presence?select=*
DROP POLICY IF EXISTS "Users can view presence of anyone" ON public.user_presence;

CREATE POLICY "Users can view presence restricted"
  ON public.user_presence
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE status = 'accepted'
        AND ((requester_id = auth.uid() AND addressee_id = user_presence.user_id)
          OR (addressee_id = auth.uid() AND requester_id = user_presence.user_id))
    ) OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp1
      JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
      WHERE cp1.user_id = auth.uid() AND cp2.user_id = user_presence.user_id
    )
  );
