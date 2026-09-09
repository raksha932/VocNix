import { AccessToken } from 'livekit-server-sdk';

export interface LiveKitConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
  isConfigured: boolean;
}

function cleanEnv(val: string | undefined): string {
  return (val || '').trim().replace(/^["']|["']$/g, '').trim();
}

export function getLiveKitConfig(): LiveKitConfig {
  const url = cleanEnv(process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL);
  const apiKey = cleanEnv(process.env.LIVEKIT_API_KEY);
  const apiSecret = cleanEnv(process.env.LIVEKIT_API_SECRET);

  const isConfigured = Boolean(
    url &&
    apiKey &&
    apiSecret &&
    apiKey !== 'devkey-placeholder' &&
    apiSecret !== 'secret-placeholder'
  );

  return {
    url,
    apiKey,
    apiSecret,
    isConfigured,
  };
}

export async function createTranslatorToken(params: {
  roomName: string;
  translatorIdentity: string;
  translatorName: string;
}): Promise<string> {
  const config = getLiveKitConfig();

  if (!config.isConfigured && (!config.apiKey || !config.apiSecret)) {
    throw new Error(
      'LiveKit credentials not configured. Please define LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in your environment.'
    );
  }

  const at = new AccessToken(config.apiKey, config.apiSecret, {
    identity: params.translatorIdentity,
    name: params.translatorName,
    ttl: '4h', // 4 hours translator session
  });

  at.addGrant({
    room: params.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await at.toJwt();
}

export async function createAudienceToken(params: {
  roomName: string;
  listenerIdentity: string;
}): Promise<string> {
  const config = getLiveKitConfig();

  if (!config.isConfigured && (!config.apiKey || !config.apiSecret)) {
    throw new Error(
      'LiveKit credentials not configured. Please define LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in your environment.'
    );
  }

  const at = new AccessToken(config.apiKey, config.apiSecret, {
    identity: params.listenerIdentity,
    name: `Listener-${params.listenerIdentity.slice(0, 6)}`,
    ttl: '6h',
  });

  // STRICT AUDIENCE PERMISSIONS: CANNOT PUBLISH AUDIO
  at.addGrant({
    room: params.roomName,
    roomJoin: true,
    canPublish: false,
    canSubscribe: true,
    canPublishData: false,
  });

  return await at.toJwt();
}
