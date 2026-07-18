import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { Room } from '@/types';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify room exists and caller is owner
    const { data: dbRoom, error: fetchError } = await supabase
      .from('rooms')
      .select('owner_id')
      .eq('id', roomDetails.id)
      .single();

    if (fetchError || !dbRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (dbRoom.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the room owner can modify settings' }, { status: 403 });
    }

    const fullRoomDetails: Room = {
      ...roomDetails,
      owner_id: user.id,
      ownerId: user.id,
      maxStudents: roomDetails.maxStudents || 6,
      welcomeMessageEnabled: roomDetails.welcomeMessageEnabled || false,
      welcomeMessageText: roomDetails.welcomeMessageText || null || undefined,
      micDisabled: roomDetails.micDisabled || false,
      cameraDisabled: roomDetails.cameraDisabled || false,
      chatDisabled: roomDetails.chatDisabled || false,
    };

    // 1. Update Supabase rooms table row
    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        name: fullRoomDetails.name,
        max_students: fullRoomDetails.maxStudents,
        welcome_message_enabled: fullRoomDetails.welcomeMessageEnabled,
        welcome_message_text: fullRoomDetails.welcomeMessageText || null,
        mic_disabled: fullRoomDetails.micDisabled,
        camera_disabled: fullRoomDetails.cameraDisabled,
        chat_disabled: fullRoomDetails.chatDisabled,
      })
      .eq('id', fullRoomDetails.id);

    if (updateError) {
      console.error('Failed to update Supabase room:', updateError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    // 2. Update LiveKit metadata
    const serverUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);

    try {
      await svc.updateRoomMetadata(fullRoomDetails.id, JSON.stringify(fullRoomDetails));
    } catch (lkErr) {
      console.warn('LiveKit metadata update failed (room may be currently inactive):', lkErr);
    }

    return NextResponse.json({ success: true, room: fullRoomDetails });
  } catch (error: unknown) {
    console.error('Failed to update room:', error);
    const message = error instanceof Error ? error.message : 'Failed to update room';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
