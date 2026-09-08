import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/supabase';
import { getLiveKitConfig } from '@/lib/livekit/tokenService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const liveKitConfig = getLiveKitConfig();

  const isHealthy = true; // Service is running and responsive

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'VocNix Real-time Audio Translation Platform',
    version: '1.0.0',
    diagnostics: {
      database: {
        configured: dbHealth.configured,
        connected: dbHealth.connected,
        status: dbHealth.message,
        storageMode: dbHealth.connected ? 'supabase-postgresql' : 'resilient-in-memory-engine',
      },
      livekit: {
        configured: liveKitConfig.isConfigured,
        serverUrl: liveKitConfig.url || 'Not configured',
        status: liveKitConfig.isConfigured
          ? 'LiveKit credentials configured and ready'
          : 'LiveKit credentials missing or using placeholders (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)',
      },
      features: {
        realTimeAudio: 'LiveKit/WebRTC Audio Engine',
        dynamicLanguageRooms: 'Enabled',
        authoritativeSessionBilling: 'Enabled',
        strictSubscriberGrants: 'Enabled',
        aiTranslation: 'Disabled (Human translation only)',
        video: 'Disabled (Audio-only platform)',
      },
    },
  });
}
