# SAHAAY Firestore Security Specification

## 1. Data Invariants
- Every `/users/{userId}` document belongs exclusively to `request.auth.uid == userId` and contains private PII/health consent fields readable only by the owner or a verified administrator.
- Every `/saved_sessions/{sessionId}` document must have `userId == request.auth.uid` on create, `explicitConsent == true`, immutable `userId` and `createdAt`, and server-enforced timestamps (`request.time`).
- Raw medical photographs are never stored in Firestore documents; only bounded text summaries (`<= 4000` chars) and consented transcripts (`<= 6000` chars) are permitted.
- `/admin_audit_logs/{logId}` is append-only for verified administrators (`isAdmin()`); updates and deletes are strictly denied.
- `/admins/{adminUid}` is read-only for the authenticated admin themselves and cannot be self-written by any client.

## 2. Dirty Dozen Adversarial Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated read of `/users/u1`**: Denied by `isSignedIn()`.
2. **Cross-user PII read**: User B attempts `get /users/userA`. Denied by `isOwner(userId) || isAdmin()`.
3. **Unverified email write**: Authenticated user with `email_verified: false` creates `/users/{uid}`. Denied by `isVerifiedUser()`.
4. **Shadow field injection on profile create**: User sends `{ ..., isAdmin: true, role: "superadmin" }`. Denied by `keys().hasOnly(...)`.
5. **Identity spoofing on session create**: User A creates `/saved_sessions/s1` with `userId: "userB"`. Denied by `data.userId == request.auth.uid`.
6. **Non-consented session write**: User creates `/saved_sessions/s1` with `explicitConsent: false`. Denied by `data.explicitConsent == true`.
7. **Denial-of-Wallet giant payload**: User sends `summary` of 50KB or `sessionId` of 500 chars. Denied by `isValidId(sessionId)` and `data.summary.size() <= 4000`.
8. **Timestamp forgery**: User creates session with client-forged `createdAt` in the past. Denied by `incoming().createdAt == request.time`.
9. **Immutable field tampering**: User updates `/saved_sessions/s1` attempting to alter `userId` or `createdAt`. Denied by `affectedKeys().hasOnly(...)` and immutability check.
10. **Blanket list scraping**: User B executes unconstrained `list /saved_sessions`. Denied by `allow list: if isAdmin() || (isSignedIn() && resource.data.userId == request.auth.uid)`.
11. **Admin self-escalation**: Regular user creates `/admins/{ownUid}`. Denied by `allow write: if false`.
12. **Audit log tampering**: Admin attempts to `update` or `delete` `/admin_audit_logs/log1`. Denied by `allow update, delete: if false`.
