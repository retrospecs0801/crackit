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

    const fullRoomDetails: Room = {
      ...roomDetails,
      maxStudents: roomDetails.maxStudents || 6,
      maxParticipants: roomDetails.maxParticipants ?? roomDetails.maxStudents ?? 6,
      camMandatory: roomDetails.camMandatory || false,
      welcomeMessageEnabled: roomDetails.welcomeMessageEnabled || false,
      welcomeMessageText: roomDetails.welcomeMessageText || undefined,
      micDisabled: roomDetails.micDisabled || false,
      cameraDisabled: roomDetails.cameraDisabled || false,
      chatDisabled: roomDetails.chatDisabled || false,
      focusMicLockEnabled: roomDetails.focusMicLockEnabled ?? true,
      focusChatLockEnabled: roomDetails.focusChatLockEnabled ?? true,
    };

    // Use http(s) for the server API client if the URL is ws(s)
    const serverUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);

    await svc.createRoom({
      name: fullRoomDetails.id,
      emptyTimeout: 5 * 60, // 5 minutes (auto-delete empty room after 5 min)
      maxParticipants: fullRoomDetails.maxParticipants,
      metadata: JSON.stringify(fullRoomDetails),
    });

    return NextResponse.json({ success: true, room: fullRoomDetails });
  } catch (error: unknown) {
    console.error('Failed to create room:', error);
    const message = error instanceof Error ? error.message : 'Failed to create room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
