import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractBearerToken, getClientIp } from '@/lib/api-helpers';
import {
  checkLoginRateLimit,
  claimFirstRunAdminPassword,
  clearLoginFailures,
  getAdminBootstrapState,
  issueAdminSessionToken,
  recordFailedLogin,
  revokeAdminSessionToken,
  verifyAdminCredential,
  verifyAdminSessionToken,
} from '@/lib/security-utils';

const AuthActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('claim'),
    username: z.string().trim().min(1).max(64),
    password: z.string().min(10).max(128),
  }),
  z.object({
    action: z.literal('login'),
    username: z.string().trim().min(1).max(64),
    password: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal('logout'),
  }),
]);

export async function GET(req: NextRequest) {
  const bootstrap = getAdminBootstrapState();
  const token = extractBearerToken(req);
  const session = verifyAdminSessionToken(token);

  return NextResponse.json({
    requiresFirstRunSetup: bootstrap.requiresFirstRunSetup,
    configuredViaEnv: bootstrap.configuredViaEnv,
    authenticated: Boolean(session),
    adminUser: session ? session.sub : null,
    expiresAt: session ? session.exp : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const body = await req.json();
    const parsed = AuthActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide valid administrator credentials.' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.action === 'logout') {
      const token = extractBearerToken(req);
      if (token) revokeAdminSessionToken(token);
      return NextResponse.json({ ok: true });
    }

    if (data.action === 'claim') {
      if (data.username.trim().toLowerCase() !== 'dev admin') {
        return NextResponse.json(
          { error: 'First-run administrator username must be "dev admin".' },
          { status: 403 }
        );
      }
      const claimResult = claimFirstRunAdminPassword(data.password);
      if (!claimResult.ok) {
        return NextResponse.json({ error: claimResult.error }, { status: 400 });
      }
      const issued = issueAdminSessionToken('dev admin');
      return NextResponse.json({
        ok: true,
        token: issued.token,
        expiresAt: issued.expiresAt,
        adminUser: 'dev admin',
      });
    }

    // Login flow with 5-attempt lockout rate limiting
    const rateKey = `admin-login:${clientIp}`;
    const limit = checkLoginRateLimit(rateKey);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed sign-in attempts. Please wait ${limit.retryAfterSec ?? 600} seconds before retrying.`,
        },
        { status: 429 }
      );
    }

    const bootstrap = getAdminBootstrapState();
    if (bootstrap.requiresFirstRunSetup) {
      return NextResponse.json(
        { error: 'Administrator password has not been claimed yet. Complete first-run setup first.' },
        { status: 409 }
      );
    }

    const ok = verifyAdminCredential(data.username, data.password);
    if (!ok) {
      const failState = recordFailedLogin(rateKey);
      return NextResponse.json(
        {
          error: failState.locked
            ? 'Account temporarily locked for 10 minutes due to repeated failed attempts.'
            : `Invalid administrator credentials. ${failState.attemptsRemaining} attempt(s) remaining.`,
        },
        { status: 401 }
      );
    }

    clearLoginFailures(rateKey);
    const issued = issueAdminSessionToken('dev admin');
    return NextResponse.json({
      ok: true,
      token: issued.token,
      expiresAt: issued.expiresAt,
      adminUser: 'dev admin',
    });
  } catch {
    return NextResponse.json({ error: 'Authentication request could not be processed.' }, { status: 400 });
  }
}
