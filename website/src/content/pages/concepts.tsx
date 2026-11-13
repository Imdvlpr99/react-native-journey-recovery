import React from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import { DocLink, H2, H3, Status, Table } from '../../components/Prose';
import { PACKAGE_NAME } from '../../lib/site';

/* ================================================================== */
export const Journeys: React.FC = () => (
  <>
    <p>
      A <strong>journey</strong> is a named, multi-step flow such as <code>'checkout'</code> or{' '}
      <code>'onboarding'</code>. A <strong>checkpoint</strong> is the data you save for that journey at a point in
      time. Storage holds one checkpoint per journey: each save replaces the previous one.
    </p>

    <H2 id="snapshot">The snapshot</H2>
    <p>Every checkpoint is stored as a snapshot with metadata around your data:</p>
    <CodeBlock
      lang="ts"
      code={`
interface JourneySnapshot<T> {
  id: string;                        // journey id, e.g. 'checkout'
  version: number;                   // schema version of data (default 1)
  createdAt: number;                 // first save, preserved across saves
  updatedAt: number;                 // last save
  expiresAt?: number;                // set when an expiry applies
  status: 'active' | 'completed';
  data: T;                           // your payload
  checksum?: string;                 // FNV-1a hash of data
}
`}
    />
    <p>
      Data is serialized with <code>JSON.stringify</code>, so keep it to plain JSON values. Dates become strings,
      and functions, class instances, <code>Map</code> and <code>Set</code> do not survive. Snapshots larger than
      512 KB are rejected with <code>SERIALIZATION_FAILED</code>.
    </p>

    <H2 id="what-to-save">What to save</H2>
    <p>Save the minimum needed to rebuild the screen the user was on:</p>
    <ul>
      <li>The current step, plus the values the user typed or picked.</li>
      <li>IDs rather than whole server objects. Refetch the objects after restoring so they are current.</li>
      <li>Never secrets. See <DocLink to="security-privacy">security and privacy</DocLink>.</li>
    </ul>

    <H2 id="immediate-vs-auto-save">Immediate saves and auto-save</H2>
    <p>
      By default, <code>checkpoint()</code> writes to storage and resolves with the stored snapshot. With{' '}
      <code>autoSave: true</code>, calls are debounced: the promise resolves straight away with an
      unsaved preview snapshot, and the last call is written once <code>debounceMs</code> passes without a new one.
    </p>
    <Table
      caption="Save modes"
      head={['', 'Immediate (default)', 'Auto-save']}
      rows={[
        ['Writes', 'Every call', 'Last call after debounceMs (default 500 ms)'],
        ['Resolves with', 'The stored snapshot, including checksum', 'A preview snapshot, before it is written'],
        ['Best for', 'Step transitions, critical data', 'Keystroke-level changes'],
      ]}
    />
    <p>
      Because the write happens later, a failed auto-save cannot reject the <code>checkpoint()</code> call. It is
      reported instead: the handle's <code>status</code> becomes <code>'failed'</code> with the error in{' '}
      <code>error</code>, a <code>save_failed</code> event is emitted, and the provider's <code>onError</code> is called.
      Call <code>await journey.flush()</code> when you need to know the write succeeded, for example before navigating.
    </p>
    <p>Pending auto-saves are written early when:</p>
    <ul>
      <li>the component that called <code>useJourney</code> unmounts;</li>
      <li>the app goes to the background, if you passed <code>appState</code> (see <DocLink to="app-lifecycle">app lifecycle</DocLink>);</li>
      <li>you call <code>journey.flush()</code> or <code>lifecycleManager.flush()</code>.</li>
    </ul>

    <H2 id="write-ordering">Write ordering</H2>
    <p>
      Writes and deletes for one journey go through a first-in, first-out queue, so a slow write can never land
      after a newer one. Different journeys write in parallel.
    </p>

    <H2 id="storage-keys">Storage keys</H2>
    <p>Each journey is stored under one key:</p>
    <CodeBlock
      lang="text"
      code={`
@rn_journey:checkout                 no userId
@rn_journey:u:user_42:checkout       with userId 'user_42'
`}
    />
    <p>
      Change the prefix with the <code>keyPrefix</code> provider option. See{' '}
      <DocLink to="user-scoping">user scoping</DocLink> for <code>userId</code>. A <code>:</code> inside a journey or
      user id is escaped (<code>%3A</code>), so an id can never reach into another user's or journey's key.
    </p>

    <H2 id="completing">Completing a journey</H2>
    <p>
      When the flow finishes, call <code>clear()</code> so the checkpoint is removed. If you would rather keep the
      final state, for example to show a receipt after a restart, save it with{' '}
      <code>checkpoint(data, {'{ completed: true }'})</code>. A completed journey is reported as{' '}
      <Status value="completed" /> and is never offered for resume; its data stays readable in{' '}
      <code>recovery.snapshot</code>.
    </p>
  </>
);

