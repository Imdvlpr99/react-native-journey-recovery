# API reference

Everything is exported from the package root:

```ts
import { RecoveryProvider, useJourney, useRecovery } from 'react-native-journey-recovery';
```

The [documentation site](https://rn-journey-recovery.vercel.app/#/docs/recovery-provider) has the same reference with guides and examples.

## Contents

1. [RecoveryProvider](#recoveryprovider)
2. [useJourney](#usejourney)
3. [useRecovery](#userecovery)
4. [useRecoveryStatus](#userecoverystatus)
5. [useJourneyForm](#usejourneyform)
6. [useRecoveryContext](#userecoverycontext)
7. [Storage adapters](#storage-adapters)
8. [Core engine](#core-engine)
9. [Lifecycle events](#lifecycle-events)
10. [Diagnostics](#diagnostics)
11. [Testing](#testing)
12. [Types](#types)
13. [Errors](#errors)

---

## RecoveryProvider

Creates the recovery engine and provides it to the hooks. Render once near the root.

```tsx
<RecoveryProvider storage={storage} options={options} onRecovery={onRecovery} onError={onError}>
  {children}
</RecoveryProvider>
```

| Prop | Type | Description |
|---|---|---|
| `storage` | `StorageAdapter` | **Required.** Keep the instance stable; a new instance rebuilds the engine. |
| `options` | `RecoveryProviderOptions` | Engine defaults (below). |
| `onRecovery` | `(event: RecoveryEvent) => void` | Every [lifecycle event](#lifecycle-events). |
| `onError` | `(error: JourneyRecoveryError, journeyId: string) => void` | Failed saves, including debounced auto-saves and background flushes. |

| Option | Type | Default | Description |
|---|---|---|---|
| `autoSave` | `boolean` | `false` | Debounce saves for every journey (overridable per journey). |
| `debounceMs` | `number` | `500` | Auto-save delay. |
| `defaultExpiry` | `number` | none | Expiry in ms. |
| `expiryMode` | `'sliding' \| 'absolute'` | `'sliding'` | Measure expiry from the last save or the first. |
| `userId` | `string` | none | Scope keys to a user. |
| `keyPrefix` | `string` | `'@rn_journey:'` | Prefix for every key. |
| `appState` | `AppStateLike` | none | Pass React Native `AppState` to flush pending saves on background. |
| `flushOnBackground` | `boolean` | `true` | Only applies with `appState`. |
| `maxSizeBytes` | `number` | `524288` | Maximum serialized snapshot size. |
| `transform` | `SnapshotTransform` | none | `encode`/`decode` around storage, for encryption or HMAC signing. Keep stable. |

The engine is rebuilt when `storage`, `keyPrefix`, `defaultExpiry`, `expiryMode`, `autoSave`, `debounceMs`, `userId`, `maxSizeBytes` or `transform` change.

---

## useJourney

```ts
function useJourney<T>(journeyId: string, options?: JourneyOptions<T>): JourneyHandle<T>
```

Registers a journey and returns a handle to save it.

| Option | Type | Description |
|---|---|---|
| `version` | `number` | Schema version, default `1`. |
| `migrate` | `(oldData, oldVersion) => T \| Promise<T>` | Upgrades older snapshots during `restore()`. |
| `validate` | `(data: unknown) => data is T` | Runs on every save and on restore against the current version (after migration). |
| `expiry` | `number` | Expiry in ms. `0` expires immediately. |
| `expiryMode` | `'sliding' \| 'absolute'` | Default from the provider. |
| `autoSave` / `debounceMs` | | Default from the provider. |

| Returns | Type | Description |
|---|---|---|
| `id` | `string` | |
| `status` | `RecoveryStatus` | `idle`, `active` after a save, `failed` after a failed save (including auto-saves). |
| `error` | `Error \| null` | Last save error; cleared by the next successful save. |
| `checkpoint(data, options?)` | `Promise<JourneySnapshot<T>>` | Save. With auto-save, resolves immediately with a preview. |
| `flush()` | `Promise<void>` | Write a pending auto-save now; rejects if it fails. |
| `clear()` | `Promise<void>` | Delete the checkpoint and cancel pending auto-saves. |

`CheckpointOptions`: `exclude?: string[]` (top-level keys or dot paths such as `'payment.cardNumber'`; paths pass through arrays), `expiry?: number`, `completed?: boolean`.

---

## useRecovery

```ts
function useRecovery<T>(journeyId: string, options?: { autoRestore?: boolean }): RecoveryState<T>
```

Checks storage on mount.

| Returns | Type | Description |
|---|---|---|
| `status` | `RecoveryStatus` | Starts at `checking`. |
| `available` | `boolean` | A valid checkpoint can be restored. |
| `data` | `T \| null` | Restored data. |
| `snapshot` | `JourneySnapshot<T> \| null` | Stored snapshot; also set for `expired`, `completed` and validation failures. |
| `updatedAt` | `number \| undefined` | Last save time. |
| `error` | `Error \| null` | Why it is not available, or why restore failed. |
| `restore()` | `Promise<T>` | Migrate if needed and return the data. |
| `discard()` | `Promise<void>` | Delete the checkpoint (and any pending auto-save). |
| `refresh()` | `Promise<void>` | Re-read storage. |

State resets to `idle` when any component clears or discards the journey.

---

## useRecoveryStatus

```ts
function useRecoveryStatus(journeyId: string): RecoveryStatus
```

Runs its own check, so each use reads storage once on mount.

---

## useJourneyForm

```ts
function useJourneyForm<T>(journeyId: string, form: FormLike<T>, options?: UseJourneyFormOptions<T>): JourneyFormHandle<T>
```

| Option | Default | Description |
|---|---|---|
| `autoSave` | `true` | Debounce saves triggered by `watch`. |
| `debounceMs` | `500` | |
| `autoRestore` | `false` | Load saved values into the form as soon as they are found. |
| `onRestored` | | Called after values are loaded. |
| `exclude` / `expiry` | | Passed to every save. |
| `journey` | | `version`, `migrate`, `validate`, `expiryMode` for the journey. |

Returns `journeyId`, `hasSavedProgress`, `status`, `restoreToForm()`, `clearForm()`, `checkpointForm()`.

`FormLike`: `watch(callback)` returning an unsubscribe function or `{ unsubscribe }`, `getValues()`, `reset(values?)`.

---

## useRecoveryContext

Returns `{ storage, journeyManager, recoveryManager, lifecycleManager, defaultExpiry, expiryMode, autoSave, debounceMs }`. Throws outside the provider.

---

## Storage adapters

```ts
interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys?(): Promise<string[]>; // enables clearAllJourneys / clearUserJourneys
}
```

| Adapter | Constructor | Notes |
|---|---|---|
| `AsyncStorageAdapter` | `new AsyncStorageAdapter(AsyncStorage)` | |
| `MMKVStorageAdapter` | `new MMKVStorageAdapter(mmkv)` | Any object with `getString`, `set`, `delete`, optional `getAllKeys`. |
| `SecureStoreAdapter` | `new SecureStoreAdapter(SecureStore, { chunkSize?, storeOptions?, trackKeys? })` | Encodes keys into SecureStore's alphabet; chunks values over `chunkSize` UTF-8 bytes (default 1800); switches to a new chunk set only after it is fully written and removes old chunks; keeps a key index (`trackKeys`, default true) so `getAllKeys` works. |
| `MemoryStorageAdapter` | `new MemoryStorageAdapter()` | Extra `clear()` for tests. |

Adapter errors are wrapped in `JourneyRecoveryError` with code `STORAGE_UNAVAILABLE`.

---

## Core engine

Use without React:

```ts
const checkpoints = new CheckpointManager(storage, { userId, maxSizeBytes, transform });
const journeys = new JourneyManager(checkpoints);
const lifecycle = new LifecycleManager(journeys);
const recovery = new RecoveryManager(journeys, lifecycle);
```

**JourneyManager** — `registerJourney(id, options?, { allowDuplicate? })`, `checkpoint(id, data, options?)`, `getMigratedSnapshot(id)`, `flushPending(id?)`, `clearJourney(id)`, `clearAllJourneys()`, `getJourneyState(id)`, `addEventSink(fn)`, `getRegistry()`, `getCheckpointManager()`.

**RecoveryManager** — `check(id)` → `{ available, status, snapshot, error? }`, `restore(id)`, `discard(id)`, `getDiagnostics(id)`.

**CheckpointManager** — `save(id, data, { version, expiry?, expiryMode?, expiresAt? }, options?)`, `get(id)`, `getRaw(id)`, `delete(id)`, `clearUserJourneys(userId?)`, `deleteAll()`, `getKey(id, userId?)`. Ids are escaped so `:` cannot cross user or journey boundaries.

**LifecycleManager** — `subscribe(fn)`, `on(status | 'all', fn)`, `onEvent(type | type[], fn)`, `emit(event)`, `flush(id?)`, `attach(journeyManager)`.

Lower level: `SnapshotSerializer`, `SnapshotValidator`, `JourneyRegistry`, `computeChecksum`, `debounce`, `encodeSecureStoreKey`, `VERSION`.

---

## Lifecycle events

```ts
interface RecoveryEvent<T = unknown> {
  journeyId: string;
  type: 'saved' | 'save_failed' | 'cleared' | 'discarded' | 'restored' | 'migrated' | 'expired' | 'invalid' | 'completed';
  status: RecoveryStatus;
  snapshot?: JourneySnapshot<T> | null; // data only on `restored`
  error?: JourneyRecoveryError;
  fromVersion?: number;                 // on `migrated`
  timestamp: number;
}
```

`expired`, `invalid` and `completed` are emitted when a check finds them.

---

## Diagnostics

`recoveryManager.getDiagnostics(id)` or `getRecoveryDiagnostics(journeyManager, id)` returns `exists`, `status`, `isRecoverable`, `validationError`, `schemaVersion`, `targetSchemaVersion`, `isEligibleForMigration`, `createdAt`, `updatedAt`, `expiresAt`, `isExpired`, `timeUntilExpiryMs`, `payloadSizeBytes`, `hasChecksum`, `checksumValid`, `formatVersion`, `snapshot`. The report includes your data.

---

## Testing

```ts
const env = createTestRecoveryEnvironment(options?);       // sync
const env = await initTestRecoveryEnvironment({ initialCheckpoints }); // async, seeds data
```

Returns `wrapper`, `storage` (`MemoryStorageAdapter`), `seedCheckpoint(id, data, metadata?)` and the engine instances. Options accept every provider option plus `maxSizeBytes`, `transform` and `initialCheckpoints`.

---

## Types

```ts
type RecoveryStatus =
  | 'idle' | 'checking' | 'available' | 'active' | 'restoring' | 'restored'
  | 'discarded' | 'expired' | 'invalid' | 'completed' | 'failed';

interface JourneySnapshot<T = unknown> {
  id: string; version: number; createdAt: number; updatedAt: number;
  expiresAt?: number; status: 'active' | 'completed'; data: T; checksum?: string;
}

interface SnapshotTransform {
  encode(serialized: string): string | Promise<string>;
  decode(stored: string): string | Promise<string>; // throw to reject the stored value
}
```

### Other exported types

| Type | Description |
|---|---|
| `ExpiryMode` | 'sliding' \| 'absolute' |
| `RecoveryEventType` | The type field of RecoveryEvent. |
| `JourneyErrorCode` | Union of JourneyRecoveryError codes. |
| `UseRecoveryOptions` | { autoRestore?: boolean } |
| `RecoveryProviderProps` · `RecoveryProviderOptions` | Provider props and options. |
| `RecoveryContext` · `RecoveryContextValue` | The React context object and its value (prefer useRecoveryContext). |
| `JourneyState` | { status, error } from JourneyManager.getJourneyState(). |
| `JourneyEventSink` · `RecoveryEventListener` | Event listener signatures for addEventSink() and subscribe(). |
| `RegisterOptions` | { allowDuplicate?: boolean } for registerJourney(). |
| `CheckpointSaveMetadata` | { version, expiry?, expiryMode?, expiresAt? } for CheckpointManager.save(). |
| `CheckpointManagerOptions` | { userId?, maxSizeBytes?, transform? } |
| `SnapshotSerializerOptions` | { maxSizeBytes?, formatVersion? } |
| `ValidationResult` | Result of SnapshotValidator.validate(). |
| `JourneyDiagnostics` | Report returned by getDiagnostics(). |
| `RecoveryInspectionResult` | Result of RecoveryManager.check(). |
| `AsyncStorageLike` · `MMKVLike` · `SecureStoreLike` | Minimal client shapes accepted by the adapters. |
| `SecureStoreOptions` · `SecureStoreAdapterOptions` | SecureStore call options and adapter options (chunkSize, storeOptions, trackKeys). |
| `TestRecoveryEnvironment` · `TestRecoveryEnvironmentOptions` | Return value and options of the test environment factories. |
| `DebouncedFunction` | Return type of debounce(), with flush() and cancel(). |

---

## Errors

`JourneyRecoveryError` has `code`, `journeyId?` and `cause?`.

| Code | Raised when |
|---|---|
| `JOURNEY_NOT_FOUND` | `restore()` with nothing restorable. |
| `JOURNEY_EXPIRED` | The checkpoint's `expiresAt` has passed. |
| `SNAPSHOT_INVALID` | Bad structure or version, `validate` returned false or threw, or the snapshot is newer than the registered version. |
| `SNAPSHOT_CORRUPTED` | Unparseable JSON, checksum mismatch, missing SecureStore chunk, or `transform.decode` threw. |
| `MIGRATION_FAILED` | Older version without `migrate`, `migrate` threw, or migrated data failed `validate`. |
| `STORAGE_UNAVAILABLE` | The storage backend failed. |
| `SERIALIZATION_FAILED` | Not serializable, or over `maxSizeBytes`. |
| `JOURNEY_ALREADY_ACTIVE` | `registerJourney` twice without `allowDuplicate` (hooks always allow). |
| `RECOVERY_CANCELLED` | Reserved. |
