export type AppMode = 'admin' | 'super_admin';

/**
 * Returns the current application mode based on environment variables or explicit setting.
 * - 'admin': Organization Administrator Application (multilingual event management, audio broadcasting, audience rooms)
 * - 'super_admin': Platform Super Admin Application (multi-tenant governance, system telemetry, subscription management)
 */
export function getAppMode(): AppMode {
  // Check environment variables (available in both server and client bundle if prefixed with NEXT_PUBLIC_)
  const mode = process.env.NEXT_PUBLIC_APP_MODE || process.env.NEXT_PUBLIC_APP_ROLE;
  if (mode === 'super_admin' || mode === 'superadmin') {
    return 'super_admin';
  }
  return 'admin';
}

export function isSuperAdminApp(): boolean {
  return getAppMode() === 'super_admin';
}

export function isAdminApp(): boolean {
  return getAppMode() === 'admin';
}