/* ================================================================== */
export const RecoveryLifecycle: React.FC = () => (
  <>
    <p>
      Every journey moves through a small set of statuses. <code>useJourney</code> reports the write side,{' '}
      <code>useRecovery</code> reports the read side.
    </p>

    <H2 id="flow">The flow</H2>
    <ol>
      <li><strong>Checkpoint.</strong> The user progresses and you save. <code>useJourney().status</code> becomes <Status value="active" />.</li>
      <li><strong>Interrupt.</strong> The app is killed or closed. The last written checkpoint stays in storage.</li>
      <li><strong>Check.</strong> On the next launch <code>useRecovery</code> mounts with <Status value="checking" /> and inspects storage.</li>
      <li><strong>Decide.</strong> The check ends in <Status value="available" />, <Status value="idle" />, <Status value="expired" />, <Status value="invalid" />, <Status value="completed" /> or <Status value="failed" />.</li>
      <li><strong>Restore or discard.</strong> <code>restore()</code> goes through <Status value="restoring" /> to <Status value="restored" />. <code>discard()</code> deletes the checkpoint and returns to <Status value="idle" />.</li>
    </ol>

    <H2 id="statuses">Statuses</H2>
    <Table
      caption="Recovery statuses"
      head={['Status', 'Reported by', 'Meaning']}
      rows={[
        [<Status value="idle" />, 'both', 'Nothing saved, or the checkpoint was cleared or discarded.'],
        [<Status value="active" />, 'useJourney', 'At least one checkpoint call has been made in this session.'],
        [<Status value="checking" />, 'useRecovery', 'Reading and validating storage. Initial value on mount.'],
        [<Status value="available" />, 'useRecovery', 'A valid, unexpired checkpoint exists and can be restored.'],
        [<Status value="expired" />, 'useRecovery', 'A checkpoint exists but its expiresAt has passed.'],
        [<Status value="invalid" />, 'useRecovery', 'The checkpoint is corrupted, fails its checksum or your validate function, or was saved by a newer schema version than the app knows.'],
        [<Status value="completed" />, 'useRecovery', 'The journey was saved with completed: true. Not offered for resume; data is in snapshot.'],
        [<Status value="restoring" />, 'useRecovery', 'restore() is running, including any migration.'],
        [<Status value="restored" />, 'useRecovery', 'Data was restored and is in recovery.data.'],
        [<Status value="failed" />, 'both', 'A save (including a debounced auto-save), a storage read, or a restore failed. See the error.'],
        [<Status value="discarded" />, 'none', 'Part of the RecoveryStatus type but not set by the current hooks. Reserved.'],
      ]}
    />

    <H2 id="validation-order">What a check validates</H2>
    <p>A stored checkpoint must pass these checks, in order, to be <Status value="available" />:</p>
    <ol>
      <li>It parses as JSON and is an object.</li>
      <li>It has a non-empty <code>id</code>, a positive integer <code>version</code>, positive <code>createdAt</code> and <code>updatedAt</code> timestamps, a <code>status</code> of <code>'active'</code> or <code>'completed'</code>, and a <code>data</code> field.</li>
      <li>Its <code>checksum</code> matches the data. A mismatch gives <code>SNAPSHOT_CORRUPTED</code>.</li>
      <li>It has not expired. Otherwise the status is <Status value="expired" /> with <code>JOURNEY_EXPIRED</code>.</li>
      <li>Your <code>validate</code> function, if registered, returns <code>true</code>. Otherwise <code>SNAPSHOT_INVALID</code>. It only runs when the stored version matches the registered one; older versions are validated after migration.</li>
      <li>Its version is not newer than the registered version. Otherwise <Status value="invalid" />.</li>
      <li>It is not marked completed. Otherwise <Status value="completed" />.</li>
    </ol>
    <p>
      Expired, invalid and completed checkpoints stay in storage until you call <code>discard()</code>, so you can tell
      the user what happened. <code>recovery.snapshot</code> is still set for them, except when the stored value could
      not be parsed at all. A storage read error gives <Status value="failed" /> with <code>STORAGE_UNAVAILABLE</code>,
      because the data may be fine; call <code>recovery.refresh()</code> to try again.
    </p>

    <H2 id="events">Lifecycle events</H2>
    <p>
      Pass <code>onRecovery</code> to the provider to observe every journey app-wide, for analytics, logging or error
      reporting. Each event has a <code>type</code>:
    </p>
    <Table
      caption="Lifecycle events"
      head={['type', 'Emitted when', 'Includes']}
      rows={[
        [<code>saved</code>, 'A checkpoint was written (immediate or auto-save)', 'snapshot metadata'],
        [<code>save_failed</code>, 'A write failed', 'error'],
        [<code>cleared</code>, 'journey.clear()', ''],
        [<code>discarded</code>, 'recovery.discard()', ''],
        [<code>restored</code>, 'restore() succeeded', 'snapshot with data'],
        [<code>migrated</code>, 'restore() upgraded an older version', 'snapshot metadata, fromVersion'],
        [<code>expired</code> , 'A check found an expired checkpoint', 'snapshot metadata, error'],
        [<code>invalid</code>, 'A check found a corrupted, invalid or too-new checkpoint', 'snapshot metadata, error'],
        [<code>completed</code>, 'A check found a completed journey', 'snapshot metadata'],
      ]}
    />
    <p>
      Only <code>restored</code> events include your data. The others carry metadata (id, version, timestamps,
      checksum), so an analytics listener cannot leak user input by accident.
    </p>
    <CodeBlock
      code={`
<RecoveryProvider
  storage={storage}
  onRecovery={(event) => {
    analytics.track('journey_' + event.type, { journey: event.journeyId });
  }}
  onError={(error, journeyId) => {
    crashReporter.record(error, { journeyId, code: error.code });
  }}
>
`}
    />
    <p>
      Outside React, use <code>lifecycleManager.onEvent('save_failed', listener)</code> or{' '}
      <code>subscribe(listener)</code>.
    </p>
  </>
);

