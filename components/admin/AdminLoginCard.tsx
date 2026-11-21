'use client';

import React from 'react';
import { HeartPulse, KeyRound } from 'lucide-react';

interface AdminLoginCardProps {
  bootstrapLoading: boolean;
  requiresFirstRunSetup: boolean;
  configuredViaEnv: boolean;
  username: string;
  password: string;
  confirmPassword: string;
  authError: string | null;
  authBusy: boolean;
  onUsernameChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
}

export function AdminLoginCard({
  bootstrapLoading,
  requiresFirstRunSetup,
  configuredViaEnv,
  username,
  password,
  confirmPassword,
  authError,
  authBusy,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onGoogleSignIn,
}: AdminLoginCardProps) {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-teal-800 uppercase">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          <span>
            {requiresFirstRunSetup
              ? 'First-Run Administrator Setup'
              : 'Administrator Authentication Required'}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-extrabold text-slate-900">
          {requiresFirstRunSetup
            ? 'Initialize "dev admin" Passcode'
            : 'Sign In to SAHAAY Admin Portal'}
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          {requiresFirstRunSetup
            ? 'No default password is ever hardcoded. Set a strong administrator password (10+ characters with uppercase, lowercase, and number) or configure SAHAAY_ADMIN_PASSCODE in Settings > Secrets.'
            : 'Enter your server-verified administrator credentials. Protected by scrypt verification, 5-attempt lockout, and HMAC-SHA256 Bearer sessions.'}
        </p>

        {bootstrapLoading ? (
          <div className="mt-5 text-xs text-slate-500">Checking server security state...</div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="admin-user" className="block text-xs font-semibold text-slate-700">
                Administrator Username
              </label>
              <input
                id="admin-user"
                type="text"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="admin-pass" className="block text-xs font-semibold text-slate-700">
                {requiresFirstRunSetup ? 'Create Strong Passcode' : 'Administrator Passcode'}
              </label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                required
                minLength={requiresFirstRunSetup ? 10 : 1}
                placeholder={
                  requiresFirstRunSetup
                    ? 'At least 10 chars (e.g., Upper + lower + digit)'
                    : 'Enter administrator passcode'
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            {requiresFirstRunSetup && (
              <div>
                <label
                  htmlFor="admin-pass-confirm"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Confirm Passcode
                </label>
                <input
                  id="admin-pass-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  required
                  minLength={10}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
                />
              </div>
            )}

            {authError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
              >
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authBusy}
              className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-60"
            >
              {authBusy
                ? 'Verifying...'
                : requiresFirstRunSetup
                  ? 'Claim "dev admin" & Open Portal'
                  : 'Sign In as Administrator'}
            </button>
          </form>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-600">
            Or sign in with your verified Google Admin account to access live Firestore records:
          </p>
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            <HeartPulse className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>Sign in with Verified Admin Google Account</span>
          </button>
          {configuredViaEnv && (
            <p className="mt-2 text-[11px] text-teal-800">
              Environment secret SAHAAY_ADMIN_PASSCODE is active on the server.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
