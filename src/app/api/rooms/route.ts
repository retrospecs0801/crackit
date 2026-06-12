import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { Room } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
  }

  // Use http(s) for the server API client if the URL is ws(s)
  const serverUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');

  try {
    const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);
    const livekitRooms = await svc.listRooms();

    const activeRooms: Room[] = [];

    for (const lkRoom of livekitRooms) {
      if (!lkRoom.metadata) continue;
      try {
        const roomData = JSON.parse(lkRoom.metadata) as Room;
        // Update current participants count based on actual LiveKit room data
        roomData.currentStudents = lkRoom.numParticipants;
        activeRooms.push(roomData);
      } catch (e) {
        // Ignore rooms with invalid metadata
        console.warn(`Failed to parse metadata for room ${lkRoom.name}`);
      }
    }

    return NextResponse.json(activeRooms);
  } catch (error: any) {
    console.error('Failed to list rooms:', error);
    return NextResponse.json({ error: error.message || 'Failed to list rooms' }, { status: 500 });
  }
}