/* ================================================================== */
export const StorageAdapters: React.FC = () => (
  <>
    <p>
      A storage adapter is a small async key-value interface. The library ships four, and you can write your own in
      a few lines.
    </p>

    <Table
      caption="Built-in adapters"
      head={['Adapter', 'Backed by', 'Encrypted', 'Lists keys', 'Use for']}
      rows={[
        [<code>AsyncStorageAdapter</code>, '@react-native-async-storage/async-storage', 'No', 'Yes', 'A sensible default'],
        [<code>MMKVStorageAdapter</code>, 'react-native-mmkv', 'Optional, via MMKV', 'Yes', 'Fast, synchronous native storage'],
        [<code>SecureStoreAdapter</code>, 'expo-secure-store', 'Yes, Keychain or Keystore', 'Yes, via its key index', 'Data that must be encrypted at rest'],
        [<code>MemoryStorageAdapter</code>, 'A Map in memory', 'n/a', 'Yes', 'Tests and previews. Lost on reload.'],
      ]}
    />
    <p>
      Errors thrown by the underlying client are wrapped in a <code>JourneyRecoveryError</code> with code{' '}
      <code>STORAGE_UNAVAILABLE</code>, with the original error in <code>cause</code>.
    </p>

    <H2 id="async-storage">AsyncStorage</H2>
    <CodeBlock
      code={`
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncStorageAdapter } from '${PACKAGE_NAME}';

const storage = new AsyncStorageAdapter(AsyncStorage);
`}
    />

    <H2 id="mmkv">MMKV</H2>
    <p>
      Pass an MMKV instance, or any object with <code>getString</code>, <code>set</code>, <code>delete</code> and
      optionally <code>getAllKeys</code>. Use a dedicated instance so clearing it cannot touch other app data.
    </p>
    <CodeBlock
      code={`
import { MMKV } from 'react-native-mmkv';
import { MMKVStorageAdapter } from '${PACKAGE_NAME}';

const mmkv = new MMKV({ id: 'journey-recovery' });
const storage = new MMKVStorageAdapter(mmkv);
`}
    />

    <H2 id="secure-store">Expo SecureStore</H2>
    <p>
      SecureStore encrypts values with the iOS Keychain or Android Keystore. It has strict rules that the adapter
      handles for you:
    </p>
    <ul>
      <li>
        <strong>Key alphabet.</strong> SecureStore only accepts <code>A–Z a–z 0–9 . - _</code>. Keys such as{' '}
        <code>@rn_journey:checkout</code> are encoded automatically.
      </li>
      <li>
        <strong>Value size.</strong> Android can reject values over 2048 bytes. Values larger than{' '}
        <code>chunkSize</code> UTF-8 bytes (default 1800) are split into chunks on character boundaries, so emoji and
        non-Latin text are safe.
      </li>
      <li>
        <strong>Safe rewrites.</strong> A new chunk set is fully written before the value switches to it, so an
        interrupted write keeps the previous checkpoint. Old chunks are then deleted, so no stale data is left in
        the keychain.
      </li>
      <li>
        <strong>Key listing.</strong> SecureStore cannot list keys, so the adapter keeps a small index of the keys it
        wrote (<code>trackKeys</code>, on by default). That makes <code>clearUserJourneys()</code> and{' '}
        <code>clearAllJourneys()</code> work.
      </li>
    </ul>
    <CodeBlock
      code={`
import * as SecureStore from 'expo-secure-store';
import { SecureStoreAdapter } from '${PACKAGE_NAME}';

const storage = new SecureStoreAdapter(SecureStore, {
  chunkSize: 1800,  // max UTF-8 bytes per stored value; 0 disables chunking
  trackKeys: true,  // keep a key index so clear-all and per-user clearing work
  storeOptions: {   // passed to every SecureStore call
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  },
});
`}
    />

    <H2 id="memory">In-memory</H2>
    <p>
      <code>MemoryStorageAdapter</code> keeps everything in a <code>Map</code>. It has an extra{' '}
      <code>clear()</code> method for test teardown. For tests, prefer the{' '}
      <DocLink to="testing">test environment</DocLink>, which sets it up for you.
    </p>

    <H2 id="custom-adapter">Writing your own adapter</H2>
    <p>Implement the <code>StorageAdapter</code> interface. <code>getItem</code> must return <code>null</code> for a missing key.</p>
    <CodeBlock
      lang="ts"
      code={`
import { StorageAdapter, JourneyRecoveryError } from '${PACKAGE_NAME}';

export class SQLiteAdapter implements StorageAdapter {
  constructor(private db: KeyValueTable) {}

  async getItem(key: string): Promise<string | null> {
    return (await this.db.get(key)) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.db.put(key, value);
    } catch (cause) {
      throw new JourneyRecoveryError('STORAGE_UNAVAILABLE', 'Write failed', undefined, cause);
    }
  }

  async removeItem(key: string): Promise<void> {
    await this.db.delete(key);
  }

  // Optional. Enables clearAllJourneys() and clearUserJourneys().
  async getAllKeys(): Promise<string[]> {
    return this.db.keys();
  }
}
`}
    />
  </>
);

