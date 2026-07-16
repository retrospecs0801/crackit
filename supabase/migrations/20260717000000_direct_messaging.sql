-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversation participants (1:1 DM = 2 participants)
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Direct messages
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(trim(body)) > 0),
  created_at timestamptz DEFAULT now(),
  read_at timestamptz NULL
);

-- User presence (tracks last_seen_at for online/offline status)
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_seen_at timestamptz DEFAULT now(),
  is_online boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Typing indicators (ephemeral, auto-clean after 5 seconds)
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON public.direct_messages(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON public.typing_indicators(conversation_id);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helper function (avoids RLS infinite recursion on conversation_participants self-join)
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id uuid, uid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id AND user_id = uid
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS POLICIES: conversations
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (is_conversation_member(id, auth.uid()));

CREATE POLICY "Users can insert conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (is_conversation_member(id, auth.uid()))
  WITH CHECK (is_conversation_member(id, auth.uid()));

-- RLS POLICIES: conversation_participants
CREATE POLICY "Users can view their participation" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can insert participation" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_conversation_member(conversation_id, auth.uid()) OR true);

-- RLS POLICIES: direct_messages
CREATE POLICY "Users can view messages in their conversations" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can send messages to their conversations" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can mark their own messages as read" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (is_conversation_member(conversation_id, auth.uid()))
  WITH CHECK (is_conversation_member(conversation_id, auth.uid()));

-- RLS POLICIES: user_presence
CREATE POLICY "Users can view presence of anyone" ON public.user_presence
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own presence" ON public.user_presence
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own presence (update)" ON public.user_presence
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS POLICIES: typing_indicators
CREATE POLICY "Users can view typing in their conversations" ON public.typing_indicators
  FOR SELECT TO authenticated
  USING (is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can set their typing status" ON public.typing_indicators
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can remove their typing status" ON public.typing_indicators
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ADD TO REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
