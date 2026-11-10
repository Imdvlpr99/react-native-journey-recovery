# Security Policy

`react-native-journey-recovery` handles the persistence and recovery of application user flows. Because this library may be used in applications dealing with financial transactions, personal identification (KYC), or sensitive profile data, security and data privacy are core architectural priorities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Model & Developer Responsibilities

### 1. Client-Side State vs. Transaction Truth
**`react-native-journey-recovery` restores client-side UI progress, NOT transaction truth.**
A saved checkout screen or confirmation form must **never** be interpreted as proof that a backend operation or payment succeeded. The host application is strictly responsible for re-validating server-owned data and checking idempotency keys against your backend API.

### 2. Never Persist Sensitive Credentials
Checkpoints are written to local on-device storage (`AsyncStorage`, `MMKV`, or custom adapters). Developers must **never** capture or persist:
- Passwords or PINs.
- Authentication tokens, session cookies, or refresh tokens.
- Unmasked payment card numbers (PAN) or CVVs.

Use the `exclude` configuration option to automatically strip sensitive keys before serialization:

```tsx
await journey.checkpoint(formValues, {
  exclude: ['password', 'confirmPassword', 'cvv', 'creditCardNumber'],
});
```

### 3. Multi-User Isolation on Shared Devices
On shared or multi-user mobile devices, checkpoints must be isolated per authenticated user identity:

```tsx
<RecoveryProvider storage={storage} options={{ userId: currentUserId }}>
```

When a user logs out, purge their scoped checkpoints immediately:

```ts
await checkpointManager.clearUserJourneys(currentUserId);
```

### 4. Integrity and Tamper Safety
Checkpoints serialized by `SnapshotSerializer` include an FNV-1a integrity checksum. If an attacker or corrupted disk alters stored data, `SnapshotValidator` detects the mismatch and rejects recovery with a `SNAPSHOT_CORRUPTED` error.

## Reporting a Vulnerability

If you discover a potential security vulnerability in `react-native-journey-recovery`:
1. Please do **NOT** open a public GitHub issue.
2. Send an email describing the vulnerability, affected versions, and a minimal reproduction to `security@imdvlpr.dev` (or open a private security advisory on GitHub).
3. We will acknowledge receipt within 48 hours and work with you on a coordinated disclosure timeline.

