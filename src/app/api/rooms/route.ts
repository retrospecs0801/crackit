import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { Room, User, ExamTag } from '@/types';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
  }

  const serverUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://');

  try {
    const supabaseAdmin = createAdminClient();
    const { data: dbRooms, error: dbError } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('[Room API Error] Failed to fetch rooms from Supabase:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);
    let livekitRooms: Awaited<ReturnType<typeof svc.listRooms>> = [];
    try {
      livekitRooms = await svc.listRooms();
    } catch (lkError: unknown) {
      console.error('[Room API Error] Failed to list LiveKit rooms:', lkError);
    }

    const activeRoomsMap = new Map<string, number>();
    for (const lkRoom of livekitRooms) {
      activeRoomsMap.set(lkRoom.name, lkRoom.numParticipants);
    }

    const activeRooms: Room[] = [];
    const now = Date.now();
    const staleIds: string[] = [];

    for (const dbRoom of (dbRooms || [])) {
      const numParticipants = activeRoomsMap.get(dbRoom.id) || 0;
      const createdTime = new Date(dbRoom.created_at || 0).getTime();
      const ageMs = now - createdTime;

      console.log(`[Room Cleanup Check] Room ID: "${dbRoom.id}", Age: ${(ageMs / 60000).toFixed(2)} min, LiveKit Participants: ${numParticipants}`);

      // Backup safety net cleanup: delete rows older than 5 minutes that have 0 participants
      if (ageMs > 5 * 60 * 1000 && numParticipants === 0) {
        console.log(`[Room Cleanup Action] Deleting empty room older than 5 min: "${dbRoom.id}"`);
        staleIds.push(dbRoom.id);
        continue;
      }

      let members: User[] = [];
      if (numParticipants > 0) {
        try {
          const participants = await svc.listParticipants(dbRoom.id);
          for (const p of participants) {
            let displayName = p.name || p.identity;
            let avatarUrl: string | null = null;
            let avatarColor: string = '#5C7A5A';
            let avatarInitials: string = displayName.substring(0, 2).toUpperCase();

            if (p.metadata) {
              try {
                const meta = JSON.parse(p.metadata);
                if (meta.displayName) displayName = meta.displayName;
                if (meta.avatarUrl) avatarUrl = meta.avatarUrl;
                if (meta.avatarColor) avatarColor = meta.avatarColor;
                if (meta.avatarInitials) avatarInitials = meta.avatarInitials;
              } catch (parseErr) {
                console.warn(`[Room API Error] Failed to parse participant metadata in room "${dbRoom.id}" for identity "${p.identity}":`, parseErr);
              }
            }

            members.push({
              id: p.identity,
              displayName,
              avatarInitials,
              avatarColor,
              avatarUrl,
            });
          }
        } catch (participantsErr) {
          console.error(`[Room API Error] Failed to list participants for room "${dbRoom.id}":`, participantsErr);
        }
      }

      const roomObj: Room = {
        id: dbRoom.id,
        name: dbRoom.name,
        examTag: dbRoom.exam_tag as ExamTag,
        topic: dbRoom.topic || '',
        description: dbRoom.description || '',
        maxStudents: dbRoom.max_students || 6,
        currentStudents: numParticipants,
        members,
        owner_id: dbRoom.owner_id || '',
        ownerId: dbRoom.owner_id || '',
        createdAt: dbRoom.created_at || new Date().toISOString(),
        welcomeMessageEnabled: dbRoom.welcome_message_enabled,
        welcomeMessageText: dbRoom.welcome_message_text || '',
        micDisabled: dbRoom.mic_disabled,
        cameraDisabled: dbRoom.camera_disabled,
        chatDisabled: dbRoom.chat_disabled,
      };

      activeRooms.push(roomObj);
    }

    if (staleIds.length > 0) {
      try {
        const { error: deleteError } = await supabaseAdmin.from('rooms').delete().in('id', staleIds);
        if (deleteError) {
          console.error('[Room Cleanup Error] Supabase delete failed for stale rooms:', deleteError);
        } else {
          console.log(`[Room Cleanup Action] Successfully deleted ${staleIds.length} stale rooms from Supabase:`, staleIds);
        }
      } catch (e) {
        console.error('[Room Cleanup Error] Exception during safety net cleanup:', e);
      }
    }

    return NextResponse.json(activeRooms, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: unknown) {
    console.error('[Room API Error] Fatal error in GET /api/rooms:', error);
    const message = error instanceof Error ? error.message : 'Failed to list rooms';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

