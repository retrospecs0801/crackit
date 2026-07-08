import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { roomName, identity, ownerId } = await req.json();

    if (!roomName || !identity) {
      return NextResponse.json({ error: 'roomName and identity are required' }, { status: 400 });
    }

    // Verify authenticated user is the owner
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== ownerId) {
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
