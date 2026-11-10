# React Native Journey Recovery MVP (v0.1.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete v0.1.0 MVP of `react-native-journey-recovery`, a developer-first recovery engine for React Native that captures, persists, validates, and restores interrupted multi-step workflows.

**Architecture:** A framework-agnostic TypeScript core engine managing journey registration, checkpoint persistence with write serialization, and snapshot validation, isolated behind a clean storage adapter interface (`StorageAdapter`). A React integration layer (`RecoveryProvider`, `useJourney`, `useRecovery`, `useRecoveryStatus`) sits on top of this engine, offering debounced auto-save and idiomatic recovery hooks for React Native applications without relying on OS process-death callbacks.

**Tech Stack:** TypeScript (strict mode), React 18/19 peer dependencies, Vitest (for comprehensive unit and integration testing), npm.

**Spec:** `REACT_NATIVE_JOURNEY_RECOVERY_PRODUCT_BLUEPRINT.md`

## Global Constraints

- Pure TypeScript implementation for v0.1.0: no Kotlin or Swift native modules (`REACT_NATIVE_JOURNEY_RECOVERY_PRODUCT_BLUEPRINT.md#7.3`).
- Storage abstraction layer: storage must be pluggable via `StorageAdapter` interface; `AsyncStorageAdapter` and `MemoryStorageAdapter` provided (`REACT_NATIVE_JOURNEY_RECOVERY_PRODUCT_BLUEPRINT.md#10`).
- Safe by default: explicit field opt-in and exclusion support; never serialize whole state trees or log snapshot contents (`REACT_NATIVE_JOURNEY_RECOVERY_PRODUCT_BLUEPRINT.md#4`, `#11`).
- Recovery reliability: concurrent writes serialized per journey; last committed checkpoint preserved on failed writes; validated restoration; expiry rejection (`REACT_NATIVE_JOURNEY_RECOVERY_PRODUCT_BLUEPRINT.md#6`, `#13`).
- Zero framework hard-dependencies: core works independently of any specific navigation or form library (`REACT_NATIVE_JOURNEY_RECOVERY_PRODUCT_BLUEPRINT.md#4`, `#23`).

## Review Focus

1. **Corrupted snapshot JSON**: Stored checkpoint string is truncated or malformed JSON; expected behavior is to fail safely with `SNAPSHOT_CORRUPTED` error without throwing unhandled exceptions.
2. **Concurrent checkpoint writes**: Rapid consecutive calls to `checkpoint()` in the same journey; expected behavior is strictly serialized in-order execution without race conditions.
3. **Write failure preserving last committed snapshot**: If storage throws during `setItem`, the previous checkpoint remains intact and `checkpoint()` throws a typed `STORAGE_UNAVAILABLE` error.
4. **Expired checkpoint on app relaunch**: Checkpoint timestamp exceeds `expiry` (or `expiresAt`); recovery returns `status: 'expired'` with `data: null` and does not restore by default.
5. **Schema version mismatch without migration handler**: Checkpoint schema version does not match journey registration version and no `migrate` function is provided; expected behavior is recovery reports `MIGRATION_FAILED` or `SNAPSHOT_INVALID` without corrupting state.

---

### Task 1: Project Scaffolding & Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/index.ts`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Consumes: None
- Produces: TypeScript project build, lint, and Vitest test environment running cleanly.

- [ ] **Step 1: Write the setup verification test**

```ts
// tests/setup.test.ts
import { describe, it, expect } from 'vitest';

describe('Project Environment', () => {
  it('runs tests with Vitest successfully', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Configure package.json, tsconfig.json, vitest.config.ts, and .gitignore**

Configure `package.json` with:
- `name`: `react-native-journey-recovery`
- `version`: `0.1.0`
- `main`: `dist/index.js`
- `module`: `dist/index.mjs`
- `types`: `dist/index.d.ts`
- `scripts`: `build`, `test`, `typecheck`
- `peerDependencies`: `react: ">=18.0.0"`
- `devDependencies`: `typescript`, `vitest`, `@types/react`, `react`

Configure `tsconfig.json` with strict mode, `ES2022` target, `NodeNext` or `Bundler` module resolution, declaration emitting.

- [ ] **Step 3: Run test to verify it passes**

Run: `npm test`
Expected: PASS 1 test

- [ ] **Step 4: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .gitignore src/index.ts tests/setup.test.ts
git commit -m "chore: scaffold project structure and configure vitest"
```

---

### Task 2: Core Types & Error Model

