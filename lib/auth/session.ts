import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export type UserRole = 'admin' | 'super_admin';

export interface UserSession {
  userId: string;
  email: string;
  username?: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

export const SESSION_COOKIE_NAME = 'vocnix_session';
export const STATE_COOKIE_NAME = 'vocnix_oauth_state';

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'vocnix-production-jwt-hmac-secret-key-2026'
  );
}

// Universal Base64URL encoder (Edge & Node compatible)
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Universal Base64URL decoder (Edge & Node compatible)
function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Universal HMAC-SHA256 session signer
 */
export async function signSession(session: UserSession): Promise<string> {
  const enc = new TextEncoder();
  const payloadStr = JSON.stringify(session);
  const payloadBase64 = base64UrlEncode(enc.encode(payloadStr));

  const key = await getHmacKey();
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadBase64));
  const sigBase64 = base64UrlEncode(new Uint8Array(sigBuffer));

  return `${payloadBase64}.${sigBase64}`;
}

/**
 * Universal HMAC-SHA256 session verifier
 */
export async function verifySession(token: string): Promise<UserSession | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, sigBase64] = parts;
    const enc = new TextEncoder();
    const key = await getHmacKey();

    const sigBytes = base64UrlDecode(sigBase64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(payloadBase64)
    );

    if (!isValid) return null;

    const dec = new TextDecoder();
    const payloadJson = dec.decode(base64UrlDecode(payloadBase64));
    const session: UserSession = JSON.parse(payloadJson);

    if (Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Returns list of emails authorized for Super Admin
 */
export function getSuperAdminEmails(): string[] {
  const envEmails = process.env.SUPER_ADMIN_EMAILS || '';
  const parsed = envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Default authorized super admin emails
  const defaults = ['admin@vocnix.com', 'superadmin@vocnix.com', '2416098@saec.ac.in'];
  for (const d of defaults) {
    if (!parsed.includes(d)) parsed.push(d);
  }
  return parsed;
}

/**
 * Checks if an email is an authorized Super Admin
 */
export function isSuperAdminEmail(email: string): boolean {
  if (!email) return false;
  const authorized = getSuperAdminEmails();
  return authorized.includes(email.trim().toLowerCase());
}

/**
 * Retrieves the current session from Next.js cookies (server components/routes)
 */
export async function getServerSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies session from an incoming NextRequest
 */
export async function getSessionFromRequest(req: NextRequest): Promise<UserSession | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
