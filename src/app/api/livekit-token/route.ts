import { NextRequest, NextResponse } from 'next/server'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomName = searchParams.get('roomName')
  const requestedUserId = searchParams.get('userId') || searchParams.get('participantName')

  if (!roomName) {
    return NextResponse.json(
      { error: 'roomName is required' },
      { status: 400 }
    )
  }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in to join study rooms.' },
      { status: 401 }
    )
  }

  // Prevent identity spoofing
  if (requestedUserId && requestedUserId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden. You cannot join a room as another user.' },
      { status: 403 }
    )
  }

  const userId = user.id
  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  const participantName = profile?.display_name || user.user_metadata?.full_name || searchParams.get('participantName') || 'Student'
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || searchParams.get('avatarUrl') || null
  const avatarColor = profile?.avatar_color || searchParams.get('avatarColor') || '#5C7A5A'
  const avatarInitials = profile?.avatar_initials || participantName.substring(0, 2).toUpperCase()

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'LiveKit credentials not configured' },
      { status: 500 }
    )
  }

  if (livekitUrl) {
    try {
      const serverUrl = livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://')
      const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret)
      const rooms = await svc.listRooms([roomName])
      if (rooms && rooms.length > 0) {
        const roomInfo = rooms[0]
        let maxCap = roomInfo.maxParticipants || 6
        if (roomInfo.metadata) {
          try {
            const meta = JSON.parse(roomInfo.metadata)
            if (meta.maxParticipants) maxCap = Number(meta.maxParticipants)
            else if (meta.maxStudents) maxCap = Number(meta.maxStudents)
          } catch {}
        }
        if (maxCap < 20 && roomInfo.numParticipants >= maxCap) {
          return NextResponse.json(
            { error: 'Room is full' },
            { status: 403 }
          )
        }
      }
    } catch (err) {
      console.warn('Could not verify room capacity via LiveKit before issuing token:', err)
    }
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: participantName,
    metadata: JSON.stringify({
      displayName: participantName,
      userId: userId,
      avatarUrl,
      avatarColor,
      avatarInitials,
    }),
    ttl: '10h',
  })

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  const jwt = await token.toJwt()

  return NextResponse.json({ token: jwt })
}
