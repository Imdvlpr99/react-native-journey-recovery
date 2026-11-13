# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Typed lifecycle events: `RecoveryEvent.type` (`saved`, `save_failed`, `cleared`, `discarded`, `restored`, `migrated`, `expired`, `invalid`, `completed`) and `LifecycleManager.onEvent()`.
- `RecoveryProvider` `onError` callback for failed saves, including debounced auto-saves and background flushes.
- `JourneyHandle.flush()` and `JourneyHandle.error`; `useJourney` now reports `failed` when a debounced save fails.
- `useRecovery().refresh()`; recovery state resets when any component clears or discards the journey.
- `exclude` accepts dot paths (`'payment.cardNumber'`), applied through arrays.
- `transform` option (`SnapshotTransform`) to encode/decode stored values, for encryption at rest or HMAC signing.
- `expiryMode: 'sliding' | 'absolute'` on the provider and per journey.
- `maxSizeBytes` and `transform` on `RecoveryProvider`.
- `useJourneyForm` `journey` option (version, migrate, validate, expiryMode).
- `SecureStoreAdapter` key index (`trackKeys`, default on) so `getAllKeys`, `clearAllJourneys()` and `clearUserJourneys()` work.
- `'completed'` recovery status.
- Build ships CommonJS and ESM with matching type declarations (tsup); `npm run lint:package` (publint, are-the-types-wrong) runs in CI.

### Changed
- Completed journeys are reported as `completed` instead of `available` and are no longer offered for resume.
- Snapshots saved with a newer schema version than the registered one are reported as `invalid`.
- `validate` now runs on the current schema only; older snapshots are validated after migration, and migrated data that fails validation is not saved (`MIGRATION_FAILED`).
- A storage read failure during a check reports `failed` (`STORAGE_UNAVAILABLE`) instead of `invalid`.
- `expiry: 0` expires immediately (it previously meant "never").
- Migration keeps the original `expiresAt` and `completed` status.
- `saved` and other new events carry snapshot metadata only; only `restored` events include data.
- Errors thrown by a `validate` function are wrapped in `SNAPSHOT_INVALID` with the original as `cause`.

### Fixed
- `SecureStoreAdapter` used keys containing `@` and `:`, which expo-secure-store rejects; keys are now encoded into its allowed alphabet.
- `SecureStoreAdapter` chunked by UTF-16 length, so non-ASCII values could exceed Android's 2048-byte limit and emoji could be split; chunking is now by UTF-8 bytes on character boundaries.
- `SecureStoreAdapter` left previous chunks (possibly sensitive) in the keychain when a value shrank, and an interrupted chunked write could corrupt the previous value.
- Debounced auto-save failures were unhandled promise rejections and never surfaced.
- After `clear()`, later auto-saves were not flushed on unmount or background.
- `discard()` did not cancel a pending auto-save, which could re-create the checkpoint.
- `useJourneyForm` `autoRestore` never restored, and the hook re-subscribed to `form.watch` on every render.
- User ids or journey ids containing `:` could read or delete another user's checkpoints.
- The package could not be loaded by Node (`require` or `import`), breaking Jest for consumers.
- `createTestRecoveryEnvironment` ignored `keyPrefix` when seeding.
- Every save re-read the previous snapshot; `createdAt` is now cached. The per-journey write queue is pruned when idle.

### Removed
- CLI (`journey-recovery`), navigation adapters, Formik / Zustand / Redux / TanStack Query integrations, UI components (`RecoveryBanner`, `RecoveryModal`, `RecoveryBottomSheet`), Zod validator helper, and checkpoint history.
- Unused third `validator` parameter of the `JourneyManager` constructor (it was never read).
- Legacy HTML simulator (`examples/simulator`), superseded by the live playground on the docs site.
- Committed docs build output; the site now builds to `website/dist` on deploy.

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
  - `SecureStoreAdapter`: Hardware-backed encrypted storage via `expo-secure-store` with automatic 2048-byte Keystore chunking for Android.
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
  - `createZodValidator`: Pluggable Zod schema validation helper without mandatory peer dependency.
- **Diagnostics & Tooling:**
  - `getRecoveryDiagnostics`: Deep diagnostic inspector reporting payload byte size, checksum status, expiry countdown, format version, and migration eligibility.
  - `journey-recovery` CLI: Terminal inspection tool (`inspect`, `verify`, `checksum`) for snapshot validation and automated CI checks.
- **UI Primitives:**
  - `RecoveryBanner`: Accessible, themeable, and headless-ready prompt banner offering users the choice to resume or discard.
  - `RecoveryModal`: Centered modal dialog with backdrop blur overlay and action buttons.
  - `RecoveryBottomSheet`: Mobile-first bottom sheet prompt with drag handle pill.
- **React Hooks & Provider:**
  - `RecoveryProvider`: Context provider with AppState background listener for automatic write flushing.
  - `useJourney`, `useRecovery`, `useRecoveryStatus`, and `useRecoveryContext`.
- **Testing & Benchmarks:**
  - `createTestRecoveryEnvironment` & `initTestRecoveryEnvironment`: Isolated in-memory testing harness for Jest and Vitest.
  - Chaos & high-concurrency test suite (50 concurrent writes, disk quota exhaustion, transient errors).
  - High-throughput benchmark suite (`benchmarks/bench-throughput.ts`, measuring FNV-1a hashing, promise queues, and reads).
- **Examples & Documentation:**
  - Interactive React Documentation Website (`website/` and `docs/`) with Dark/Light mode theme switcher.
  - Interactive Schema & Checkpoint Playground with live FNV-1a checksums and TypeScript contract generation.
  - Standalone runnable Expo example workspace (`examples/expo/package.json`, `app.json`, `tsconfig.json`).
  - Multi-screen e-commerce checkout flow (`examples/checkout-flow`).
  - Bare React Native KYC identity verification with user identity scoping (`examples/bare-react-native`).
  - Architecture Decision Records (`docs/adr/0001`, `docs/adr/0002`, `docs/adr/0003`).
  - Full API reference (`docs/api-reference.md`).
  - GitHub Actions Node.js matrix CI (20.x, 22.x) and GitHub Pages deployment workflow.