**Files:**
- Create: `src/types/journey.ts`
- Create: `src/types/checkpoint.ts`
- Create: `src/types/recovery.ts`
- Create: `src/types/storage.ts`
- Create: `src/types/index.ts`
- Create: `src/utils/errors.ts`
- Test: `tests/core/errors.test.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `JourneyErrorCode`: `'JOURNEY_NOT_FOUND' | 'JOURNEY_EXPIRED' | 'SNAPSHOT_INVALID' | 'SNAPSHOT_CORRUPTED' | 'MIGRATION_FAILED' | 'STORAGE_UNAVAILABLE' | 'SERIALIZATION_FAILED' | 'JOURNEY_ALREADY_ACTIVE' | 'RECOVERY_CANCELLED'`
  - `JourneyRecoveryError`: Custom error class holding `code: JourneyErrorCode`, `journeyId?: string`, and optional `cause`.
  - `JourneySnapshot<T>`: `{ id: string; version: number; createdAt: number; updatedAt: number; expiresAt?: number; status: 'active' | 'completed'; data: T; checksum?: string; }`
  - `JourneyOptions<T>`: `{ version: number; expiry?: number; validate?: (data: unknown) => data is T; migrate?: (oldData: unknown, oldVersion: number) => T | Promise<T>; }`
  - `RecoveryStatus`: `'idle' | 'checking' | 'available' | 'restoring' | 'restored' | 'expired' | 'invalid' | 'failed'`
  - `StorageAdapter`: `{ getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void>; getAllKeys?(): Promise<string[]>; }`

- [ ] **Step 1: Write failing test for JourneyRecoveryError**

```ts
// tests/core/errors.test.ts
import { describe, it, expect } from 'vitest';
import { JourneyRecoveryError } from '../../src/utils/errors';

