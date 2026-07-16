import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
  }

  try {
    const receiver = new WebhookReceiver(apiKey, apiSecret);
    const body = await req.text();
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';

    const event = await receiver.receive(body, authHeader);

    if (event.event === 'room_finished') {
      const roomName = event.room?.name;
      if (roomName) {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin.from('rooms').delete().eq('id', roomName);
        if (error) {
          console.error(`[Webhook] Failed to delete room ${roomName}:`, error.message);
        } else {
          console.log(`[Webhook] Room finished and deleted from DB: ${roomName}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error handling LiveKit webhook:', error);
    const message = error instanceof Error ? error.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
