import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { Room, User, ExamTag } from '@/types';
import { createAdminClient } from '@/lib/supabase/server';

// ============================================================================
// CONFIGURATION: Set the time (in milliseconds) before an empty room is deleted
// Example: 5 * 60 * 1000 = 5 minutes. Change this value if you want a different timeout.
// Note: Keep this in sync with ROOM_EMPTY_TIMEOUT_SECONDS in src/app/api/rooms/create/route.ts
// ============================================================================
const ROOM_EMPTY_TIMEOUT_MS = 5 * 60 * 1000;

export const dynamic = 'force-dynamic';

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

    const activeRoomsMap = new Map<string, { numParticipants: number; metadata?: string }>();
    for (const lkRoom of livekitRooms) {
      activeRoomsMap.set(lkRoom.name, { numParticipants: lkRoom.numParticipants, metadata: lkRoom.metadata });
    }

    const activeRooms: Room[] = [];
    const now = Date.now();
    const staleIds: string[] = [];

    for (const dbRoom of (dbRooms || [])) {
      const lkData = activeRoomsMap.get(dbRoom.id);
      const numParticipants = lkData?.numParticipants || 0;
      const createdTime = new Date(dbRoom.created_at || 0).getTime();
      const ageMs = now - createdTime;

      // Check when the room last became empty or active
      let lastEmptyAt: string | null = dbRoom.last_empty_at ?? null;

      if (numParticipants > 0) {
        console.log(`[Room Active Check] Room ID: "${dbRoom.id}", Participants: ${numParticipants}`);
        // Room is currently occupied. If last_empty_at is set, reset/clear it in DB.
        if (lastEmptyAt !== null) {
          lastEmptyAt = null;
          supabaseAdmin.from('rooms').update({ last_empty_at: null }).eq('id', dbRoom.id).then();
        }
      } else {
        // Room currently has 0 participants.
        if (lastEmptyAt === null) {
          // Room just became empty! Start the empty countdown from right now.
          lastEmptyAt = new Date().toISOString();
          supabaseAdmin.from('rooms').update({ last_empty_at: lastEmptyAt }).eq('id', dbRoom.id).then();
          console.log(`[Room Cleanup Check] Room ID: "${dbRoom.id}" just became empty. Started countdown from now.`);
        } else {
          // Room was already empty. Check how long it has been continuously empty.
          const emptyDurationMs = now - new Date(lastEmptyAt).getTime();
          console.log(`[Room Cleanup Check] Room ID: "${dbRoom.id}", Empty Duration: ${(emptyDurationMs / 60000).toFixed(2)} min, LiveKit Participants: 0`);

          // If the room has been continuously empty for longer than ROOM_EMPTY_TIMEOUT_MS, delete it.
          if (emptyDurationMs > ROOM_EMPTY_TIMEOUT_MS) {
            console.log(`[Room Cleanup Action] Deleting empty room that has been empty > ${(ROOM_EMPTY_TIMEOUT_MS / 60000).toFixed(1)} min: "${dbRoom.id}"`);
            staleIds.push(dbRoom.id);
            // Also explicitly delete room from LiveKit if it's still open on LiveKit server
            try {
              await svc.deleteRoom(dbRoom.id);
            } catch (lkDelErr) {
              // Room might already be closed/finished on LiveKit side
            }
            continue;
          }
        }
      }

      let parsedMeta: Record<string, unknown> | undefined = undefined;
      if (lkData?.metadata) {
        try {
          parsedMeta = JSON.parse(lkData.metadata);
        } catch {}
      }

      const members: User[] = [];
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
        customExamLabel: dbRoom.custom_exam_label ? String(dbRoom.custom_exam_label) : (parsedMeta?.customExamLabel ? String(parsedMeta.customExamLabel) : undefined),
        examType: (dbRoom.exam_tag === 'custom' || dbRoom.exam_tag === 'Custom') ? 'custom' : undefined,
        topic: dbRoom.topic || '',
        description: dbRoom.description || '',
        maxStudents: Number(dbRoom.max_students || 6),
        maxParticipants: dbRoom.max_participants ? Number(dbRoom.max_participants) : (parsedMeta?.maxParticipants ? Number(parsedMeta.maxParticipants) : Number(dbRoom.max_students || 6)),
        camMandatory: Boolean(dbRoom.cam_mandatory ?? parsedMeta?.camMandatory ?? false),
        currentStudents: numParticipants,
        members,
        owner_id: dbRoom.owner_id || '',
        ownerId: dbRoom.owner_id || '',
        owner: parsedMeta?.owner ? String(parsedMeta.owner) : undefined,
        co_owners: Array.isArray(dbRoom.co_owners) ? dbRoom.co_owners : [],
        coOwners: Array.isArray(dbRoom.co_owners) ? dbRoom.co_owners : (Array.isArray(parsedMeta?.coOwners) ? (parsedMeta.coOwners as string[]) : []),
        createdAt: dbRoom.created_at || new Date().toISOString(),
        welcomeMessageEnabled: dbRoom.welcome_message_enabled,
        welcomeMessageText: dbRoom.welcome_message_text || '',
        micDisabled: dbRoom.mic_disabled,
        cameraDisabled: dbRoom.camera_disabled,
        chatDisabled: dbRoom.chat_disabled,
        focusMicLockEnabled: Boolean(dbRoom.focus_mic_lock_enabled ?? parsedMeta?.focusMicLockEnabled ?? true),
        focusChatLockEnabled: Boolean(dbRoom.focus_chat_lock_enabled ?? parsedMeta?.focusChatLockEnabled ?? true),
        lastEmptyAt,
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
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    console.error('[Room API Error] Fatal error in GET /api/rooms:', error);
    const message = error instanceof Error ? error.message : 'Failed to list rooms';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

