<div align="center">

<img src="assets/logo.png" alt="react-native-journey-recovery logo" width="120" />

# react-native-journey-recovery

**Never make users start over.**

Checkpoint multi-step flows in React Native and Expo, then restore them safely after the app is killed, crashes, or the user walks away.

[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue.svg?style=flat-square)](https://www.npmjs.com/package/react-native-journey-recovery)
[![license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![CI](https://github.com/Imdvlpr99/react-native-journey-recovery/actions/workflows/ci.yml/badge.svg)](https://github.com/Imdvlpr99/react-native-journey-recovery/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-live-black?style=flat-square)](https://rn-journey-recovery.vercel.app/)

[Documentation](https://rn-journey-recovery.vercel.app/) · [Live playground](https://rn-journey-recovery.vercel.app/#/playground) · [API reference](docs/api-reference.md) · [Examples](examples/)

</div>

## Why

Long flows get interrupted: the OS kills the app in the background, the user leaves to fetch a one-time code, the app crashes. Persisting the whole global store is the usual workaround, but it writes far more than needed, can put secrets on disk, and restores state that no longer matches the server.

This library gives each flow (a **journey**) its own recovery record with explicit rules:

- **Named journeys** — `useJourney('checkout')` owns one record, independent of your state manager.
- **Ordered writes** — saves to a journey run one at a time; a slow write never overwrites a newer one.
- **Integrity checks** — every snapshot is checksummed; corrupted data is reported as `invalid`, never restored.
- **Expiry** — sliding (from the last save) or absolute (from the first), per app, journey or checkpoint.
- **Schema migration** — bump `version`, provide `migrate()`; old checkpoints are upgraded and re-validated on restore. Snapshots from a newer app version are rejected.
- **Field exclusion** — drop sensitive fields, including nested paths like `'payment.cardNumber'`, before anything is written.
- **User scoping** — records are namespaced per user on shared devices.
- **Pluggable storage** — AsyncStorage, MMKV, Expo SecureStore (encrypted, chunked), in-memory, or your own.
- **Encode/decode hook** — encrypt at rest or sign with an HMAC for real tamper detection.
- **Observable** — typed lifecycle events (`saved`, `save_failed`, `restored`, `migrated`, `expired`, …) and an `onError` callback, so failed background saves are never silent.

## Install

```bash
npm install react-native-journey-recovery
```

Requires `react` 18+. The library has no native code and no storage dependencies; install only the backend you use:

| Backend | Install | Adapter |
|---|---|---|
| AsyncStorage | `npm install @react-native-async-storage/async-storage` | `AsyncStorageAdapter` |
| MMKV | `npm install react-native-mmkv` | `MMKVStorageAdapter` |
| Expo SecureStore | `npx expo install expo-secure-store` | `SecureStoreAdapter` |
| In-memory | — | `MemoryStorageAdapter` |

## Quick start

**1. Wrap your app.** Create the adapter once, outside components.

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { RecoveryProvider, AsyncStorageAdapter } from 'react-native-journey-recovery';

const storage = new AsyncStorageAdapter(AsyncStorage);

export default function App() {
  return (
    <RecoveryProvider
      storage={storage}
      options={{ appState: AppState, autoSave: true, debounceMs: 400, defaultExpiry: 24 * 60 * 60 * 1000 }}
      onError={(error, journeyId) => reportError(error, { journeyId })}
    >
      <RootNavigator />
    </RecoveryProvider>
  );
}
```

**2. Save checkpoints as the user progresses.**

```tsx
const journey = useJourney<Checkout>('checkout');

const onContinue = async () => {
  await journey.checkpoint({ step: 'payment', address }, { exclude: ['cardNumber'] });
  await journey.flush(); // with auto-save: make sure it is written before navigating
  navigation.navigate('Payment');
};
```

**3. Offer to resume on the next launch.**

```tsx
const recovery = useRecovery<Checkout>('checkout');

if (recovery.status === 'checking') return <Loading />;

if (recovery.available) {
  return (
    <ResumePrompt
      savedAt={recovery.updatedAt}
      onResume={async () => resumeFrom(await recovery.restore())}
      onStartOver={recovery.discard}
    />
  );
}
```

**4. Clear it when the flow completes.**

```tsx
await api.placeOrder(cart);
await journey.clear();
```

Every status is explicit: `checking`, `idle`, `available`, `expired`, `invalid`, `completed`, `restoring`, `restored`, `failed`. See the [recovery lifecycle](https://rn-journey-recovery.vercel.app/#/docs/recovery-lifecycle).

## Schema migration

```tsx
const checkoutJourney: JourneyOptions<CheckoutV2> = {
  version: 2,
  migrate: (old, fromVersion) => (fromVersion < 2 ? { ...old, address: { line1: old.address } } : old),
  validate: isCheckoutV2, // runs on the migrated data
};

useJourney('checkout', checkoutJourney); // register before restoring
const recovery = useRecovery<CheckoutV2>('checkout');
```

## Forms

```tsx
const form = useForm<Application>();
const journey = useJourneyForm('loan-application', form, {
  exclude: ['ssn'],
  autoRestore: true, // load saved values without prompting
});
```

Works with React Hook Form or any object with `watch`, `getValues` and `reset`.

## Security notes

- Exclude secrets (card numbers, CVV, passwords, tokens) with `exclude`. Use `SecureStoreAdapter` or an encrypted MMKV instance for encryption at rest.
- The built-in checksum (FNV-1a) detects **accidental corruption**, not deliberate tampering. For tamper detection, pass a `transform` that signs and verifies with an HMAC.
- Treat restored data as untrusted input and confirm anything with business impact (payment or submission status) with your server.
- `saved`, `migrated`, `expired` and `invalid` events carry metadata only; `restored` events and diagnostics include your data.

## Testing

```tsx
import { createTestRecoveryEnvironment } from 'react-native-journey-recovery';

const env = createTestRecoveryEnvironment();
await env.seedCheckpoint('checkout', { step: 'payment' });
const { result } = renderHook(() => useRecovery('checkout'), { wrapper: env.wrapper });
```

## Examples

- [`examples/expo`](examples/expo) — Expo flight booking with SecureStore.
- [`examples/bare-react-native`](examples/bare-react-native) — bare React Native KYC flow with user scoping.
- [`examples/checkout-flow`](examples/checkout-flow) — multi-step checkout.
- [Live playground](https://rn-journey-recovery.vercel.app/#/playground) — a React Native app running in your browser; kill it, corrupt it, expire it.

## Development

```bash
npm install
npm test               # unit + integration tests
npm run typecheck
npm run build          # CommonJS + ESM + types via tsup
npm run lint:package   # publint + are-the-types-wrong
npm run bench          # throughput benchmark
npm run dev:docs       # documentation site
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) and the [changelog](CHANGELOG.md).

## License

MIT
