import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomName = searchParams.get('roomName')
  const participantName = searchParams.get('participantName')
  const userId = searchParams.get('userId') || participantName
  const avatarUrl = searchParams.get('avatarUrl') || null
  const avatarColor = searchParams.get('avatarColor') || undefined
  const avatarInitials = searchParams.get('avatarInitials') || undefined

  if (!roomName || !participantName) {
    return NextResponse.json(
      { error: 'roomName and participantName are required' },
      { status: 400 }
    )
  }

  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'LiveKit credentials not configured' },
      { status: 500 }
    )
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId!,
    name: participantName,
    metadata: JSON.stringify({
      displayName: participantName,
      userId: userId!,
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
