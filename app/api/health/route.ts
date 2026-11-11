import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/supabase';
import { getLiveKitConfig, createTranslatorToken } from '@/lib/livekit/tokenService';
import { TokenVerifier } from 'livekit-server-sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const liveKitConfig = getLiveKitConfig();

  const isLiveKitCloud = Boolean(liveKitConfig.url && liveKitConfig.url.includes('.livekit.cloud'));
  const isLocalDev = Boolean(
    liveKitConfig.apiKey === 'devkey' && liveKitConfig.apiSecret === 'secret'
  );
  const keyStartsWithAPI = Boolean(liveKitConfig.apiKey && liveKitConfig.apiKey.startsWith('API'));

  let tokenTestStatus = 'untested';
  let tokenTestError: string | null = null;

  if (liveKitConfig.isConfigured) {
    try {
      const sampleToken = await createTranslatorToken({
        roomName: 'health_check_room',
        translatorIdentity: 'health_check_user',
        translatorName: 'Health Check',
      });
      const verifier = new TokenVerifier(liveKitConfig.apiKey, liveKitConfig.apiSecret);
      await verifier.verify(sampleToken);
      tokenTestStatus = 'valid';
    } catch (err: any) {
      tokenTestStatus = 'failed';
      tokenTestError = err?.message || 'Token verification failed';
    }
  }

  let configurationAdvice: string | null = null;
  if (isLiveKitCloud && !keyStartsWithAPI) {
    configurationAdvice =
      "LiveKit Cloud URL detected, but your LIVEKIT_API_KEY does not start with 'API'. LiveKit Cloud API keys always start with 'API'. You might have pasted your Project ID (starts with 'p_') or a dev key instead of the API Key.";
  } else if (!isLiveKitCloud && keyStartsWithAPI) {
    configurationAdvice =
      'You are using LiveKit Cloud keys with a local server or Cloudflare tunnel. LiveKit Cloud keys only work with your LiveKit Cloud WebSocket URL (*.livekit.cloud).';
  } else if (tokenTestStatus === 'failed') {
    configurationAdvice = `Token generation error: ${tokenTestError}`;
  }

  const isHealthy = true;

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
        debug: (dbHealth as any).debug,
      },
      audioEngine: {
        configured: liveKitConfig.isConfigured,
        serverUrl: liveKitConfig.url || 'Not configured',
        status: liveKitConfig.isConfigured
          ? 'Real-time audio server configured and ready'
          : 'Audio server credentials missing or using placeholders',
        provider: isLiveKitCloud ? 'LiveKit Cloud' : isLocalDev ? 'Local Development' : 'Custom Server',
        tokenSelfTest: tokenTestStatus,
        configurationAdvice,
        debug: {
          apiKeyPrefix: liveKitConfig.apiKey ? liveKitConfig.apiKey.slice(0, 4) : 'none',
          apiKeyLength: liveKitConfig.apiKey ? liveKitConfig.apiKey.length : 0,
          apiSecretLength: liveKitConfig.apiSecret ? liveKitConfig.apiSecret.length : 0,
          isDevKey: liveKitConfig.apiKey === 'devkey',
          isDevSecret: liveKitConfig.apiSecret === 'secret',
          keyStartsWithAPI,
        },
      },
      features: {
        realTimeAudio: 'Real-Time Audio Engine',
        dynamicLanguageRooms: 'Enabled',
        authoritativeSessionBilling: 'Enabled',
        strictSubscriberGrants: 'Enabled',
        aiTranslation: 'Disabled (Human translation only)',
        video: 'Disabled (Audio-only platform)',
      },
    },
  });
}
