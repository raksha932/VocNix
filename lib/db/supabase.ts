import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your-anon-key'
  );
};

let clientInstance: SupabaseClient | null = null;
let adminInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
};

export const getSupabaseAdmin = (): SupabaseClient | null => {
  if (!isSupabaseConfigured() || !supabaseServiceRoleKey || supabaseServiceRoleKey === 'your-service-role-key') {
    return null;
  }
  if (!adminInstance) {
    adminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
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
