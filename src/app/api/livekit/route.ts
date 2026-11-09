import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room') || 'general-call-room';
  const username = req.nextUrl.searchParams.get('username') || 'Anonymous Member';
  const userId = req.nextUrl.searchParams.get('userId') || `user-${Date.now()}`;

  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: username,
  });

  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();
  return NextResponse.json({ token, wsUrl, room });
}
