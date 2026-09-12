import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnv(key: string): string {
  const raw = process.env[key] || '';
  return raw.trim().replace(/^["']|["']$/g, '').trim();
}

function cleanSupabaseUrl(rawUrl: string): string {
  let u = (rawUrl || '').trim().replace(/^["']|["']$/g, '').trim();
  // Strip any accidental sub-paths like /rest/v1, /rest, or trailing slashes
  u = u.replace(/\/rest(\/v1)?\/?$/i, '');
  u = u.replace(/\/+$/, '');
  return u;
}

function getSupabaseUrl(): string {
  return cleanSupabaseUrl(getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL'));
}

function getSupabaseAnonKey(): string {
  return getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');
}

function getSupabaseServiceKey(): string {
  return getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
}

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const serviceKey = getSupabaseServiceKey();
  return Boolean(
    url &&
    url !== 'https://your-project.supabase.co' &&
    ((anonKey && anonKey !== 'your-anon-key') || (serviceKey && serviceKey !== 'your-service-role-key'))
  );
};

export const hasSupabaseAdminConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  return Boolean(
    url &&
    url !== 'https://your-project.supabase.co' &&
    serviceKey &&
    serviceKey !== 'your-service-role-key'
  );
};

let clientInstance: SupabaseClient | null = null;
let adminInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey() || getSupabaseServiceKey();
  if (!clientInstance) {
    clientInstance = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return clientInstance;
};

export const getSupabaseAdmin = (): SupabaseClient | null => {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

  if (!url || url === 'https://your-project.supabase.co' || !serviceKey || serviceKey === 'your-service-role-key') {
    if (isSupabaseConfigured() && !serviceKey) {
      console.warn('[Supabase] Warning: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL is set, but SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations bypassing RLS will fail.');
    }
    return null;
  }

  if (!adminInstance) {
    adminInstance = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminInstance;
};

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  configured: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      configured: false,
      message: 'Supabase credentials not configured in environment (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)',
    };
  }

  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return {
        connected: false,
        configured: true,
        message: 'Supabase service role key missing; read-only mode available',
      };
    }
    const { error } = await admin.from('organizations').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        configured: true,
        message: `Database query failed: ${error.message}. Ensure migrations have been applied.`,
      };
    }
    return {
      connected: true,
      configured: true,
      message: 'Connected to Supabase PostgreSQL database',
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      message: `Database connection error: ${err?.message || 'Unknown error'}`,
    };
  }
}
