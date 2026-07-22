import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { Room } from '@/types';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// ============================================================================
// CONFIGURATION: Set the time (in seconds) before an empty room is deleted by LiveKit
// Example: 5 * 60 = 5 minutes. Change this value if you want a different timeout.
// ============================================================================
const ROOM_EMPTY_TIMEOUT_SECONDS = 5 * 60;

export async function POST(req: NextRequest) {
  const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
  }

  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in to create a room.' }, { status: 401 });
    }

    const roomDetails: Room = await req.json();

    if (!roomDetails || !roomDetails.id || !roomDetails.name) {
      return NextResponse.json({ error: 'Invalid room details' }, { status: 400 });
    }

    // Enforce that the room owner is the authenticated user
    const fullRoomDetails: Room = {
      ...roomDetails,
      owner_id: user.id,
      ownerId: user.id,
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

    const supabaseAdmin = createAdminClient();
    // Verify room either belongs to user or insert it securely
    const { data: existingRoom } = await supabaseAdmin
      .from('rooms')
      .select('owner_id')
      .eq('id', fullRoomDetails.id)
      .maybeSingle();

    if (existingRoom && existingRoom.owner_id !== user.id) {
      return NextResponse.json({ error: 'A room with this ID already exists and belongs to another user.' }, { status: 403 });
    }

    if (!existingRoom) {
      const { error: insertError } = await supabaseAdmin.from('rooms').insert({
        id: fullRoomDetails.id,
        name: fullRoomDetails.name,
        exam_tag: fullRoomDetails.examTag,
        custom_exam_label: fullRoomDetails.customExamLabel || null,
        max_students: fullRoomDetails.maxStudents,
        max_participants: fullRoomDetails.maxParticipants,
        owner_id: user.id,
        created_at: fullRoomDetails.createdAt || new Date().toISOString(),
        welcome_message_enabled: fullRoomDetails.welcomeMessageEnabled || false,
        welcome_message_text: fullRoomDetails.welcomeMessageText || null,
        mic_disabled: false,
        camera_disabled: false,
        chat_disabled: false,
        cam_mandatory: fullRoomDetails.camMandatory || false,
        focus_mic_lock_enabled: fullRoomDetails.focusMicLockEnabled ?? true,
        focus_chat_lock_enabled: fullRoomDetails.focusChatLockEnabled ?? true,
      });

      if (insertError) {
        console.error('Failed to insert room into database:', insertError);
        return NextResponse.json({ error: 'Database error while creating room' }, { status: 500 });
      }
    }

    // Use http(s) for the server API client if the URL is ws(s)
    const serverUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');
    const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);

    await svc.createRoom({
      name: fullRoomDetails.id,
      emptyTimeout: ROOM_EMPTY_TIMEOUT_SECONDS, // Auto-delete empty room after this many seconds
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
