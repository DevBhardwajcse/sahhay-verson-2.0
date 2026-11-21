import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  isStrongAdminPassword,
  claimFirstRunAdminPassword,
  verifyAdminCredential,
  checkLoginRateLimit,
  recordFailedLogin,
  issueAdminSessionToken,
  verifyAdminSessionToken,
  revokeAdminSessionToken,
  validateUploadedImage,
  __resetSecurityMemoryForTests,
} from './security-utils';

test('scrypt password hashing verifies matching password and rejects wrong password', () => {
  const hash = hashPassword('SahaayStrong!2026');
  assert.ok(hash.startsWith('scrypt$'));
  assert.equal(verifyPassword('SahaayStrong!2026', hash), true);
  assert.equal(verifyPassword('WrongPassword123', hash), false);
});

test('first-run admin claim enforces password strength and locks after claim', () => {
  __resetSecurityMemoryForTests();
  assert.equal(isStrongAdminPassword('weak').valid, false);
  const weakAttempt = claimFirstRunAdminPassword('short1A');
  assert.equal(weakAttempt.ok, false);

  const claim = claimFirstRunAdminPassword('SahaayAdmin2026!');
  assert.equal(claim.ok, true);

  const secondClaim = claimFirstRunAdminPassword('AnotherStrong2026!');
  assert.equal(secondClaim.ok, false);

  assert.equal(verifyAdminCredential('dev admin', 'SahaayAdmin2026!'), true);
  assert.equal(verifyAdminCredential('dev admin', 'BadPass2026!'), false);
  assert.equal(verifyAdminCredential('other user', 'SahaayAdmin2026!'), false);
});

test('login rate limiter locks out after 5 consecutive failures', () => {
  __resetSecurityMemoryForTests();
  const key = 'test-ip-admin';
  for (let i = 0; i < 4; i++) {
    const res = recordFailedLogin(key);
    assert.equal(res.locked, false);
  }
  const fifth = recordFailedLogin(key);
  assert.equal(fifth.locked, true);
  const check = checkLoginRateLimit(key);
  assert.equal(check.allowed, false);
  assert.ok((check.retryAfterSec ?? 0) > 0);
});

test('HMAC session token verifies valid token, rejects tampered token, and honors revocation', () => {
  __resetSecurityMemoryForTests();
  const { token } = issueAdminSessionToken('dev admin');
  const verified = verifyAdminSessionToken(token);
  assert.equal(verified?.sub, 'dev admin');
  assert.equal(verified?.role, 'admin');

  const tampered = token.slice(0, -3) + 'XYZ';
  assert.equal(verifyAdminSessionToken(tampered), null);

  revokeAdminSessionToken(token);
  assert.equal(verifyAdminSessionToken(token), null);
});

test('image upload validator rejects unsupported MIME types and oversized payloads', () => {
  const badMime = validateUploadedImage({
    mimeType: 'application/pdf',
    base64Data: 'a'.repeat(500),
  });
  assert.equal(badMime.valid, false);

  const tiny = validateUploadedImage({
    mimeType: 'image/jpeg',
    base64Data: 'abc',
  });
  assert.equal(tiny.valid, false);

  const valid = validateUploadedImage({
    mimeType: 'image/png',
    base64Data: 'A'.repeat(2000),
  });
  assert.equal(valid.valid, true);
});
