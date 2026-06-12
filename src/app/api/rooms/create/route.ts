import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { Room } from '@/types';

export async function POST(req: NextRequest) {
  const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
  }

  try {
    const roomDetails: Room = await req.json();

    if (!roomDetails || !roomDetails.id || !roomDetails.name) {
      return NextResponse.json({ error: 'Invalid room details' }, { status: 400 });
    }

    // Use http(s) for the server API client if the URL is ws(s)
    const serverUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);

    const lkRoom = await svc.createRoom({
      name: roomDetails.id,
      emptyTimeout: 10 * 60, // 10 minutes (give creator plenty of time to join)
      maxParticipants: roomDetails.maxStudents || 10,
      metadata: JSON.stringify(roomDetails),
    });

    return NextResponse.json({ success: true, room: roomDetails });
  } catch (error: any) {
    console.error('Failed to create room:', error);
    return NextResponse.json({ error: error.message || 'Failed to create room' }, { status: 500 });
  }
}