/* ================================================================== */
const LAYERS: { name: string; role: string }[] = [
  { name: 'RecoveryProvider · hooks', role: 'React context. Builds the engine once per storage and options, exposes the hooks.' },
  { name: 'LifecycleManager', role: 'Event bus for recovery events. Flushes pending auto-saves.' },
  { name: 'RecoveryManager', role: 'Read path: check, restore (with migration), discard, diagnostics.' },
  { name: 'JourneyManager · JourneyRegistry', role: 'Registers journeys and their options. Validation on save, debounced auto-save, save status and events, migration.' },
  { name: 'CheckpointManager', role: 'Persistence: key naming and escaping, user scoping, per-journey write queue, optional encode/decode transform.' },
  { name: 'SnapshotSerializer · SnapshotValidator', role: 'JSON encoding, field exclusion, checksum, size limit; structural, checksum, expiry checks.' },
  { name: 'StorageAdapter', role: 'Your storage backend.' },
];

export const Architecture: React.FC = () => (
  <>
    <p>
      The engine is a stack of small classes. The React layer is a thin wrapper, so you can use the engine directly
      outside components. See <DocLink to="core-engine">core engine</DocLink>.
    </p>

    <H2 id="layers">Layers</H2>
    <ol className="!list-none !pl-0 overflow-hidden rounded-lg border border-line" aria-label="Engine layers, top to bottom">
      {LAYERS.map((layer, i) => (
        <li key={layer.name} className={`!mt-0 flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4 ${i > 0 ? 'border-t border-line' : ''} ${i === 0 ? 'bg-accent-soft' : ''}`}>
          <span className="font-mono text-[0.8125rem] text-fg sm:w-64 sm:shrink-0">{layer.name}</span>
          <span className="text-[0.9375rem] text-fg-muted">{layer.role}</span>
        </li>
      ))}
    </ol>

    <H2 id="write-path">Write path</H2>
    <ol>
      <li><code>checkpoint(data)</code> on a journey handle. With auto-save, the call is debounced first.</li>
      <li><code>JourneyManager</code> runs your <code>validate</code> function, if any. Failure throws <code>SNAPSHOT_INVALID</code>.</li>
      <li><code>CheckpointManager</code> queues the write behind earlier writes for the same journey.</li>
      <li>It reads the previous snapshot to keep <code>createdAt</code>, then computes <code>expiresAt</code>.</li>
      <li><code>SnapshotSerializer</code> drops excluded fields (including dot paths), computes the checksum and enforces the size limit.</li>
      <li>The optional <code>transform.encode</code> runs (encryption or signing), then the adapter writes the string.</li>
      <li>A <code>saved</code> or <code>save_failed</code> event is emitted.</li>
    </ol>

    <H2 id="read-path">Read path</H2>
    <ol>
      <li><code>useRecovery</code> calls <code>RecoveryManager.check()</code> on mount.</li>
      <li>The snapshot is read and parsed. Parse failures give <Status value="invalid" />.</li>
      <li><code>transform.decode</code> runs if configured; a throw means <Status value="invalid" />.</li>
      <li><code>SnapshotValidator</code> checks structure, checksum, expiry, and your <code>validate</code> function when the stored version is current. Newer versions and completed journeys are not offered.</li>
      <li><code>restore()</code> calls <code>JourneyManager.getMigratedSnapshot()</code>, which runs <code>migrate</code> if the stored version is older, validates the result, and saves it.</li>
      <li><code>LifecycleManager</code> emits a <Status value="restored" /> event.</li>
    </ol>

    <H3 id="design-choices">Design choices</H3>
    <ul>
      <li><strong>One record per journey.</strong> Restoring is predictable and storage stays small.</li>
      <li><strong>No silent fallbacks.</strong> Missing migrations, bad checksums and expired data surface as statuses and error codes.</li>
      <li><strong>No hard dependencies.</strong> Adapters accept clients through minimal interfaces.</li>
    </ul>
  </>
);
