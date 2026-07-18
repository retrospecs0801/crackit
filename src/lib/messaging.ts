'use server';

import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/types';

export interface ConversationWithDetails {
  id: string;
  created_at: string;
  updated_at: string;
  otherUser: Profile;
  last_message_preview: string | null;
  last_message_time: string | null;
  unread_count: number;
  is_online?: boolean;
  last_seen_at?: string;
}

export interface DirectMessageWithSender {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  sender?: Profile;
}

export interface PresenceData {
  user_id: string;
  is_online: boolean;
  last_seen_at: string;
}

/**
 * 1. getFriends(userId: string): returns accepted friendships in BOTH directions,
 * joined to profiles, excluding blocked users.
 */
export async function getFriends(userId: string): Promise<Profile[]> {
  if (!userId) return [];
  const supabase = createClient();

  // 1. Get blocked users in either direction
  const { data: blocks } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  const blockedIds = new Set<string>();
  if (blocks) {
    for (const b of blocks) {
      if (b.blocker_id === userId) blockedIds.add(b.blocked_id);
      if (b.blocked_id === userId) blockedIds.add(b.blocker_id);
    }
  }

  // 2. Get accepted friendships in both directions
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error || !friendships || friendships.length === 0) {
    return [];
  }

  const friendIds = friendships
    .map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id))
    .filter((id) => id !== userId && !blockedIds.has(id));

  if (friendIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', friendIds);

  return (profiles || []) as Profile[];
}

/**
 * 2. findOrCreateConversation(currentUserId: string, otherUserId: string)
 */
