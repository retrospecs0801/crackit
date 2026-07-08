import { createClient } from '@/lib/supabase/client';
import { FriendRequestWithProfile, Profile, RelationshipStatus } from '@/types';

export async function getRelationshipStatus(
  currentUserId: string,
  targetUserId: string
): Promise<RelationshipStatus> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return 'none';
  }

  const supabase = createClient();

  // 1. Check if blocked in either direction
  const { data: blocks } = await supabase
    .from('blocks')
    .select('id')
    .or(
      `and(blocker_id.eq.${currentUserId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${currentUserId})`
    )
    .limit(1);

  if (blocks && blocks.length > 0) {
    return 'blocked';
  }

  // 2. Check friendships
  const { data: friendships } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
    )
    .limit(1);

  if (!friendships || friendships.length === 0) {
    return 'none';
  }

  const f = friendships[0];
  if (f.status === 'accepted') {
    return 'friends';
  }

  if (f.status === 'pending') {
    if (f.requester_id === currentUserId) {
      return 'pending_sent';
    }
    return 'pending_received';
  }

  return 'none';
}

export async function getPendingRequests(userId: string): Promise<FriendRequestWithProfile[]> {
  const supabase = createClient();
  const { data: requests, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('addressee_id', userId)
    .eq('status', 'pending');

  if (error || !requests || requests.length === 0) {
    return [];
  }

  const requesterIds = requests.map((r) => r.requester_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', requesterIds);

  const profileMap = new Map<string, Profile>();
  profiles?.forEach((p) => profileMap.set(p.id, p as Profile));

  return requests
    .map((r) => {
      const p = profileMap.get(r.requester_id);
      if (!p) return null;
      return {
        ...r,
        requester: p,
      } as FriendRequestWithProfile;
    })
    .filter(Boolean) as FriendRequestWithProfile[];
}

export async function getFriends(userId: string): Promise<Profile[]> {
  const supabase = createClient();
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error || !friendships || friendships.length === 0) {
    return [];
  }

  const friendIds = friendships.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', friendIds);

  return (profiles || []) as Profile[];
}

export async function sendRequest(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  if (currentUserId === targetUserId) {
    return { success: false, error: 'Cannot send friend request to yourself.' };
  }

  const status = await getRelationshipStatus(currentUserId, targetUserId);
  if (status === 'blocked') {
    return { success: false, error: 'Cannot send request to this user.' };
  }
  if (status === 'friends' || status === 'pending_sent') {
    return { success: true };
  }

  const supabase = createClient();

  // If there's already a declined or pending record in either direction, handle upsert
  const { error } = await supabase.from('friendships').upsert(
    {
      requester_id: currentUserId,
      addressee_id: targetUserId,
      status: 'pending',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'requester_id,addressee_id' }
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function acceptRequest(requestId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('friendships')
    .update({
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  return !error;
}

export async function declineRequest(requestId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId);

  return !error;
}

export async function blockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  const supabase = createClient();

  // 1. Delete any existing friendship records in either direction
  await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
    );

  // 2. Insert block record
  const { error } = await supabase.from('blocks').upsert(
    {
      blocker_id: currentUserId,
      blocked_id: targetUserId,
    },
    { onConflict: 'blocker_id,blocked_id' }
  );

  return !error;
}

export async function unblockUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', currentUserId)
    .eq('blocked_id', targetUserId);

  return !error;
}
