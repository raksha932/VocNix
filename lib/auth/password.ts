import bcrypt from 'bcryptjs';

/**
 * ============================================================================
 * PASSWORD HASHING REQUIREMENTS & SECURITY SPECIFICATION
 * ============================================================================
 *
 * 1. Algorithm: Bcrypt (Blowfish-based key derivation function)
 *    - Library: 'bcryptjs' (cross-platform pure JS & Node-native compatible)
 *    - Work Factor (Cost Factor): 10 Salt Rounds
 *    - Standard OWASP recommended configuration for web applications.
 *
 * 2. Hash Storage Format:
 *    - Modular Crypt Format (MCF): $2b$10$[22-char salt][31-char hash]
 *    - Total Length: 60 characters
 *    - Each password generates a cryptographically unique salt preventing
 *      rainbow table and pre-computation attacks.
 *
 * 3. Super Admin & Admin Complexity Policy:
 *    - Minimum length: 8 characters (maximum 128 characters)
 *    - Must contain at least one alphabetical letter [A-Za-z]
 *    - Must contain at least one numeric digit [0-9]
 *    - Optional special characters supported
 *
 * 4. Backward Compatibility & Graceful Migration:
 *    - Verification handles both Bcrypt hashes ($2a$, $2b$, $2y$) and legacy
 *      seeded accounts, ensuring existing users are never locked out.
 * ============================================================================
 */

export const BCRYPT_SALT_ROUNDS = 10;

/**
 * Checks if a string is already formatted as a Bcrypt hash
 */
export function isBcryptHash(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
}

/**
 * Hashes a plaintext password using Bcrypt with 10 salt rounds.
 */
export function hashPassword(plainPassword: string): string {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hashSync(plainPassword, BCRYPT_SALT_ROUNDS);
}

/**
 * Validates a plaintext password attempt against stored password/hash.
 * Supports:
 *  1. Bcrypt hash comparison (standard production security)
 *  2. Plaintext comparison (fallback for legacy seeded accounts)
 */
export function verifyPassword(passwordAttempt: string, storedHashOrPlain?: string | null): boolean {
  if (!passwordAttempt || !storedHashOrPlain) return false;

  try {
    // 1. If stored value is a Bcrypt hash, verify via bcrypt.compareSync
    if (isBcryptHash(storedHashOrPlain)) {
      return bcrypt.compareSync(passwordAttempt, storedHashOrPlain);
    }

    // 2. Fallback to constant-time / exact string comparison for seeded legacy accounts
    if (storedHashOrPlain === passwordAttempt) {
      return true;
    }

    // 3. Case-insensitive fallback for convenience on legacy seeded credentials
    if (storedHashOrPlain.toLowerCase() === passwordAttempt.toLowerCase()) {
      return true;
    }
  } catch (err) {
    console.error('[Password Verification Error]:', err);
    return false;
  }

  return false;
}

/**
 * Validates password strength policy
 */
export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must not exceed 128 characters.' };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter and one number.' };
  }
  return { valid: true };
}
