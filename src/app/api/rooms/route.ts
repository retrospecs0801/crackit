import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { Room, User } from '@/types';
import { createAdminClient } from '@/lib/supabase/server';

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
    const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);
    const livekitRooms = await svc.listRooms();

    const activeRooms: Room[] = [];
    const activeRoomsMap = new Map<string, number>();

    for (const lkRoom of livekitRooms) {
      activeRoomsMap.set(lkRoom.name, lkRoom.numParticipants);
      if (!lkRoom.metadata) continue;
      try {
        const roomData = JSON.parse(lkRoom.metadata) as Room;
        roomData.currentStudents = lkRoom.numParticipants;
        roomData.members = [];

        if (lkRoom.numParticipants > 0) {
          try {
            const participants = await svc.listParticipants(lkRoom.name);
            const members: User[] = [];
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
                } catch {}
              }

              members.push({
                id: p.identity,
                displayName,
                avatarInitials,
                avatarColor,
                avatarUrl,
              });
            }
            roomData.members = members;
          } catch (e) {
            console.warn(`Failed to list participants for room ${lkRoom.name}:`, e);
          }
        }

        activeRooms.push(roomData);
      } catch {
        console.warn(`Failed to parse metadata for room ${lkRoom.name}`);
      }
    }

    // Backup safety net cleanup: delete rows older than 5 minutes that have 0 participants in LiveKit
    try {
      const supabaseAdmin = createAdminClient();
      const { data: dbRooms } = await supabaseAdmin.from('rooms').select('id, created_at');
      if (dbRooms && dbRooms.length > 0) {
        const now = Date.now();
        const staleIds: string[] = [];
        for (const dbRoom of dbRooms) {
          const createdTime = new Date(dbRoom.created_at || 0).getTime();
          const age = now - createdTime;
          const numParticipants = activeRoomsMap.get(dbRoom.id) || 0;
          if (age > 5 * 60 * 1000 && numParticipants === 0) {
            staleIds.push(dbRoom.id);
          }
        }
        if (staleIds.length > 0) {
          await supabaseAdmin.from('rooms').delete().in('id', staleIds);
        }
      }
    } catch (e) {
      console.warn('Backup safety net cleanup warning:', e);
    }

    return NextResponse.json(activeRooms);
  } catch (error: unknown) {
    console.error('Failed to list rooms:', error);
    const message = error instanceof Error ? error.message : 'Failed to list rooms';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
