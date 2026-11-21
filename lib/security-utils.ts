import crypto from 'node:crypto';

const SCRYPT_KEYLEN = 64;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// In-memory session signing key fallback if env var not provided (never committed or written to disk)
const globalForSec = globalThis as unknown as {
  __sahaaySessionSecret?: string;
  __sahaayAdminClaimHash?: string | null;
  __sahaayLoginAttempts?: Record<string, { count: number; lockedUntil: number }>;
  __sahaayRevokedTokens?: Record<string, number>;
  __sahaayRateBuckets?: Record<string, { count: number; resetAt: number }>;
};

function getSessionSecret(): string {
  if (process.env.SAHAAY_SESSION_SECRET && process.env.SAHAAY_SESSION_SECRET.length >= 24) {
    return process.env.SAHAAY_SESSION_SECRET;
  }
  if (!globalForSec.__sahaaySessionSecret) {
    globalForSec.__sahaaySessionSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalForSec.__sahaaySessionSecret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hexHash] = parts;
  if (!salt || !hexHash) return false;
  try {
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    const expected = Buffer.from(hexHash, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function isStrongAdminPassword(password: string): { valid: boolean; reason?: string } {
  if (typeof password !== 'string' || password.length < 10) {
    return { valid: false, reason: 'Password must be at least 10 characters long.' };
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      reason: 'Password must include uppercase, lowercase, and at least one number.',
    };
  }
  return { valid: true };
}

export function getAdminBootstrapState(): {
  configuredViaEnv: boolean;
  claimedInMemory: boolean;
  requiresFirstRunSetup: boolean;
} {
  const configuredViaEnv = Boolean(
    process.env.SAHAAY_ADMIN_PASSCODE && process.env.SAHAAY_ADMIN_PASSCODE.trim().length > 0
  );
  const claimedInMemory = Boolean(globalForSec.__sahaayAdminClaimHash);
  return {
    configuredViaEnv,
    claimedInMemory,
    requiresFirstRunSetup: !configuredViaEnv && !claimedInMemory,
  };
}

export function claimFirstRunAdminPassword(password: string): { ok: boolean; error?: string } {
  const state = getAdminBootstrapState();
  if (!state.requiresFirstRunSetup) {
    return { ok: false, error: 'Administrator credentials are already initialized.' };
  }
  const check = isStrongAdminPassword(password);
  if (!check.valid) {
    return { ok: false, error: check.reason };
  }
  globalForSec.__sahaayAdminClaimHash = hashPassword(password);
  return { ok: true };
}

export function verifyAdminCredential(username: string, password: string): boolean {
  const normalizedUser = username.trim().toLowerCase();
  if (normalizedUser !== 'dev admin') return false;

  const envPass = process.env.SAHAAY_ADMIN_PASSCODE?.trim();
  if (envPass && envPass.length > 0) {
    const a = Buffer.from(password, 'utf8');
    const b = Buffer.from(envPass, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  if (globalForSec.__sahaayAdminClaimHash) {
    return verifyPassword(password, globalForSec.__sahaayAdminClaimHash);
  }
  return false;
}

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  if (!globalForSec.__sahaayLoginAttempts) {
    globalForSec.__sahaayLoginAttempts = {};
  }
  const now = Date.now();
  const entry = globalForSec.__sahaayLoginAttempts[key];
  if (entry && entry.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }
  return { allowed: true };
}

export function recordFailedLogin(key: string): { locked: boolean; attemptsRemaining: number } {
  if (!globalForSec.__sahaayLoginAttempts) {
    globalForSec.__sahaayLoginAttempts = {};
  }
  const now = Date.now();
  const current = globalForSec.__sahaayLoginAttempts[key];
  const nextCount = current && current.lockedUntil <= now ? current.count + 1 : (current?.count ?? 0) + 1;
  if (nextCount >= MAX_FAILED_ATTEMPTS) {
    globalForSec.__sahaayLoginAttempts[key] = {
      count: nextCount,
      lockedUntil: now + LOCKOUT_MS,
    };
    return { locked: true, attemptsRemaining: 0 };
  }
  globalForSec.__sahaayLoginAttempts[key] = {
    count: nextCount,
    lockedUntil: 0,
  };
  return { locked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS - nextCount };
}

export function clearLoginFailures(key: string): void {
  if (globalForSec.__sahaayLoginAttempts) {
    delete globalForSec.__sahaayLoginAttempts[key];
  }
}

export interface AdminSessionPayload {
  sub: string;
  role: 'admin';
  jti: string;
  iat: number;
  exp: number;
}

export function issueAdminSessionToken(username: string): { token: string; expiresAt: number } {
  const now = Date.now();
  const payload: AdminSessionPayload = {
    sub: username,
    role: 'admin',
    jti: crypto.randomBytes(16).toString('hex'),
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(body)
    .digest('base64url');
  return { token: `${body}.${sig}`, expiresAt: payload.exp };
}

export function verifyAdminSessionToken(token: string | null | undefined): AdminSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(body)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AdminSessionPayload;
    if (parsed.role !== 'admin' || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    if (globalForSec.__sahaayRevokedTokens?.[parsed.jti]) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function revokeAdminSessionToken(token: string): void {
  const verified = verifyAdminSessionToken(token);
  if (!verified) return;
  if (!globalForSec.__sahaayRevokedTokens) {
    globalForSec.__sahaayRevokedTokens = {};
  }
  globalForSec.__sahaayRevokedTokens[verified.jti] = verified.exp;
}

export function checkApiRateLimit(
  bucketKey: string,
  maxRequests: number,
  windowMs: number
): boolean {
  if (!globalForSec.__sahaayRateBuckets) {
    globalForSec.__sahaayRateBuckets = {};
  }
  const now = Date.now();
  const entry = globalForSec.__sahaayRateBuckets[bucketKey];
  if (!entry || entry.resetAt <= now) {
    globalForSec.__sahaayRateBuckets[bucketKey] = { count: 1, resetAt: now + windowMs };
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

export const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB

export function validateUploadedImage(params: {
  mimeType: string;
  base64Data: string;
}): { valid: boolean; error?: string; byteLength?: number } {
  if (!ALLOWED_IMAGE_MIMES.has(params.mimeType)) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload a JPEG, PNG, or WebP photograph.',
    };
  }
  if (!params.base64Data || typeof params.base64Data !== 'string') {
    return { valid: false, error: 'Image payload is empty or unreadable.' };
  }
  const cleaned = params.base64Data.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  const byteLength = Math.floor((cleaned.length * 3) / 4);
  if (byteLength < 100) {
    return { valid: false, error: 'Image appears empty or corrupted.' };
  }
  if (byteLength > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: 'Image exceeds the 6 MB safety limit. Please select a smaller photograph.',
    };
  }
  return { valid: true, byteLength };
}

/**
 * Reset helper strictly for unit tests.
 */
export function __resetSecurityMemoryForTests(): void {
  globalForSec.__sahaayAdminClaimHash = null;
  globalForSec.__sahaayLoginAttempts = {};
  globalForSec.__sahaayRevokedTokens = {};
  globalForSec.__sahaayRateBuckets = {};
}