export async function findOrCreateConversation(
  currentUserId: string,
  otherUserId: string
): Promise<{ conversation: { id: string; created_at: string; updated_at: string }; otherUser: Profile }> {
  if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
    throw new Error('Invalid users for conversation');
  }

  const supabase = createClient();

  // Verify ACCEPTED friends and neither has blocked the other
  const { data: blocks } = await supabase
    .from('blocks')
    .select('id')
    .or(
      `and(blocker_id.eq.${currentUserId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUserId})`
    )
    .limit(1);

  if (blocks && blocks.length > 0) {
    throw new Error('Cannot message this user due to blocking.');
  }

  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, status')
    .eq('status', 'accepted')
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${currentUserId})`
    )
    .limit(1);

  if (!friendships || friendships.length === 0) {
    throw new Error('You can only message accepted friends.');
  }

  // Find existing conversation where both are participants
  const { data: myParticipations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', currentUserId);

  let existingConversationId: string | null = null;

  if (myParticipations && myParticipations.length > 0) {
    const convIds = myParticipations.map((p) => p.conversation_id);
    const { data: otherParticipations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', convIds)
      .limit(1);

    if (otherParticipations && otherParticipations.length > 0) {
      existingConversationId = otherParticipations[0].conversation_id;
    }
  }

  // Fetch other user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', otherUserId)
    .single();

  if (!profileData) {
    throw new Error('Other user profile not found.');
  }
  const otherProfile = profileData as Profile;

  if (existingConversationId) {
    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', existingConversationId)
      .single();

    if (convData) {
      return { conversation: convData, otherUser: otherProfile };
    }
  }

  // Create new conversation
  const newConvId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { error: convError } = await supabase
    .from('conversations')
    .insert({ id: newConvId, created_at: now, updated_at: now });

  if (convError) {
    throw new Error(`Failed to create conversation: ${convError.message || 'Unknown error'}`);
  }

  // Insert both participants
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: newConvId, user_id: currentUserId, created_at: now },
      { conversation_id: newConvId, user_id: otherUserId, created_at: now },
    ]);

  if (partError) {
    // Attempt cleanup if participants failed
    await supabase.from('conversations').delete().eq('id', newConvId);
    throw new Error(`Failed to add participants: ${partError.message}`);
  }

  const newConv = { id: newConvId, created_at: now, updated_at: now };
  return { conversation: newConv, otherUser: otherProfile };
}

/**
 * 3. getConversations(userId: string)
 */
export async function getConversations(userId: string): Promise<ConversationWithDetails[]> {
  if (!userId) return [];
  const supabase = createClient();

  const { data: myParticipations, error: pError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (pError || !myParticipations || myParticipations.length === 0) {
    return [];
  }

  const convIds = myParticipations.map((p) => p.conversation_id);

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .in('id', convIds)
    .order('updated_at', { ascending: false });

  if (!conversations || conversations.length === 0) {
    return [];
  }

  // Get other participants for these conversations
  const { data: otherParticipants } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('conversation_id', convIds)
    .neq('user_id', userId);

  const otherUserIdMap = new Map<string, string>();
  const otherUserIds: string[] = [];
  otherParticipants?.forEach((p) => {
    otherUserIdMap.set(p.conversation_id, p.user_id);
    otherUserIds.push(p.user_id);
  });

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', Array.from(new Set(otherUserIds)));

  const profileMap = new Map<string, Profile>();
  profiles?.forEach((p) => profileMap.set(p.id, p as Profile));

  // Get presence for these users
  const presenceList = await getPresence(Array.from(new Set(otherUserIds)));
  const presenceMap = new Map<string, PresenceData>();
  presenceList.forEach((p) => presenceMap.set(p.user_id, p));

  // Get messages for previews and unread counts
  const { data: messages } = await supabase
    .from('direct_messages')
    .select('id, conversation_id, sender_id, body, created_at, read_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false });

  const latestMessageMap = new Map<string, { body: string; created_at: string }>();
  const unreadCountMap = new Map<string, number>();

  if (messages) {
    for (const m of messages) {
      if (!latestMessageMap.has(m.conversation_id)) {
        latestMessageMap.set(m.conversation_id, { body: m.body, created_at: m.created_at });
      }
      if (m.sender_id !== userId && !m.read_at) {
        unreadCountMap.set(m.conversation_id, (unreadCountMap.get(m.conversation_id) || 0) + 1);
      }
    }
  }

  const results: ConversationWithDetails[] = [];
  for (const c of conversations) {
    const otherUid = otherUserIdMap.get(c.id);
    if (!otherUid) continue;
    const otherProfile = profileMap.get(otherUid);
    if (!otherProfile) continue;

    const latest = latestMessageMap.get(c.id);
    const presence = presenceMap.get(otherUid);

    results.push({
      id: c.id,
      created_at: c.created_at,
      updated_at: c.updated_at,
      otherUser: otherProfile,
      last_message_preview: latest ? latest.body : null,
      last_message_time: latest ? latest.created_at : c.updated_at || c.created_at,
      unread_count: unreadCountMap.get(c.id) || 0,
      is_online: presence?.is_online || false,
      last_seen_at: presence?.last_seen_at,
    });
  }

  return results.sort((a, b) => {
    const timeA = new Date(a.last_message_time || a.updated_at).getTime();
    const timeB = new Date(b.last_message_time || b.updated_at).getTime();
    return timeB - timeA;
  });
}

/**
 * 4. getMessages(conversationId: string)
 */
export async function getMessages(conversationId: string): Promise<DirectMessageWithSender[]> {
  if (!conversationId) return [];
  const supabase = createClient();

  const { data: messages, error } = await supabase
    .from('direct_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error || !messages) return [];

  const senderIds = Array.from(new Set(messages.map((m) => m.sender_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', senderIds);

  const profileMap = new Map<string, Profile>();
  profiles?.forEach((p) => profileMap.set(p.id, p as Profile));

  return messages.map((m) => ({
    ...m,
    sender: profileMap.get(m.sender_id),
  })) as DirectMessageWithSender[];
}

/**
 * 5. sendMessage(conversationId: string, body: string, currentUserId: string)
 */
export async function sendMessage(
  conversationId: string,
  body: string,
  currentUserId: string
): Promise<DirectMessageWithSender> {
  const trimmed = body?.trim();
  if (!trimmed || trimmed.length === 0) {
    throw new Error('Message body cannot be empty');
  }

  const supabase = createClient();

  const now = new Date().toISOString();
  const { data: message, error } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: trimmed,
      created_at: now,
    })
    .select('*')
    .single();

  if (error || !message) {
    throw new Error(`Failed to send message: ${error?.message || 'Unknown error'}`);
  }

  await supabase
    .from('conversations')
    .update({ updated_at: now })
    .eq('id', conversationId);

  // Auto clean typing indicators
  await cleanupTypingIndicators();
  await removeTyping(conversationId, currentUserId);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUserId)
    .single();

  return {
    ...message,
    sender: (profile as Profile) || undefined,
  };
}

/**
 * 6. markMessagesRead(conversationId: string, currentUserId: string)
 */
export async function markMessagesRead(
  conversationId: string,
  currentUserId: string
): Promise<boolean> {
  if (!conversationId || !currentUserId) return false;
  const supabase = createClient();

  const { error } = await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', currentUserId)
    .is('read_at', null);

  return !error;
}

/**
 * 7. updatePresence(userId: string, isOnline: boolean)
 */
export async function updatePresence(userId: string, isOnline: boolean): Promise<boolean> {
  if (!userId) return false;
  const supabase = createClient();

  const now = new Date().toISOString();
  const { error } = await supabase.from('user_presence').upsert(
    {
      user_id: userId,
      is_online: isOnline,
      last_seen_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id' }
  );

  return !error;
}

/**
 * 8. getPresence(userIds: string[])
 */
export async function getPresence(userIds: string[]): Promise<PresenceData[]> {
  if (!userIds || userIds.length === 0) return [];
  const supabase = createClient();

  const { data } = await supabase
    .from('user_presence')
    .select('user_id, is_online, last_seen_at')
    .in('user_id', userIds);

  return (data || []) as PresenceData[];
}

/**
 * 9. setTyping(conversationId: string, userId: string)
 */
export async function setTyping(conversationId: string, userId: string): Promise<boolean> {
  if (!conversationId || !userId) return false;
  const supabase = createClient();

  const { error } = await supabase.from('typing_indicators').upsert(
    {
      conversation_id: conversationId,
      user_id: userId,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'conversation_id,user_id' }
  );

  return !error;
}

/**
 * 10. removeTyping(conversationId: string, userId: string)
 */
export async function removeTyping(conversationId: string, userId: string): Promise<boolean> {
  if (!conversationId || !userId) return false;
  const supabase = createClient();

  const { error } = await supabase
    .from('typing_indicators')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  return !error;
}

/**
 * 11. cleanupTypingIndicators()
 */
export async function cleanupTypingIndicators(): Promise<void> {
  try {
    const supabase = createClient();
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    await supabase
      .from('typing_indicators')
      .delete()
      .lt('created_at', fiveSecondsAgo);
  } catch (e) {
    console.error('Error cleaning up typing indicators:', e);
  }
}

/**
 * 12. updateUserProfile(userId: string, fields: ...)
 */
export async function updateUserProfile(
  userId: string,
  fields: { display_name: string; avatar_initials: string; avatar_url: string | null }
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
  return true;
}

/**
 * 13. createUserProfile(profileData: ...)
 */
export async function createUserProfile(profileData: {
  id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_initials: string;
  avatar_color: string;
}): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .insert(profileData);

  if (error) {
    throw new Error(error.message);
  }
  return true;
}
