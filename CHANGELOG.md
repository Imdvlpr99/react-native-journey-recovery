# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-10

### Added
- **Core Engine:**
  - Named journey registration and lifecycle management (`JourneyManager`, `JourneyRegistry`).
  - Checkpoint persistence, validation, and restoration (`CheckpointManager`, `RecoveryManager`).
  - Per-journey promise mutex queue serializing high-frequency concurrent writes to eliminate write races.
  - Atomic failure safety preserving the prior valid snapshot if a subsequent write fails.
  - Deterministic FNV-1a checksum calculation and verification to detect storage tampering or corruption.
  - Automatic schema version migration via `migrate(oldData, oldVersion)` callback.
  - Time-to-live expiry validation with custom predicate validation support (`validate(data)`).
  - Configurable snapshot payload byte size limits (`maxSizeBytes`, default 512 KB) and storage format versioning (`_formatVersion: 1`).
  - Historical snapshot stack recording and rollback (`enableHistory`, `maxHistory`, `getHistory`, `restoreFromHistory`).
  - Multi-user isolation and scoping (`userId`) for shared devices, with user-scoped purge (`clearUserJourneys`).
- **Storage Adapters:**
  - `AsyncStorageAdapter`: Standard React Native persistent storage.
  - `MMKVStorageAdapter`: High-performance synchronous-backed storage via `react-native-mmkv`.
  - `MemoryStorageAdapter`: Fast in-memory storage for testing and ephemeral workflows.
- **Navigation Adapters:**
  - `createNavigationAdapter`: Stack state capture, route history, and reset for `@react-navigation/native`.
  - `createExpoRouterAdapter`: File-based route context, segments, and search parameters restoration for Expo Router.
- **Form & State Integrations:**
  - `useJourneyForm`: Automatic form value synchronization and reset for React Hook Form.
  - `useJourneyFormik`: Seamless form value synchronization and reset for Formik.
  - `useJourneyZustand`: Selective slice persistence and restoration for Zustand stores.
  - `useJourneyRedux`: Selective slice persistence and action dispatch restoration for Redux stores.
  - `useJourneyQuery` & `createTanStackQueryCoordinator`: TanStack Query cache invalidation and server revalidation on recovery.
- **Diagnostics & Tooling:**
  - `getRecoveryDiagnostics`: Deep diagnostic inspector reporting payload byte size, checksum status, expiry countdown, format version, and migration eligibility.
- **UI Primitives:**
  - `RecoveryBanner`: Accessible, themeable, and headless-ready prompt banner offering users the choice to resume or discard.
- **React Hooks & Provider:**
  - `RecoveryProvider`: Context provider with AppState background listener for automatic write flushing.
  - `useJourney`, `useRecovery`, `useRecoveryStatus`, and `useRecoveryContext`.
- **Examples & Tooling:**
  - Multi-screen e-commerce checkout flow (`examples/checkout-flow`).
  - Expo flight booking wizard with MMKV (`examples/expo`).
  - Bare React Native KYC identity verification with user identity scoping (`examples/bare-react-native`).
  - Architecture Decision Records (`docs/adr/0001`, `docs/adr/0002`, `docs/adr/0003`).
  - Full API reference (`docs/api-reference.md`).
  - GitHub Actions Node.js matrix CI (18.x, 20.x, 22.x).
