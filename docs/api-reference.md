# API Reference: react-native-journey-recovery

Complete API documentation for `react-native-journey-recovery`.

---

## 1. Provider & Context

### `<RecoveryProvider />`
Root provider component that initializes and shares the journey recovery engine context across the component tree.

```tsx
<RecoveryProvider
  storage={storage}
  options={{
    defaultExpiry: 24 * 60 * 60 * 1000, // 24 hours
    autoSave: true,
    debounceMs: 500,
    userId: 'user_123',
    flushOnBackground: true,
    appState: AppState,
    enableHistory: true,
    maxHistory: 5,
  }}
  onRecovery={(event) => {
    console.log(`[Journey ${event.journeyId}] ${event.status}`);
  }}
>
  <AppNavigator />
</RecoveryProvider>
```

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `storage` | `StorageAdapter` | **Required** | The storage adapter instance (`AsyncStorageAdapter`, `MMKVStorageAdapter`, `MemoryStorageAdapter`, or custom). |
| `options.defaultExpiry` | `number` | `undefined` | Default lifetime in milliseconds before saved checkpoints expire. |
| `options.autoSave` | `boolean` | `false` | Enable automatic debounced checkpoint saving across journeys by default. |
| `options.debounceMs` | `number` | `500` | Delay in milliseconds for auto-save debouncing. |
| `options.userId` | `string` | `undefined` | User identity identifier to namespace checkpoints on shared devices (`@rn_journey:u:<userId>:<journeyId>`). |
| `options.flushOnBackground` | `boolean` | `true` | When true and `appState` is provided, automatically flushes pending debounced writes when app transitions to background or inactive. |
| `options.appState` | `AppStateLike` | `undefined` | React Native `AppState` instance for listening to process background transitions. |
| `options.enableHistory` | `boolean` | `false` | When true, maintains a chronological stack of checkpoints for each journey. |
| `options.maxHistory` | `number` | `10` | Maximum number of historical snapshots kept per journey in storage. |
| `onRecovery` | `(event: RecoveryEvent) => void` | `undefined` | Observer callback invoked during recovery lifecycle transitions (`restored`, `idle`, `expired`, etc.). |

---

## 2. Core React Hooks

### `useJourney<T>(journeyId, options)`
Registers a named journey and returns a handle for saving checkpoints and clearing state.

```tsx
const journey = useJourney<CheckoutData>('checkout', {
  version: 2,
  expiry: 12 * 60 * 60 * 1000,
  validate: (data): data is CheckoutData => Boolean(data && data.cartItems),
  migrate: (oldData: any, oldVersion: number) => {
    if (oldVersion === 1) {
      return { ...oldData, currency: 'USD' };
    }
    return oldData;
  },
});
```

#### Returns: `JourneyHandle<T>`
- `id: string`: Journey identifier.
- `status: RecoveryStatus`: Current status (`'idle' | 'active' | 'failed'`).
- `checkpoint(data: T, options?: CheckpointOptions): Promise<JourneySnapshot<T>>`: Saves a checkpoint. Supports `{ exclude: string[] }` to safeguard sensitive fields.
- `clear(): Promise<void>`: Clears active checkpoint and any pending debounced writes.

---

### `useRecovery<T>(journeyId)`
Inspects storage upon mount to detect if an interrupted journey exists.

```tsx
const recovery = useRecovery<CheckoutData>('checkout');

if (recovery.available && recovery.snapshot) {
  return (
    <Banner
      onRestore={() => recovery.restore()}
      onDiscard={() => recovery.discard()}
    />
  );
}
```

#### Returns: `RecoveryState<T>`
- `available: boolean`: Whether a valid, unexpired checkpoint is available for recovery.
- `status: RecoveryStatus`: Status string (`'checking' | 'available' | 'restoring' | 'restored' | 'expired' | 'invalid' | 'failed' | 'idle'`).
- `data: T | null`: The restored data payload (populated after `restore()` succeeds).
- `snapshot: JourneySnapshot<T> | null`: Full metadata snapshot (`id`, `version`, `createdAt`, `updatedAt`, `expiresAt`, `data`).
- `updatedAt: number | undefined`: Timestamp when the checkpoint was last saved.
- `restore(): Promise<T>`: Restores data, runs schema migrations if needed, and dispatches recovery lifecycle events.
- `discard(): Promise<void>`: Deletes saved checkpoint and sets recovery state to idle.

---