describe('JourneyRecoveryError', () => {
  it('creates error with code, message, journeyId, and maintains prototype', () => {
    const err = new JourneyRecoveryError('JOURNEY_EXPIRED', 'Checkout expired', 'checkout');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(JourneyRecoveryError);
    expect(err.code).toBe('JOURNEY_EXPIRED');
    expect(err.journeyId).toBe('checkout');
    expect(err.message).toBe('Checkout expired');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/errors.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement types and JourneyRecoveryError**

Create `src/types/journey.ts`, `checkpoint.ts`, `recovery.ts`, `storage.ts`, `index.ts`, and `src/utils/errors.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/errors.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/ src/utils/errors.ts tests/core/errors.test.ts
git commit -m "feat: define core types and error hierarchy"
```

---

### Task 3: Storage Abstraction & Adapters

**Files:**
- Create: `src/storage/StorageAdapter.ts`
- Create: `src/storage/MemoryStorageAdapter.ts`
- Create: `src/storage/AsyncStorageAdapter.ts`
- Create: `src/storage/index.ts`
- Test: `tests/storage/MemoryStorageAdapter.test.ts`
- Test: `tests/storage/AsyncStorageAdapter.test.ts`

**Interfaces:**
- Consumes: `StorageAdapter` from `src/types/storage.ts`
- Produces:
  - `MemoryStorageAdapter`: In-memory implementation of `StorageAdapter` (with `clear()` for testing).
  - `AsyncStorageAdapter`: Adapter accepting any AsyncStorage-like interface (`{ getItem, setItem, removeItem, getAllKeys }`).

- [ ] **Step 1: Write failing tests for MemoryStorageAdapter and AsyncStorageAdapter**

```ts
// tests/storage/MemoryStorageAdapter.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageAdapter } from '../../src/storage/MemoryStorageAdapter';

describe('MemoryStorageAdapter', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  it('sets, gets, and removes values correctly', async () => {
    await storage.setItem('test_key', 'test_value');
    expect(await storage.getItem('test_key')).toBe('test_value');
    await storage.removeItem('test_key');
    expect(await storage.getItem('test_key')).toBeNull();
  });

  it('returns all keys correctly', async () => {
    await storage.setItem('k1', 'v1');
    await storage.setItem('k2', 'v2');
    const keys = await storage.getAllKeys();
    expect(keys).toEqual(expect.arrayContaining(['k1', 'k2']));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/storage/MemoryStorageAdapter.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement MemoryStorageAdapter and AsyncStorageAdapter**

Implement `MemoryStorageAdapter` using an internal `Map<string, string>`.
Implement `AsyncStorageAdapter` wrapping a standard AsyncStorage-compatible client, catching raw storage errors and re-throwing `JourneyRecoveryError('STORAGE_UNAVAILABLE', ...)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/storage/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/storage/ tests/storage/
git commit -m "feat: implement storage abstraction with memory and async storage adapters"
```

---

### Task 4: Snapshot Serializer, Checksum, and Validator

**Files:**
- Create: `src/utils/checksum.ts`
- Create: `src/core/SnapshotSerializer.ts`
- Create: `src/core/SnapshotValidator.ts`
- Test: `tests/core/SnapshotSerializer.test.ts`
- Test: `tests/core/SnapshotValidator.test.ts`

**Interfaces:**
- Consumes: `JourneySnapshot<T>`, `JourneyOptions<T>`, `JourneyRecoveryError`
- Produces:
  - `computeChecksum(data: string): string`: Lightweight deterministic hash (e.g., FNV-1a 32-bit hex) to detect corruption.
  - `SnapshotSerializer`:
    - `serialize<T>(snapshot: JourneySnapshot<T>, options?: { exclude?: string[] }): string`
    - `deserialize<T>(raw: string): JourneySnapshot<T>`
  - `SnapshotValidator`:
    - `validate<T>(snapshot: unknown, options: JourneyOptions<T>): ValidationResult<T>`
    - `isExpired(snapshot: JourneySnapshot<unknown>): boolean`

- [ ] **Step 1: Write failing tests for Serializer and Validator**

Test coverage must explicitly verify:
- Normal serialization & deserialization.
- Excluding sensitive fields via `exclude: ['password', 'cvv']`.
- Throws `JourneyRecoveryError('SERIALIZATION_FAILED')` on circular structures.
- Throws `JourneyRecoveryError('SNAPSHOT_CORRUPTED')` on invalid/truncated JSON.
- Validation checks `id`, `version`, `status`, timestamp fields.
- Expiry detection when `Date.now() > expiresAt`.
- Custom user validation `options.validate(data)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/SnapshotSerializer.test.ts tests/core/SnapshotValidator.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Checksum, SnapshotSerializer, and SnapshotValidator**

Implement:
1. `src/utils/checksum.ts`: Fast deterministic 32-bit hash.
2. `src/core/SnapshotSerializer.ts`: Serializes with checksum, field omission (`exclude`), handles circular reference errors gracefully.
3. `src/core/SnapshotValidator.ts`: Verifies structural integrity, checksum match (detecting corruption), expiry check, and custom validator execution.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/SnapshotSerializer.test.ts tests/core/SnapshotValidator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/checksum.ts src/core/SnapshotSerializer.ts src/core/SnapshotValidator.ts tests/core/
git commit -m "feat: implement snapshot serializer with exclusions, checksum and validator"
```

---

### Task 5: Checkpoint Manager & Write Serialization

**Files:**
- Create: `src/utils/debounce.ts`
- Create: `src/core/CheckpointManager.ts`
- Test: `tests/core/CheckpointManager.test.ts`

**Interfaces:**
- Consumes: `StorageAdapter`, `SnapshotSerializer`, `SnapshotValidator`, `JourneySnapshot<T>`
- Produces:
  - `CheckpointManager`:
    - `save<T>(journeyId: string, data: T, metadata: CheckpointMetadata, options?: CheckpointSaveOptions): Promise<JourneySnapshot<T>>`
    - `get<T>(journeyId: string): Promise<JourneySnapshot<T> | null>`
    - `delete(journeyId: string): Promise<void>`
    - `deleteAll(): Promise<void>`
- **Key Safety Rule**: Checkpoint writes to the same `journeyId` must be serialized using a per-journey promise queue/mutex to eliminate race conditions. If a write fails, the previous valid checkpoint remains in storage.

- [ ] **Step 1: Write failing tests for CheckpointManager**

Test coverage:
- Save and retrieve checkpoint.
- Multiple rapid concurrent saves to the same journey resolve sequentially in correct order.
- Storage failure during save preserves previous checkpoint and throws `STORAGE_UNAVAILABLE`.
- Deleting single journey removes only that journey.
- `deleteAll()` clears all registered journey keys.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/CheckpointManager.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement CheckpointManager and mutex queue**

Implement per-journey write serialization lock (promise chaining). Use atomic write strategy: save to target key, and if storage write fails, catch error and preserve prior state.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/CheckpointManager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/debounce.ts src/core/CheckpointManager.ts tests/core/CheckpointManager.test.ts
git commit -m "feat: implement checkpoint manager with write serialization and failure safety"
```

---

### Task 6: Journey Registry & Journey Manager

**Files:**
- Create: `src/core/JourneyRegistry.ts`
- Create: `src/core/JourneyManager.ts`
- Test: `tests/core/JourneyRegistry.test.ts`
- Test: `tests/core/JourneyManager.test.ts`

**Interfaces:**
- Consumes: `CheckpointManager`, `JourneyOptions<T>`, `JourneySnapshot<T>`
- Produces:
  - `JourneyRegistry`: Tracks active journey configurations, preventing duplicate active registrations unless explicitly configured.
  - `JourneyManager`: Orchestrates registration, checkpointing with options (`exclude`, `autoSave`), migration when schema version increases, and clearing.

- [ ] **Step 1: Write failing tests for JourneyRegistry & JourneyManager**

Test coverage:
- Register journey and prevent duplicate registration error `JOURNEY_ALREADY_ACTIVE`.
- Unregister journey.
- Checkpointing through `JourneyManager.checkpoint(id, data, options)`.
- Schema migration: when stored snapshot version < current registered version, execute `options.migrate(oldData, oldVersion)`. If migration throws, throw `MIGRATION_FAILED`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/JourneyRegistry.test.ts tests/core/JourneyManager.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement JourneyRegistry and JourneyManager**

Implement registry tracking and lifecycle coordination. Support migration pipeline: `oldVersion` -> `migrate(oldData, oldVersion)` -> validate migrated data -> return or save.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/JourneyRegistry.test.ts tests/core/JourneyManager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/JourneyRegistry.ts src/core/JourneyManager.ts tests/core/
git commit -m "feat: implement journey registry and journey manager with schema migration"
```

---

### Task 7: Recovery Manager & Expiry Handling

**Files:**
- Create: `src/core/RecoveryManager.ts`
- Create: `src/core/LifecycleManager.ts`
- Test: `tests/core/RecoveryManager.test.ts`
- Test: `tests/core/LifecycleManager.test.ts`

**Interfaces:**
- Consumes: `JourneyManager`, `CheckpointManager`, `SnapshotValidator`
- Produces:
  - `RecoveryManager`:
    - `check<T>(journeyId: string): Promise<RecoveryInspectionResult<T>>`
    - `restore<T>(journeyId: string): Promise<T>`
    - `discard(journeyId: string): Promise<void>`
  - `LifecycleManager`:
    - Registers callbacks for lifecycle recovery events (`onSave`, `onRestore`, `onExpire`, `onDiscard`, `onError`).
    - Flushes pending debounced saves on demand (e.g., when app state moves to background).

- [ ] **Step 1: Write failing tests for RecoveryManager & LifecycleManager**

Test coverage:
- `check(journeyId)` returns `available: true, status: 'available'` when valid checkpoint exists.
- `check(journeyId)` returns `available: false, status: 'expired'` when checkpoint is past expiry.
- `check(journeyId)` returns `available: false, status: 'invalid'` when corrupted or validation fails.
- `restore(journeyId)` returns the restored data and fires lifecycle event.
- `discard(journeyId)` deletes checkpoint and fires `onDiscard`.
- Flush triggers pending debounced writes immediately.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/RecoveryManager.test.ts tests/core/LifecycleManager.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement RecoveryManager and LifecycleManager**

Implement complete status inspection, expiry determination, safe restoration, event dispatching, and pending flush mechanism.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/RecoveryManager.test.ts tests/core/LifecycleManager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/RecoveryManager.ts src/core/LifecycleManager.ts tests/core/
git commit -m "feat: implement recovery manager with inspection, expiry, and lifecycle events"
```

---

### Task 8: React Integration Layer (Provider & Hooks)

**Files:**
- Create: `src/react/RecoveryContext.ts`
- Create: `src/react/RecoveryProvider.tsx`
- Create: `src/react/useJourney.ts`
- Create: `src/react/useRecovery.ts`
- Create: `src/react/useRecoveryStatus.ts`
- Create: `src/react/index.ts`
- Test: `tests/react/RecoveryProvider.test.tsx`
- Test: `tests/react/useJourney.test.tsx`
- Test: `tests/react/useRecovery.test.tsx`

**Interfaces:**
- Consumes: `JourneyManager`, `RecoveryManager`, `StorageAdapter`, React Context & Hooks
- Produces:
  - `<RecoveryProvider storage={adapter} options={{ autoSave, debounceMs, defaultExpiry }} onRecovery={fn}>`
  - `useJourney<T>(journeyId: string, options?: JourneyOptions<T>): JourneyHandle<T>`
    - `checkpoint(data: T, options?: CheckpointOptions): Promise<void>`
    - `clear(): Promise<void>`
    - `status: RecoveryStatus`
  - `useRecovery<T>(journeyId: string): RecoveryState<T>`
    - `{ available: boolean; status: RecoveryStatus; data: T | null; restore: () => Promise<T>; discard: () => Promise<void>; updatedAt?: number; error?: Error | null; }`
  - `useRecoveryStatus(journeyId: string): RecoveryStatus`

- [ ] **Step 1: Write failing tests for Provider and Hooks**

Use React test harness to verify:
- `RecoveryProvider` initializes context with storage adapter.
- `useJourney` registers journey on mount, allows saving checkpoints, and unregisters/cleans up on unmount.
- `useRecovery` detects existing checkpoint on mount, reports `available: true`, and `restore()` returns data.
- Handles expired checkpoints gracefully (`status: 'expired'`).
- `discard()` clears stored progress.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/react/`
Expected: FAIL

- [ ] **Step 3: Implement RecoveryProvider and Hooks**

Implement context and hooks with proper React lifecycle hygiene (effects cleanup, debounced checkpoint dispatch, memoized handlers).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/react/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/react/ tests/react/
git commit -m "feat: implement React provider and useJourney, useRecovery, useRecoveryStatus hooks"
```

---

### Task 9: End-to-End Integration Tests & Failure Scenarios

**Files:**
- Create: `tests/integration/process-restart.test.ts`
- Create: `tests/integration/corrupted-storage.test.ts`
- Create: `tests/integration/concurrent-writes.test.ts`
- Create: `tests/integration/schema-migration.test.ts`

**Interfaces:**
- Consumes: Full public API exported from `src/index.ts`
- Produces: Verified end-to-end resilience matching Blueprint Section 21 MVP acceptance criteria.

- [ ] **Step 1: Write comprehensive integration tests**

1. **Process Restart Simulation**:
   - Initialize Engine 1 with MemoryStorageAdapter.
   - User enters Step 1, saves checkpoint.
   - Simulate process kill (tear down Engine 1, retain storage).
   - Initialize Engine 2 with same storage.
   - Verify journey is detected as `available` and restored identically.
2. **Corrupted Storage**:
   - Write truncated/random bytes to the journey key in storage.
   - Run recovery check; verify safe fallback (`SNAPSHOT_CORRUPTED`), no uncaught crash.
3. **Concurrent Saves**:
   - Fire 20 simultaneous `checkpoint()` calls with increasing sequence numbers.
   - Verify final checkpoint matches the latest call and order is strictly maintained.
4. **Schema Migration**:
   - Save v1 data `{ name: 'John Doe' }`.
   - Mount v2 journey with `migrate: (d) => ({ firstName: d.name.split(' ')[0], lastName: d.name.split(' ')[1] })`.
   - Restore and verify migration transforms data properly.

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/integration/`
Expected: PASS all integration tests

- [ ] **Step 3: Commit**

```bash
git add tests/integration/
git commit -m "test: add integration tests for process restart, corruption, concurrency, and migration"
```

---

### Task 10: Multi-Screen Checkout Flow Example, Package Entry Points, & Documentation

**Files:**
- Modify: `src/index.ts` (export all public APIs and types)
- Create: `examples/checkout-flow/CheckoutFlow.tsx`
- Create: `examples/checkout-flow/types.ts`
- Create: `README.md`
- Create: `LICENSE` (MIT)
- Create: `CHANGELOG.md`
- Test: `tests/index.test.ts`

**Interfaces:**
- Consumes: Public API
- Produces:
  - Clean `src/index.ts` exposing:
    - `RecoveryProvider`, `useJourney`, `useRecovery`, `useRecoveryStatus`
    - `MemoryStorageAdapter`, `AsyncStorageAdapter`, `StorageAdapter`
    - `JourneyRecoveryError`
    - Full TypeScript types
  - Complete multi-screen checkout example showcasing real-world recovery prompt ("Continue where you left off" vs "Start over").
  - Production README with quickstart, security principles, API reference, and lifecycle caveats.

- [ ] **Step 1: Write exports test in `tests/index.test.ts`**

Verify that all required public symbols are exported and typed.

- [ ] **Step 2: Build `src/index.ts`, example, README.md, LICENSE, and CHANGELOG.md**

- [ ] **Step 3: Run full test suite and typecheck**

Run: `npm run typecheck && npm test`
Expected: PASS with 0 type errors and 100% passing tests.

- [ ] **Step 4: Commit**

```bash
git add src/index.ts examples/ README.md LICENSE CHANGELOG.md tests/index.test.ts
git commit -m "feat: complete v0.1.0 exports, checkout flow example, and documentation"
```

