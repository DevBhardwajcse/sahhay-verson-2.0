import type { NextRequest } from 'next/server';

/**
 * Extracts a normalized client identifier from reverse-proxy headers for rate-limiting.
 */
export function getClientIp(req: Pick<NextRequest, 'headers'>): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'local';
}

/**
 * Extracts a Bearer token from an Authorization header if present and non-empty.
 */
export function extractBearerToken(req: Pick<NextRequest, 'headers'>): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token ? token : null;
}

/**
 * Normalizes and truncates untrusted text snippets safely for storage or audit display.
 */
export function sanitizeTextSnippet(input: string, maxLength: number): string {
  const normalized = input.replace(/\s+/g, ' ').trim();
  if (maxLength <= 0) return '';
  return normalized.slice(0, maxLength);
}
