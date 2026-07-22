import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
  }

  const serverUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');

  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { roomId, action, targetUserId, targetDisplayName } = await req.json();

    if (!roomId || !action || !targetDisplayName) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: dbRoom, error: dbErr } = await supabaseAdmin
      .from('rooms')
      .select('owner_id, co_owners')
      .eq('id', roomId)
      .maybeSingle();

    if (dbErr || !dbRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Security verify: only the current database owner can promote, demote, or transfer ownership
    if (user.id !== dbRoom.owner_id) {
      return NextResponse.json({ error: 'Only the room owner can manage roles.' }, { status: 403 });
    }

    const prevCoOwners = Array.isArray(dbRoom.co_owners) ? dbRoom.co_owners : [];

    if (action === 'promote') {
      const nextCoOwners = Array.from(new Set([...prevCoOwners, targetDisplayName, targetUserId])).filter(Boolean);
      const { error: updateErr } = await supabaseAdmin
        .from('rooms')
        .update({ co_owners: nextCoOwners })
        .eq('id', roomId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else if (action === 'demote') {
      const nextCoOwners = prevCoOwners.filter(n => n !== targetDisplayName && n !== targetUserId);
      const { error: updateErr } = await supabaseAdmin
        .from('rooms')
        .update({ co_owners: nextCoOwners })
        .eq('id', roomId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else if (action === 'transfer') {
      if (!targetUserId) {
        return NextResponse.json({ error: 'Target user ID is required for ownership transfer' }, { status: 400 });
      }
      const filtered = prevCoOwners.filter(n => n !== targetDisplayName && n !== targetUserId);
      const nextCoOwners = Array.from(new Set([...filtered, user.id, user.user_metadata?.display_name || ''])).filter(Boolean);
      const { error: updateErr } = await supabaseAdmin
        .from('rooms')
        .update({ owner_id: targetUserId, co_owners: nextCoOwners })
        .eq('id', roomId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Broadcast reliable DataChannel update via LiveKit server so clients update seamlessly
    try {
      const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);
      const payload = JSON.stringify({
        type: action === 'promote' ? 'ROLE_PROMOTE' : action === 'demote' ? 'ROLE_DEMOTE' : 'ROOM_TRANSFER',
        targetDisplayName,
        targetUserId,
        newOwnerDisplayName: action === 'transfer' ? targetDisplayName : undefined,
        oldOwnerDisplayName: action === 'transfer' ? (user.user_metadata?.display_name || user.email || user.id) : undefined,
        oldOwnerUserId: action === 'transfer' ? user.id : undefined,
      });
      await svc.sendData(roomId, new TextEncoder().encode(payload), 1, { topic: 'room-roles' });
    } catch (lkErr) {
      console.warn('[Roles API] Could not broadcast via LiveKit server:', lkErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[Roles API Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
