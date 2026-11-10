# react-native-journey-recovery

> **Never make users start over.**  
> A developer-first journey recovery engine for React Native. Save checkpoints, validate interrupted sessions, and restore unfinished multi-screen workflows on Android and iOS.

[![npm version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://www.npmjs.com/package/react-native-journey-recovery)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## Overview

Mobile workflows (checkout flows, multi-step onboarding, KYC forms, booking wizards) are frequently interrupted when:
- The user accidentally closes or backgrounds the app.
- Android or iOS terminates background processes to reclaim RAM.
- The device restarts or the app crashes.
- Network connectivity drops mid-flow.

`react-native-journey-recovery` provides a dedicated, lightweight recovery lifecycle for named journeys: registration, checkpointing, validation, expiry, restoration, migration, and cleanup.

### Product Principles
1. **Developer-Controlled:** Explicitly decide what data is captured. Never dump full state stores automatically.
2. **Safe by Default:** Sensitive field exclusion, structural validation, and integrity checksums before restoring.
3. **Write Serialization:** Checkpoint writes are strictly queued per journey to prevent race conditions.
4. **Resilient to Failure:** If a new write fails, the previous valid checkpoint is preserved.
5. **No Shutdown Callback Dependency:** Relies on incremental checkpoints, not unreliable OS termination callbacks.
6. **No Transaction Truth Assumption:** Restores client-side UI progress; server-side state (prices, stock, auth) must still be revalidated by your application.

---

## Installation

```bash
npm install react-native-journey-recovery
# or
pnpm add react-native-journey-recovery
```

### Peer Dependencies
- `react`: `>= 18.0.0`
- `@react-native-async-storage/async-storage` (optional, for persistent storage)

---

## Quick Start

### 1. Setup Provider

Wrap your app or flow container with `RecoveryProvider`:

```tsx
import React from 'react';
import { RecoveryProvider, AsyncStorageAdapter } from 'react-native-journey-recovery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNavigator } from './navigation/AppNavigator';

const storage = new AsyncStorageAdapter(AsyncStorage);

export default function App() {
  return (
    <RecoveryProvider
      storage={storage}
      options={{
        defaultExpiry: 24 * 60 * 60 * 1000, // 24 hours
        autoSave: false,
      }}
      onRecovery={(event) => {
        console.log(`[Journey ${event.journeyId}] status: ${event.status}`);
      }}
    >
      <AppNavigator />
    </RecoveryProvider>
  );
}
```

### 2. Capture Checkpoints in a Flow

Use `useJourney` inside your workflow screens:

```tsx
import React, { useState } from 'react';
import { useJourney } from 'react-native-journey-recovery';

export function CheckoutScreen({ navigation }) {
  const journey = useJourney('checkout', {
    version: 1,
    expiry: 12 * 60 * 60 * 1000, // 12 hours
  });

  const [address, setAddress] = useState('');

  const handleNext = async () => {
    // Save checkpoint before navigating to next screen
    await journey.checkpoint({
      step: 'shipping',
      address,
    }, {
      exclude: ['creditCardCVV'], // Safeguard sensitive fields
    });

    navigation.navigate('PaymentScreen');
  };

  const handleOrderComplete = async () => {
    // Clear checkpoint when flow is completed
    await journey.clear();
  };

  return (
    // Your UI components
  );
}
```

### 3. Offer Recovery to Returning Users

Use `useRecovery` at the entry point of your flow to check and restore progress:

```tsx
import React from 'react';
import { useRecovery } from 'react-native-journey-recovery';

export function CheckoutEntryScreen({ navigation }) {
  const recovery = useRecovery('checkout');

  if (recovery.available && recovery.snapshot) {
    return (
      <div>
        <h3>Continue your order?</h3>
        <p>You have unsaved checkout progress.</p>
        <button onClick={async () => {
          const data = await recovery.restore();
          navigation.navigate(data.step, { restoredData: data });
        }}>
          Resume
        </button>
        <button onClick={() => recovery.discard()}>
          Start Over
        </button>
      </div>
    );
  }

  return <FreshCheckoutStart />;
}
```

---

## Schema Migration

When application requirements evolve and your checkpoint data schema changes, define `migrate`:

```tsx
const journey = useJourney('user-profile', {
  version: 2,
  migrate: (oldData: any, oldVersion: number) => {
    if (oldVersion === 1) {
      const parts = oldData.fullName.split(' ');
      return {
        firstName: parts[0],
        lastName: parts[1],
      };
    }
    return oldData;
  },
});
```

---

## Storage Adapters

The engine works with any storage engine conforming to `StorageAdapter`:

```ts
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys?(): Promise<string[]>;
}
```

Provided out-of-the-box:
- `AsyncStorageAdapter`: Standard adapter for React Native AsyncStorage.
- `MemoryStorageAdapter`: Fast in-memory adapter for unit testing and ephemeral sessions.

---

## Error Handling

All runtime errors thrown by the engine are instances of `JourneyRecoveryError`:

| Error Code | Description |
|---|---|
| `JOURNEY_NOT_FOUND` | No saved checkpoint exists |
| `JOURNEY_EXPIRED` | Checkpoint has exceeded its configured expiration |
| `SNAPSHOT_INVALID` | Data failed structural or custom validation |
| `SNAPSHOT_CORRUPTED` | Malformed JSON or checksum mismatch |
| `MIGRATION_FAILED` | Checkpoint schema could not be migrated |
| `STORAGE_UNAVAILABLE` | Underlying storage provider failed |
| `SERIALIZATION_FAILED` | Circular or unsupported data structure |
| `JOURNEY_ALREADY_ACTIVE` | Duplicate journey registration |
| `RECOVERY_CANCELLED` | Recovery operation was cancelled |

---

## Security Best Practices

1. **Never Persist Passwords or Auth Tokens:** Checkpoints are intended for UI draft state, not session credentials.
2. **Exclude Sensitive Input:** Use `options.exclude` when saving form state.
3. **Clear on Logout:** Call `journeyManager.clearAllJourneys()` when a user signs out of a shared device.
4. **Revalidate Server Data:** Saved prices, inventory, or booking slots must be confirmed against backend APIs.

---

## License

MIT © 2026

