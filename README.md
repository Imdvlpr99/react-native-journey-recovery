# react-native-journey-recovery

> **Never make users start over.**  
> A developer-first journey recovery engine for React Native. Save checkpoints, validate interrupted sessions, and restore unfinished multi-screen workflows on Android and iOS.

[![npm version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://www.npmjs.com/package/react-native-journey-recovery)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![CI](https://github.com/Imdvlpr99/react-native-journey-recovery/actions/workflows/ci.yml/badge.svg)](https://github.com/Imdvlpr99/react-native-journey-recovery/actions/workflows/ci.yml)

---

## Overview

Mobile workflows (checkout flows, multi-step onboarding, KYC forms, booking wizards) are frequently interrupted when:
- The user accidentally closes or backgrounds the app.
- Android or iOS terminates background processes to reclaim RAM.
- The device restarts or the app crashes.
- Network connectivity drops mid-flow.

`react-native-journey-recovery` provides a dedicated, lightweight recovery lifecycle for named journeys: registration, checkpointing, validation, expiry, restoration, migration, and cleanup.

### Core Product Principles
1. **Developer-Controlled:** Explicitly decide what data is captured. Never dump full state stores automatically.
2. **Safe by Default:** Sensitive field exclusion, structural validation, and FNV-1a integrity checksums before restoring.
3. **Write Serialization:** Checkpoint writes are strictly queued per journey to eliminate race conditions.
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
- `react-native-mmkv` (optional, for fast MMKV storage)

---

## Quick Start

### 1. Setup Provider

Wrap your application with `RecoveryProvider`:

```tsx
import React from 'react';
import { AppState } from 'react-native';
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
        autoSave: true,
        debounceMs: 500,
        appState: AppState, // Automatically flushes pending debounced writes on background
        flushOnBackground: true,
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

Use `useJourney` inside workflow screens:

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
    // Save checkpoint before navigating forward
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

### 3. Prompt Users with `<RecoveryBanner />`

Add an accessible, customizable recovery prompt to your flow:

```tsx
import React from 'react';
import { RecoveryBanner } from 'react-native-journey-recovery';

export function CheckoutEntryScreen({ navigation }) {
  return (
    <View>
      <RecoveryBanner
        journeyId="checkout"
        title="Resume your unfinished checkout?"
        onRestored={(data) => {
          navigation.navigate(data.step, { restoredData: data });
        }}
      />
      <FreshCheckoutView />
    </View>
  );
}
```

---

## Key Features & Integrations

### 1. Form Integration (`useJourneyForm` & `useJourneyFormik`)
Seamlessly integrates with **React Hook Form** and **Formik**:

```tsx
// React Hook Form
const { hasSavedProgress, restoreToForm, clearForm } = useJourneyForm('profile-flow', form, {
  autoSave: true,
  exclude: ['password'],
});

// Formik
const { hasSavedProgress, restoreToFormik, clearFormik } = useJourneyFormik('signup-flow', formik, {
  autoSave: true,
  exclude: ['confirmPassword'],
});
```

### 2. TanStack Query Server Coordination (`useJourneyQuery`)
Coordinate client snapshot recovery with server query cache invalidation and re-fetching:

```tsx
const { available, restoreAndRevalidate, discardAndReset } = useJourneyQuery('checkout-flow', {
  queryClient,
  invalidateOnRestore: [['cart'], ['inventory']],
  refetchOnRestore: [['pricing']],
  resetOnClear: [['cart-hold']],
  onRevalidated: async (data) => {
    console.log('Restored with fresh server prices:', data);
  },
});
```

### 3. Recovery Diagnostics (`getRecoveryDiagnostics`)
Explain exactly why a session is or is not recoverable with granular health and security metrics:

```tsx
const diag = await recoveryManager.getDiagnostics('checkout-flow');
console.log(diag);
// {
//   exists: true,
//   status: 'available',
//   isRecoverable: true,
//   payloadSizeBytes: 1420,
//   hasChecksum: true,
//   checksumValid: true,
//   isExpired: false,
//   timeUntilExpiryMs: 86340000,
//   isEligibleForMigration: false,
//   formatVersion: 1
// }
```

### 4. Selective State Slices (`useJourneyZustand` & `useJourneyRedux`)
Persist **only the specific slice** of state without dumping global stores:

```tsx
// Zustand Slice
const { hasSavedProgress, restoreToStore } = useJourneyZustand(
  'cart-slice',
  useAppStore,
  (state) => state.cart
);

// Redux Slice
const { hasSavedProgress, restoreToRedux } = useJourneyRedux(
  'loan-slice',
  reduxStore,
  (state) => state.loanApplication
);
```

### 5. Navigation Adapters
- **React Navigation:** `createNavigationAdapter(navigation)`
- **Expo Router:** `createExpoRouterAdapter(router, () => ({ pathname, segments, params }))`

### 6. Storage Adapters
- `AsyncStorageAdapter`: Standard React Native storage.
- `MMKVStorageAdapter`: Ultra-fast synchronous-backed persistence.
- `SecureStoreAdapter`: Hardware-backed encrypted storage for Expo (`expo-secure-store`) with automatic 2048-byte Keystore chunking for Android.
- `MemoryStorageAdapter`: Fast in-memory storage for testing and ephemeral flows.

### 7. UI Primitives
Drop-in accessible, themeable components or headless custom UI via render props:
- **`RecoveryBanner`**: Inline prompt banner with title, last saved time, resume, and discard buttons.
- **`RecoveryModal`**: Centered modal dialog with backdrop blur overlay and focus trap.
- **`RecoveryBottomSheet`**: Mobile-first bottom sheet prompt with drag handle indicator.

```tsx
import { RecoveryModal, RecoveryBottomSheet } from 'react-native-journey-recovery';

// Centered Dialog
<RecoveryModal journeyId="loan-application" onRestored={(data) => setForm(data)} />

// Bottom-anchored Sheet
<RecoveryBottomSheet journeyId="kyc-verification" onRestored={(data) => resumeVerification(data)} />
```

### 8. CLI Diagnostic & Verification Tool
Inspect exported checkpoint snapshots, check FNV-1a integrity, and test TTL expiration directly from your terminal:

```bash
# Detailed diagnostic report
npx journey-recovery inspect snapshot.json

# Automated CI check: exits with 0 if valid, 1 if corrupted/expired
npx journey-recovery verify snapshot.json

# Fast FNV-1a checksum calculation
npx journey-recovery checksum '{"step":"review","cartItems":[...]}'
```

### 9. Multi-User & Shared Device Scoping
Namespace all checkpoints per logged-in user:

```tsx
<RecoveryProvider storage={storage} options={{ userId: currentUserId }}>
```
On logout, call `checkpointManager.clearUserJourneys(currentUserId)` to cleanly purge draft applications.

---

## Example Applications

- 🌐 [**Interactive Browser Simulator**](examples/simulator) — Standalone visual simulator with simulated process kill (SIGKILL), storage tampering, checksum validation, and real-time diagnostics.
- 🛒 [**Multi-Screen Checkout Flow**](examples/checkout-flow) — React Navigation multi-step checkout with delivery, method, and payment steps.
- ✈️ [**Expo Flight Booking Wizard**](examples/expo) — Expo Router flight reservation wizard using `MMKVStorageAdapter`.
- 🔐 [**Bare React Native KYC Flow**](examples/bare-react-native) — Identity verification flow featuring multi-user scoping and sensitive field exclusions.

---

## Documentation Website

The official developer documentation website is located in [`docs/`](docs/):
- 🌐 [**Interactive Documentation Website**](https://imdvlpr99.github.io/react-native-journey-recovery/) (Hosted via GitHub Pages)
- Run locally anytime: `npx serve docs` or open [`docs/index.html`](docs/index.html) directly in any browser.

---

## Detailed Documentation

For full props, return handles, options, and advanced architecture:
- 📖 [**Complete API Reference**](docs/api-reference.md)
- 🏗️ [**Product & Technical Blueprint**](REACT_NATIVE_JOURNEY_RECOVERY_PRODUCT_BLUEPRINT.md)
- 🤝 [**Contributing Guide**](CONTRIBUTING.md)

---

## License

MIT © 2026
