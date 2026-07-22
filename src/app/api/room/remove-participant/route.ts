import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { roomName, identity } = await req.json();

    if (!roomName || !identity) {
      return NextResponse.json({ error: 'roomName and identity are required' }, { status: 400 });
    }

    // Verify authenticated user session
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // Verify against Supabase that the caller is the true owner or co-owner of the room
    const { data: dbRoom, error: dbError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomName)
      .maybeSingle();

    if (dbError || !dbRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
    }

    const serverUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);

    const isDbOwner = dbRoom.owner_id === user.id;
    const isDbCoOwner = Array.isArray(dbRoom.co_owners) && (
      dbRoom.co_owners.includes(user.id) ||
      dbRoom.co_owners.includes(user.user_metadata?.display_name || '') ||
      dbRoom.co_owners.includes(user.user_metadata?.full_name || '') ||
      dbRoom.co_owners.includes(user.email || '')
    );

    if (!isDbOwner && !isDbCoOwner) {
      return NextResponse.json({ error: 'Only the room owner or co-owner can remove participants' }, { status: 403 });
    }

    // Check moderation hierarchy
    const isTargetOwner = identity === dbRoom.owner_id;
    if (isTargetOwner) {
      return NextResponse.json({ error: 'Cannot remove the room owner.' }, { status: 403 });
    }

    const isTargetCoOwner = Array.isArray(dbRoom.co_owners) && (
      dbRoom.co_owners.includes(identity) ||
      dbRoom.co_owners.some((co: string) => co.toLowerCase() === identity.toLowerCase())
    );

    if (isTargetCoOwner && !isDbOwner) {
      return NextResponse.json({ error: 'Co-owners cannot remove other co-owners or the owner.' }, { status: 403 });
    }

    if (isTargetCoOwner && isDbOwner) {
      return NextResponse.json({ error: 'Please remove co-owner role before kicking.' }, { status: 403 });
    }

    await svc.removeParticipant(roomName, identity);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Failed to remove participant:', err);
    const msg = err instanceof Error ? err.message : 'Failed to remove participant';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
