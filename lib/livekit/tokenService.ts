import { AccessToken } from 'livekit-server-sdk';

export interface LiveKitConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
  isConfigured: boolean;
}

function cleanEnv(val: string | undefined): string {
  let cleaned = (val || '').trim().replace(/^["']|["']$/g, '').trim();
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

function isPlaceholder(val: string): boolean {
  if (!val) return true;
  const lower = val.toLowerCase();
  return (
    val.includes('•') ||
    lower.includes('your-project') ||
    lower.includes('your-audio-server') ||
    lower.includes('your-api-key') ||
    lower.includes('your-api-secret') ||
    lower.includes('placeholder') ||
    lower.includes('apixxxxx') ||
    lower.includes('secretxxxxx') ||
    lower.includes('example.com') ||
    lower.endsWith('...')
  );
}

export function getLiveKitConfig(): LiveKitConfig {
  let url = cleanEnv(process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL);
  const apiKey = cleanEnv(process.env.LIVEKIT_API_KEY);
  const apiSecret = cleanEnv(process.env.LIVEKIT_API_SECRET);

  if (url && !url.startsWith('ws://') && !url.startsWith('wss://') && !url.includes('•')) {
    url = `wss://${url.replace(/^https?:\/\//, '')}`;
  }
  url = url.replace(/\/+$/, '');

  const isConfigured = Boolean(
    url &&
    apiKey &&
    apiSecret &&
    !isPlaceholder(url) &&
    !isPlaceholder(apiKey) &&
    !isPlaceholder(apiSecret) &&
    !url.includes('•') &&
    !apiSecret.includes('•') &&
    (url.startsWith('ws://') || url.startsWith('wss://'))
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

  if (config.apiSecret && config.apiSecret.includes('•')) {
    throw new Error(
      'LIVEKIT_API_SECRET contains masked bullet characters (••••••••). You must copy the actual plaintext secret from LiveKit Cloud. If masked, generate a new key on cloud.livekit.io and copy the revealed secret.'
    );
  }

  if (!config.isConfigured) {
    throw new Error(
      'LiveKit audio server is not properly configured. Please enter real LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET from your LiveKit Cloud dashboard (not placeholders like your-project.livekit.cloud).'
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

  if (config.apiSecret && config.apiSecret.includes('•')) {
    throw new Error(
      'LIVEKIT_API_SECRET contains masked bullet characters (••••••••). You must copy the actual plaintext secret from LiveKit Cloud. If masked, generate a new key on cloud.livekit.io and copy the revealed secret.'
    );
  }

  if (!config.isConfigured) {
    throw new Error(
      'LiveKit audio server is not properly configured. Please enter real LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET from your LiveKit Cloud dashboard (not placeholders like your-project.livekit.cloud).'
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
