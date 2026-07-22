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

    // Verify against Supabase that the caller is the true owner of the room
    const { data: dbRoom, error: dbError } = await supabase
      .from('rooms')
      .select('owner_id')
      .eq('id', roomName)
      .maybeSingle();

    if (dbError || !dbRoom || dbRoom.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the room owner can remove participants' }, { status: 403 });
    }

    const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
    }

    const serverUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);

    await svc.removeParticipant(roomName, identity);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Failed to remove participant:', err);
    const msg = err instanceof Error ? err.message : 'Failed to remove participant';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