### `useRecoveryStatus(journeyId)`
Lightweight hook returning only the `RecoveryStatus` of a journey.

---

## 3. Storage Adapters

All storage adapters conform to `StorageAdapter`:

```ts
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys?(): Promise<string[]>;
}
```

- **`AsyncStorageAdapter`**:
  ```ts
  import AsyncStorage from '@react-native-async-storage/async-storage';
  const storage = new AsyncStorageAdapter(AsyncStorage);
  ```
- **`MMKVStorageAdapter`**:
  ```ts
  import { MMKV } from 'react-native-mmkv';
  const mmkv = new MMKV();
  const storage = new MMKVStorageAdapter(mmkv);
  ```
- **`MemoryStorageAdapter`**:
  ```ts
  const storage = new MemoryStorageAdapter();
  ```

---

## 4. Navigation & Route Adapters

### `createNavigationAdapter(navigation)`
Adapter for `@react-navigation/native` stacks:

```ts
const adapter = createNavigationAdapter(navigation);
const navContext = adapter.getNavigationContext(); // { currentRoute, params, routeHistory }
adapter.restoreNavigation(savedContext, { resetStack: true });
```

### `createExpoRouterAdapter(router, getContext)`
Adapter for Expo Router file-based routes:

```ts
import { useRouter, usePathname, useSegments, useLocalSearchParams } from 'expo-router';

const router = useRouter();
const pathname = usePathname();
const segments = useSegments();
const params = useLocalSearchParams();

const adapter = createExpoRouterAdapter(router, () => ({ pathname, segments, params }));
adapter.restoreRoute(savedRouteContext, { mode: 'replace' });
```

---

## 5. Form & State Integrations

### `useJourneyForm(journeyId, form, options)`
Integration with React Hook Form:

```tsx
import { useForm } from 'react-hook-form';
import { useJourneyForm } from 'react-native-journey-recovery';

const form = useForm<ProfileFormData>();
const { hasSavedProgress, restoreToForm, clearForm } = useJourneyForm('profile-flow', form, {
  autoSave: true,
  debounceMs: 500,
  exclude: ['password'],
});
```

### `useJourneyZustand(journeyId, store, selector, options)`
Connects a specific slice of a Zustand store:

```tsx
const { hasSavedProgress, restoreToStore } = useJourneyZustand(
  'cart-slice',
  useAppStore,
  (state) => state.cart,
  { autoSave: true }
);
```

### `useJourneyRedux(journeyId, store, selector, options)`
Connects a specific slice of a Redux store:

```tsx
const { hasSavedProgress, restoreToRedux } = useJourneyRedux(
  'loan-slice',
  reduxStore,
  (state) => state.loanApplication,
  { autoSave: true }
);

// To restore:
await restoreToRedux((restoredSlice) => ({
  type: 'loan/setApplication',
  payload: restoredSlice,
}));
```

---

## 6. UI Components

### `<RecoveryBanner />`
Pre-built or headless banner offering users the choice to resume or start over:

```tsx
<RecoveryBanner
  journeyId="checkout"
  title="Resume your checkout?"
  onRestored={(data) => navigateToCheckout(data)}
  onDiscarded={() => console.log('Discarded')}
/>
```

Or headless with `render`:
```tsx
<RecoveryBanner
  journeyId="checkout"
  render={({ available, data, formattedLastSaved, onRestore, onDiscard }) =>
    available ? (
      <View>
        <Text>Resume order from {formattedLastSaved}?</Text>
        <Button title="Resume" onPress={onRestore} />
        <Button title="Discard" onPress={onDiscard} />
      </View>
    ) : null
  }
/>
```

---

## 7. Error Codes

| Code | Meaning |
|---|---|
| `JOURNEY_NOT_FOUND` | No checkpoint found for the specified journey ID |
| `JOURNEY_EXPIRED` | Checkpoint has exceeded its configured expiration |
| `SNAPSHOT_INVALID` | Checkpoint failed structural or custom validation |
| `SNAPSHOT_CORRUPTED` | Malformed JSON or FNV-1a checksum mismatch |
| `MIGRATION_FAILED` | Checkpoint schema could not be migrated |
| `STORAGE_UNAVAILABLE` | Underlying storage provider failed or threw |
| `SERIALIZATION_FAILED` | Circular data structure or payload exceeded byte size limits |
| `JOURNEY_ALREADY_ACTIVE` | Duplicate journey registration |
| `RECOVERY_CANCELLED` | Recovery was cancelled |
