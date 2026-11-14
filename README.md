<div align="center">

<img src="https://raw.githubusercontent.com/Imdvlpr99/react-native-journey-recovery/master/assets/logo.png" alt="" width="96" height="96" />

# react-native-journey-recovery

**Never make users start over.**

Checkpoint multi-step flows in React Native and Expo, and restore them safely after the app is killed, crashes, or the user walks away.

[![npm version](https://img.shields.io/npm/v/react-native-journey-recovery?style=flat-square&color=16a34a)](https://www.npmjs.com/package/react-native-journey-recovery)
[![npm downloads](https://img.shields.io/npm/dm/react-native-journey-recovery?style=flat-square)](https://www.npmjs.com/package/react-native-journey-recovery)
[![types](https://img.shields.io/npm/types/react-native-journey-recovery?style=flat-square)](https://rn-journey-recovery.vercel.app/docs/types)
[![license](https://img.shields.io/npm/l/react-native-journey-recovery?style=flat-square)](https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/Imdvlpr99/react-native-journey-recovery/ci.yml?branch=master&style=flat-square&label=CI)](https://github.com/Imdvlpr99/react-native-journey-recovery/actions/workflows/ci.yml)

[Documentation](https://rn-journey-recovery.vercel.app) · [Live playground](https://rn-journey-recovery.vercel.app/playground) · [API reference](https://rn-journey-recovery.vercel.app/docs/recovery-provider) · [Changelog](https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/CHANGELOG.md)

</div>

---

Long flows get interrupted. The OS kills your app in the background, the user switches away to copy a one-time code, the app crashes on step four of five. Persisting your whole store is the usual workaround, but it writes far more than you need, can leave secrets on disk, and restores state that no longer matches the server.

`react-native-journey-recovery` gives each flow, a **journey**, its own small recovery record with explicit rules for when it is safe to restore.

> **Try it without installing anything:** the [live playground](https://rn-journey-recovery.vercel.app/playground) runs a real React Native app in your browser. Fill in a step, kill the app, corrupt the storage, expire it, and watch what the library does.

## Features

| | |
|---|---|
| **Named journeys** | `useJourney('checkout')` owns one record, independent of your state manager. |
| **Ordered writes** | Saves to a journey run one at a time, so a slow write never overwrites a newer one. |
| **Integrity checks** | Every snapshot is checksummed. Corrupted data is reported as `invalid`, never restored. |
| **Expiry** | Sliding (from the last save) or absolute (from the first), per app, journey or checkpoint. |
| **Schema migration** | Bump `version`, add `migrate()`. Old checkpoints are upgraded and re-validated on restore; newer ones are rejected. |
| **Field exclusion** | Drop secrets before anything is written, including nested paths like `'payment.cardNumber'`. |
| **Pluggable storage** | AsyncStorage, MMKV, Expo SecureStore (encrypted, chunked), in-memory, or your own adapter. |
| **Encryption and signing** | An optional `transform` hook to encrypt at rest or sign with an HMAC. |
| **User scoping** | Records are namespaced per user on shared devices. |
| **Observable** | Typed lifecycle events and an `onError` callback, so a failed background save is never silent. |
| **Small and typed** | No native code, no storage dependencies, TypeScript types, CommonJS and ESM builds. |

## Installation

```bash
npm install react-native-journey-recovery
# or
yarn add react-native-journey-recovery
# or
npx expo install react-native-journey-recovery
```

Requires React 18 or later. Install the storage backend you want to use:

| Backend | Install | Adapter |
|---|---|---|
| AsyncStorage | `npm install @react-native-async-storage/async-storage` | `AsyncStorageAdapter` |
| MMKV | `npm install react-native-mmkv` | `MMKVStorageAdapter` |
| Expo SecureStore | `npx expo install expo-secure-store` | `SecureStoreAdapter` |
| In-memory (tests) | none | `MemoryStorageAdapter` |

## Quick start

### 1. Wrap your app

Create the storage adapter once, outside your components.

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { RecoveryProvider, AsyncStorageAdapter } from 'react-native-journey-recovery';

const storage = new AsyncStorageAdapter(AsyncStorage);

export default function App() {
  return (
    <RecoveryProvider
      storage={storage}
      options={{
        appState: AppState,                 // write pending saves when the app backgrounds
        autoSave: true,
        debounceMs: 400,
        defaultExpiry: 24 * 60 * 60 * 1000, // 24 hours
      }}
      onError={(error, journeyId) => reportError(error, { journeyId })}
    >
      <RootNavigator />
    </RecoveryProvider>
  );
}
```

### 2. Save checkpoints as the user progresses

```tsx
import { useJourney } from 'react-native-journey-recovery';

function ShippingScreen({ navigation }) {
  const journey = useJourney<Checkout>('checkout');

  const onContinue = async () => {
    journey.checkpoint({ step: 'payment', address }, { exclude: ['cardNumber'] });
    await journey.flush(); // with auto-save: make sure it is written before moving on
    navigation.navigate('Payment');
  };
  // ...
}
```

### 3. Offer to resume on the next launch

```tsx
import { useRecovery } from 'react-native-journey-recovery';

function CheckoutEntry() {
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

  return <ShippingScreen />;
}
```

### 4. Clear it when the flow completes

```tsx
await api.placeOrder(cart);
await journey.clear();
```

Every outcome is an explicit status your UI can handle:

| Status | Meaning |
|---|---|
| `checking` | Reading storage (initial). |
| `idle` | Nothing saved. |
| `available` | A valid checkpoint can be restored. |
| `expired` | Saved, but past its expiry. |
| `invalid` | Corrupted, failed validation, or saved by a newer app version. |
| `completed` | The journey finished; not offered for resume. |
| `restoring` / `restored` | Restore in progress / done. |
| `failed` | A save, read or restore failed; see `error`. |

## Recipes

<details>
<summary><strong>Schema migration</strong></summary>

```tsx
const checkoutJourney: JourneyOptions<CheckoutV2> = {
  version: 2,
  migrate: (old, fromVersion) =>
    fromVersion < 2 ? { ...old, address: { line1: old.address, city: '' } } : old,
  validate: isCheckoutV2, // runs on the migrated data, never on the old shape
};

function CheckoutEntry() {
  useJourney('checkout', checkoutJourney); // register before restoring
  const recovery = useRecovery<CheckoutV2>('checkout');
  // ...
}
```

</details>

<details>
<summary><strong>Forms (React Hook Form)</strong></summary>

```tsx
const form = useForm<Application>();

const journey = useJourneyForm('loan-application', form, {
  exclude: ['ssn'],
  autoRestore: true, // load saved values into the form without prompting
});
```

Works with any form object that has `watch`, `getValues` and `reset`.

</details>

<details>
<summary><strong>Encrypted, signed storage</strong></summary>

```tsx
import * as SecureStore from 'expo-secure-store';
import { SecureStoreAdapter } from 'react-native-journey-recovery';

// Keychain / Keystore encryption; keys are encoded and large values chunked automatically.
const storage = new SecureStoreAdapter(SecureStore);

// Optional: sign every snapshot so tampering is detected, not just corruption.
const transform = hmacTransform(secretFromKeychain); // { encode, decode }

<RecoveryProvider storage={storage} options={{ transform }} />;
```

See [Security and privacy](https://rn-journey-recovery.vercel.app/docs/security-privacy) for a complete HMAC example.

</details>

<details>
<summary><strong>Shared devices</strong></summary>

```tsx
<RecoveryProvider storage={storage} options={{ userId: user?.id }}>

// On sign-out
const { journeyManager } = useRecoveryContext();
await journeyManager.getCheckpointManager().clearUserJourneys(userId);
```

</details>

<details>
<summary><strong>Analytics and error reporting</strong></summary>

```tsx
<RecoveryProvider
  storage={storage}
  onRecovery={(event) => analytics.track(`journey_${event.type}`, { journey: event.journeyId })}
  onError={(error, journeyId) => crashReporter.record(error, { journeyId, code: error.code })}
/>
```

Events other than `restored` carry metadata only, so listeners never receive user input by accident.

</details>

<details>
<summary><strong>Testing</strong></summary>

```tsx
import { renderHook, waitFor } from '@testing-library/react-native';
import { createTestRecoveryEnvironment, useRecovery } from 'react-native-journey-recovery';

it('offers to resume a saved checkout', async () => {
  const env = createTestRecoveryEnvironment();
  await env.seedCheckpoint('checkout', { step: 'payment' });

  const { result } = renderHook(() => useRecovery('checkout'), { wrapper: env.wrapper });
  await waitFor(() => expect(result.current.available).toBe(true));
});
```

</details>

## API at a glance

| Export | Purpose |
|---|---|
| [`RecoveryProvider`](https://rn-journey-recovery.vercel.app/docs/recovery-provider) | Creates the engine; options for storage, expiry, auto-save, user scope, transform; `onRecovery` and `onError`. |
| [`useJourney(id, options?)`](https://rn-journey-recovery.vercel.app/docs/use-journey) | `checkpoint()`, `flush()`, `clear()`, `status`, `error`. |
| [`useRecovery(id, options?)`](https://rn-journey-recovery.vercel.app/docs/use-recovery) | `status`, `available`, `data`, `snapshot`, `restore()`, `discard()`, `refresh()`. |
| [`useRecoveryStatus(id)`](https://rn-journey-recovery.vercel.app/docs/use-recovery-status) | Just the status, for badges. |
| [`useJourneyForm(id, form, options?)`](https://rn-journey-recovery.vercel.app/docs/use-journey-form) | Form integration. |
| [Storage adapters](https://rn-journey-recovery.vercel.app/docs/storage-adapters) | `AsyncStorageAdapter`, `MMKVStorageAdapter`, `SecureStoreAdapter`, `MemoryStorageAdapter`. |
| [Core engine](https://rn-journey-recovery.vercel.app/docs/core-engine) | `JourneyManager`, `RecoveryManager`, `CheckpointManager`, `LifecycleManager`, for use outside React. |
| [`JourneyRecoveryError`](https://rn-journey-recovery.vercel.app/docs/errors) | Every error has a machine-readable `code`. |

Full reference: [documentation site](https://rn-journey-recovery.vercel.app/docs/recovery-provider) or [`docs/api-reference.md`](https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/docs/api-reference.md).

## Security notes

- Exclude secrets (card numbers, CVV, passwords, tokens) with `exclude`. Use `SecureStoreAdapter` or an encrypted MMKV instance for encryption at rest.
- The built-in checksum (FNV-1a) detects **accidental corruption**, not deliberate tampering. For tamper detection, use a `transform` that signs with an HMAC.
- Restored progress is UI state. Treat it as untrusted input and confirm anything with business impact, such as payment or submission status, with your server.

Report vulnerabilities as described in [SECURITY.md](https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/SECURITY.md).

## Compatibility

- React 18+, React Native, and Expo (including Expo Go). No native code.
- Runs on the web through `react-native-web`, as the playground shows.
- Ships CommonJS and ESM builds with TypeScript declarations.

## Contributing

```bash
git clone https://github.com/Imdvlpr99/react-native-journey-recovery.git
cd react-native-journey-recovery
npm install
npm test          # unit and integration tests
npm run verify    # typecheck, coverage, benchmark, build, package lint, docs build
npm run dev:docs  # documentation site at http://localhost:5173
```

See [CONTRIBUTING.md](https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/CONTRIBUTING.md).

## License

[MIT](https://github.com/Imdvlpr99/react-native-journey-recovery/blob/master/LICENSE)
