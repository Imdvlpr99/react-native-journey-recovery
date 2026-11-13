import React from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import { Callout, DocLink, H2, H3, PropTable, Status, Table } from '../../components/Prose';
import { PACKAGE_NAME } from '../../lib/site';

/* ================================================================== */
export const RecoveryProviderApi: React.FC = () => (
  <>
    <p>Creates the recovery engine and makes it available to the hooks. Render it once, near the root of your app.</p>
    <CodeBlock
      code={`
<RecoveryProvider storage={storage} options={options} onRecovery={onRecovery} onError={onError}>
  {children}
</RecoveryProvider>
`}
    />

    <H2 id="props">Props</H2>
    <PropTable
      rows={[
        { name: 'storage', type: 'StorageAdapter', required: true, description: <>Where checkpoints are stored. Keep the instance stable; a new instance rebuilds the engine. See <DocLink to="storage-adapters">storage adapters</DocLink>.</> },
        { name: 'options', type: 'RecoveryProviderOptions', description: 'Engine defaults, listed below.' },
        { name: 'onRecovery', type: '(event: RecoveryEvent) => void', description: <>Called for every <DocLink to="recovery-lifecycle" heading="events">lifecycle event</DocLink>: saves, failures, restores, migrations, discards.</> },
        { name: 'onError', type: '(error: JourneyRecoveryError, journeyId: string) => void', description: 'Called when a checkpoint fails to save, including debounced auto-saves and background flushes that have no caller to receive the error.' },
        { name: 'children', type: 'ReactNode', required: true, description: 'Your app.' },
      ]}
    />

    <H2 id="options">Options</H2>
    <PropTable
      rows={[
        { name: 'autoSave', type: 'boolean', default: 'false', description: 'Default auto-save setting for every journey. Journeys can override it.' },
        { name: 'debounceMs', type: 'number', default: '500', description: 'Default auto-save debounce delay in milliseconds.' },
        { name: 'defaultExpiry', type: 'number', description: <>Default expiry in milliseconds. No expiry when unset. See <DocLink to="expiry-policies">expiry</DocLink>.</> },
        { name: 'expiryMode', type: "'sliding' | 'absolute'", default: "'sliding'", description: 'Measure expiry from the last save or from the first.' },
        { name: 'userId', type: 'string', description: <>Scopes storage keys to a user. See <DocLink to="user-scoping">user scoping</DocLink>.</> },
        { name: 'keyPrefix', type: 'string', default: "'@rn_journey:'", description: 'Prefix for every storage key.' },
        { name: 'appState', type: 'AppStateLike', description: <>React Native <code>AppState</code> or compatible. Enables flushing pending saves when the app backgrounds.</> },
        { name: 'flushOnBackground', type: 'boolean', default: 'true', description: <>Flush on <code>'background'</code> and <code>'inactive'</code>. Only applies when <code>appState</code> is set.</> },
        { name: 'maxSizeBytes', type: 'number', default: '524288', description: <>Maximum serialized snapshot size. Larger saves fail with <code>SERIALIZATION_FAILED</code>.</> },
        { name: 'transform', type: 'SnapshotTransform', description: <>Encode/decode hook around storage for encryption or HMAC signing. Keep the instance stable. See <DocLink to="security-privacy" heading="transform">security</DocLink>.</> },
      ]}
    />
    <Callout type="note">
      <p>
        The engine is rebuilt when <code>storage</code>, <code>keyPrefix</code>, <code>defaultExpiry</code>,{' '}
        <code>expiryMode</code>, <code>autoSave</code>, <code>debounceMs</code>, <code>userId</code>,{' '}
        <code>maxSizeBytes</code> or <code>transform</code> change. Passing an inline <code>options</code> object is
        fine; only the values are compared.
      </p>
    </Callout>

    <H2 id="context">useRecoveryContext</H2>
    <p>Returns the engine instances, for features the hooks do not cover. Throws when used outside the provider.</p>
    <CodeBlock
      lang="ts"
      code={`
const {
  storage,
  journeyManager,
  recoveryManager,
  lifecycleManager,
  defaultExpiry,
  expiryMode,
  autoSave,
  debounceMs,
} = useRecoveryContext();
`}
    />
  </>
);

/* ================================================================== */
export const UseJourneyApi: React.FC = () => (
  <>
    <p>Registers a journey and returns a handle to save and clear its checkpoint.</p>
    <CodeBlock lang="ts" code={`function useJourney<T>(journeyId: string, options?: JourneyOptions<T>): JourneyHandle<T>`} />

    <H2 id="parameters">Parameters</H2>
    <PropTable
      rows={[
        { name: 'journeyId', type: 'string', required: true, description: <>Stable, unique name for the flow, such as <code>'checkout'</code>.</> },
        { name: 'options.version', type: 'number', default: '1', description: <>Schema version of the data. See <DocLink to="schema-migration">schema migration</DocLink>.</> },
        { name: 'options.migrate', type: '(oldData: unknown, oldVersion: number) => T | Promise<T>', description: 'Upgrades data saved with an older version. Runs during restore().' },
        { name: 'options.validate', type: '(data: unknown) => data is T', description: <>Runs on every save (throws <code>SNAPSHOT_INVALID</code>), on checks of current-version snapshots (status <Status value="invalid" />), and on migrated data.</> },
        { name: 'options.expiry', type: 'number', default: 'provider defaultExpiry', description: <>Expiry in milliseconds. <code>0</code> expires immediately.</> },
        { name: 'options.expiryMode', type: "'sliding' | 'absolute'", default: 'provider expiryMode', description: 'Measure expiry from the last save (sliding) or the first (absolute).' },
        { name: 'options.autoSave', type: 'boolean', default: 'provider autoSave', description: 'Debounce saves for this journey.' },
        { name: 'options.debounceMs', type: 'number', default: 'provider debounceMs', description: 'Debounce delay for this journey.' },
      ]}
    />

    <H2 id="returns">Returns</H2>
    <PropTable
      rows={[
        { name: 'id', type: 'string', description: 'The journey id.' },
        { name: 'status', type: 'RecoveryStatus', description: <><Status value="idle" />, <Status value="active" /> after a checkpoint call, or <Status value="failed" /> after a failed save, including a debounced auto-save.</> },
        { name: 'error', type: 'Error | null', description: 'The last save error. Cleared by the next successful save.' },
        { name: 'checkpoint', type: '(data: T, options?: CheckpointOptions) => Promise<JourneySnapshot<T>>', description: 'Save data. With auto-save, resolves immediately with a preview snapshot.' },
        { name: 'flush', type: '() => Promise<void>', description: 'Write a pending auto-save now. Rejects if the write fails; resolves immediately when nothing is pending.' },
        { name: 'clear', type: '() => Promise<void>', description: 'Cancel pending auto-saves and delete the checkpoint. Auto-save keeps working afterwards.' },
      ]}
    />

    <H3 id="checkpoint-options">CheckpointOptions</H3>
    <PropTable
      rows={[
        { name: 'exclude', type: 'string[]', description: <>Keys or dot paths (<code>'payment.cardNumber'</code>) to leave out of storage. Paths pass through arrays. See <DocLink to="security-privacy">security</DocLink>.</> },
        { name: 'expiry', type: 'number', description: 'Expiry for this save, overriding the journey and provider.' },
        { name: 'completed', type: 'boolean', default: 'false', description: <>Store the snapshot with status <code>'completed'</code>. Completed journeys are reported as <Status value="completed" /> and not offered for resume.</> },
      ]}
    />

    <H2 id="behavior">Behavior</H2>
    <ul>
      <li>Pending auto-saves for the journey are flushed when the component unmounts.</li>
      <li>Options are compared by value, so inline objects do not re-register the journey on every render. Define <code>validate</code> and <code>migrate</code> outside the component so their identity is stable.</li>
      <li>Calling <code>useJourney</code> with the same id in several components is allowed. The most recent registration's options apply.</li>
    </ul>
  </>
);

/* ================================================================== */
export const UseRecoveryApi: React.FC = () => (
  <>
    <p>Checks storage for a journey on mount and exposes actions to restore or discard it.</p>
    <CodeBlock lang="ts" code={`function useRecovery<T>(journeyId: string, options?: UseRecoveryOptions): RecoveryState<T>`} />

    <H2 id="parameters">Parameters</H2>
    <PropTable
      rows={[
        { name: 'journeyId', type: 'string', required: true, description: 'The journey to check.' },
        { name: 'options.autoRestore', type: 'boolean', default: 'false', description: <>Restore immediately when a checkpoint is available. <code>data</code> is filled and status becomes <Status value="restored" /> without calling <code>restore()</code>.</> },
      ]}
    />

    <H2 id="returns">Returns</H2>
    <PropTable
      rows={[
        { name: 'status', type: 'RecoveryStatus', description: <>Starts at <Status value="checking" />. See <DocLink to="recovery-lifecycle" heading="statuses">statuses</DocLink>.</> },
        { name: 'available', type: 'boolean', description: 'A valid, unexpired checkpoint can be restored.' },
        { name: 'data', type: 'T | null', description: 'Restored data. null until restore() succeeds.' },
        { name: 'snapshot', type: 'JourneySnapshot<T> | null', description: 'The stored snapshot, before restore. Also set for expired, completed and invalid (but readable) checkpoints.' },
        { name: 'updatedAt', type: 'number | undefined', description: 'When the checkpoint was last saved. Handy for "Saved 5 minutes ago".' },
        { name: 'error', type: 'Error | null', description: <>Why the checkpoint is not available or why restore failed. Usually a <DocLink to="errors">JourneyRecoveryError</DocLink>.</> },
        { name: 'restore', type: '() => Promise<T>', description: 'Validate, migrate if needed, and return the data. Throws when not available.' },
        { name: 'discard', type: '() => Promise<void>', description: <>Delete the checkpoint, cancel any pending auto-save, and reset state to <Status value="idle" />.</> },
        { name: 'refresh', type: '() => Promise<void>', description: <>Re-read storage, for example after a <Status value="failed" /> read.</> },
      ]}
    />

    <H2 id="example">Example</H2>
    <CodeBlock
      code={`
const recovery = useRecovery<Draft>('post-draft');

switch (recovery.status) {
  case 'checking':
    return <Skeleton />;
  case 'available':
    return <ResumeCard savedAt={recovery.updatedAt} onResume={recovery.restore} onDiscard={recovery.discard} />;
  case 'expired':
  case 'invalid':
    return <Notice text="We couldn't restore your draft." onClose={recovery.discard} />;
  case 'failed':
    return <Notice text="Couldn't read saved drafts." onRetry={recovery.refresh} />;
  default:
    return <Editor initial={recovery.data ?? emptyDraft} />;
}
`}
    />
    <Callout type="note">
      <p>
        The check runs once per mount and when <code>journeyId</code> changes. It does not re-run after a
        checkpoint is saved in the same session, so a resume prompt never appears mid-flow; call{' '}
        <code>refresh()</code> to re-read. When any component clears or discards the journey, the state resets to{' '}
        <Status value="idle" />.
      </p>
    </Callout>
  </>
);

/* ================================================================== */
export const UseRecoveryStatusApi: React.FC = () => (
  <>
    <p>Returns only the recovery status of a journey. Use it for badges and conditional UI.</p>
    <CodeBlock lang="ts" code={`function useRecoveryStatus(journeyId: string): RecoveryStatus`} />
    <CodeBlock
      code={`
function CheckoutTab() {
  const status = useRecoveryStatus('checkout');
  return <Tab label="Cart" badge={status === 'available' ? 'Resume' : undefined} />;
}
`}
    />
    <Callout type="note">
      <p>
        It runs its own check with <code>useRecovery</code> internally, so each use reads storage once on mount.
      </p>
    </Callout>
  </>
);

/* ================================================================== */
export const UseJourneyFormApi: React.FC = () => (
  <>
    <p>Connects a form instance to a journey. See the <DocLink to="form-integration">forms guide</DocLink> for usage.</p>
    <CodeBlock
      lang="ts"
      code={`
function useJourneyForm<T extends Record<string, any>>(
  journeyId: string,
  form: FormLike<T>,
  options?: UseJourneyFormOptions,
): JourneyFormHandle<T>
`}
    />

    <H2 id="form-like">FormLike</H2>
    <CodeBlock
      lang="ts"
      code={`
interface FormLike<T> {
  watch: (callback: (values: T) => void) => { unsubscribe?: () => void } | (() => void);
  getValues: () => T;
  reset: (values?: Partial<T>) => void;
}
`}
    />

    <H2 id="options">Options</H2>
    <PropTable
      rows={[
        { name: 'autoSave', type: 'boolean', default: 'true', description: 'Debounce saves triggered by watch.' },
        { name: 'debounceMs', type: 'number', default: '500', description: 'Debounce delay in milliseconds.' },
        { name: 'autoRestore', type: 'boolean', default: 'false', description: 'Load saved values into the form as soon as they are found.' },
        { name: 'onRestored', type: '(values) => void', description: 'Called after values are loaded into the form.' },
        { name: 'exclude', type: 'string[]', description: 'Field names or dot paths to leave out of storage.' },
        { name: 'expiry', type: 'number', description: 'Expiry in milliseconds for each save.' },
        { name: 'journey', type: 'JourneyOptions', description: 'version, migrate, validate and expiryMode for the journey.' },
      ]}
    />

    <H2 id="returns">Returns</H2>
    <PropTable
      rows={[
        { name: 'journeyId', type: 'string', description: 'The journey id.' },
        { name: 'hasSavedProgress', type: 'boolean', description: 'A valid checkpoint is available.' },
        { name: 'status', type: 'RecoveryStatus', description: 'Recovery status.' },
        { name: 'restoreToForm', type: '() => Promise<T>', description: 'Restore and reset the form with the saved values.' },
        { name: 'clearForm', type: '() => Promise<void>', description: 'Delete the checkpoint and reset the form.' },
        { name: 'checkpointForm', type: '() => Promise<JourneySnapshot<T>>', description: 'Save the current values with getValues().' },
      ]}
    />
  </>
);

/* ================================================================== */
export const CoreEngine: React.FC = () => (
  <>
    <p>
      The hooks wrap a set of plain classes. Use them directly for code that runs outside React, such as background
      tasks, a headless SDK, or a migration script.
    </p>

    <H2 id="standalone">Using the engine without React</H2>
    <CodeBlock
      lang="ts"
      code={`
import {
  CheckpointManager,
  JourneyManager,
  LifecycleManager,
  RecoveryManager,
  MMKVStorageAdapter,
} from '${PACKAGE_NAME}';

const checkpoints = new CheckpointManager(new MMKVStorageAdapter(mmkv), { userId: 'user_42', transform });
const journeys = new JourneyManager(checkpoints);
const lifecycle = new LifecycleManager(journeys);
const recovery = new RecoveryManager(journeys, lifecycle);

const checkout = journeys.registerJourney<Checkout>('checkout', { version: 2, migrate });
await checkout.checkpoint({ step: 'payment' });

const { available } = await recovery.check<Checkout>('checkout');
if (available) {
  const data = await recovery.restore<Checkout>('checkout');
}
`}
    />

    <H2 id="journey-manager">JourneyManager</H2>
    <Table
      caption="JourneyManager methods"
      head={['Method', 'Description']}
      rows={[
        [<code>registerJourney(id, options?, {'{ allowDuplicate }'}?)</code>, <>Register options and return a <code>JourneyHandle</code>. Registering an id twice throws <code>JOURNEY_ALREADY_ACTIVE</code> unless <code>allowDuplicate</code> is set.</>],
        [<code>checkpoint(id, data, options?)</code>, 'Validate and save immediately.'],
        [<code>getMigratedSnapshot(id)</code>, 'Read the snapshot, migrating, validating and re-saving it if its version is older.'],
        [<code>flushPending(id?)</code>, 'Write pending auto-saves for one or all journeys. Rejects with the first failure.'],
        [<code>getJourneyState(id)</code>, <>Shared save state: <code>{'{ status, error }'}</code>.</>],
        [<code>addEventSink(listener)</code>, 'Receive this engine\'s events directly. Usually you use LifecycleManager instead.'],
        [<code>clearJourney(id)</code>, 'Delete a checkpoint.'],
        [<code>clearAllJourneys()</code>, 'Delete every checkpoint under the key prefix. Needs getAllKeys.'],
        [<code>getRegistry() · getCheckpointManager()</code>, 'Access the underlying instances.'],
      ]}
    />

    <H2 id="recovery-manager">RecoveryManager</H2>
    <Table
      caption="RecoveryManager methods"
      head={['Method', 'Description']}
      rows={[
        [<code>check(id)</code>, <>Inspect without changing anything. Returns <code>{'{ available, status, snapshot, error? }'}</code> and emits <code>expired</code>, <code>invalid</code> or <code>completed</code> events.</>],
        [<code>restore(id)</code>, 'Check, migrate if needed, emit a restored event, and return the data.'],
        [<code>discard(id)</code>, 'Delete the checkpoint and emit an idle event.'],
        [<code>getDiagnostics(id)</code>, <>Return a <DocLink to="diagnostics">diagnostics report</DocLink>.</>],
      ]}
    />

    <H2 id="checkpoint-manager">CheckpointManager</H2>
    <CodeBlock lang="ts" code={`new CheckpointManager(storage, { userId?, maxSizeBytes?, transform? })`} />
    <Table
      caption="CheckpointManager methods"
      head={['Method', 'Description']}
      rows={[
        [<code>save(id, data, {'{ version, expiry?, expiryMode?, expiresAt? }'}, options?)</code>, 'Serialize and write, queued behind earlier writes for the same journey.'],
        [<code>get(id)</code>, 'Read and parse a snapshot. Throws SNAPSHOT_CORRUPTED on bad JSON.'],
        [<code>getRaw(id)</code>, 'Read the stored string.'],
        [<code>delete(id) · clear(id)</code>, 'Delete a checkpoint.'],
        [<code>clearUserJourneys(userId?)</code>, 'Delete every checkpoint for a user. Needs getAllKeys.'],
        [<code>deleteAll()</code>, 'Delete every checkpoint under the prefix. Needs getAllKeys.'],
        [<code>getKey(id, userId?)</code>, <>The storage key for a journey. <code>:</code> in ids is escaped.</>],
      ]}
    />
    <p>
      <code>maxSizeBytes</code> defaults to 512 KB. Set it here, on the provider, or in the test environment.
    </p>

    <H2 id="lifecycle-manager">LifecycleManager</H2>
    <Table
      caption="LifecycleManager methods"
      head={['Method', 'Description']}
      rows={[
        [<code>subscribe(listener)</code>, 'Listen to every event. Returns an unsubscribe function.'],
        [<code>on(status | 'all', listener)</code>, 'Listen to events with one status.'],
        [<code>onEvent(type | type[], listener)</code>, <>Listen to events by type, e.g. <code>onEvent('save_failed', report)</code>.</>],
        [<code>attach(journeyManager)</code>, 'Forward a JourneyManager\'s events to this manager. Done automatically by the constructor and RecoveryManager.'],
        [<code>emit(event)</code>, 'Send an event. Listener errors are caught and logged.'],
        [<code>flush(id?)</code>, 'Write pending auto-saves. Rejects if a write fails.'],
      ]}
    />

    <H2 id="utilities">Lower-level exports</H2>
    <Table
      caption="Other exports"
      head={['Export', 'Description']}
      rows={[
        [<code>SnapshotSerializer</code>, 'JSON encoding with exclusion, checksum and size limit.'],
        [<code>SnapshotValidator</code>, 'Structure, checksum, expiry and custom validation.'],
        [<code>JourneyRegistry</code>, 'Map of journey ids to options.'],
        [<code>getRecoveryDiagnostics()</code>, 'Diagnostics without a RecoveryManager.'],
        [<code>computeChecksum(str)</code>, '32-bit FNV-1a hash as an 8-character hex string.'],
        [<code>debounce(fn, ms)</code>, 'Debounce with flush() and cancel().'],
        [<code>encodeSecureStoreKey(key)</code>, 'The key encoding SecureStoreAdapter applies.'],
        [<code>VERSION</code>, 'Package version string.'],
      ]}
    />
  </>
);

/* ================================================================== */
export const TypesApi: React.FC = () => (
  <>
    <p>All types are exported from the package root.</p>

    <H2 id="journey-snapshot">JourneySnapshot</H2>
    <CodeBlock
      lang="ts"
      code={`
interface JourneySnapshot<T = unknown> {
  id: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  status: 'active' | 'completed';
  data: T;
  checksum?: string;
}
`}
    />

    <H2 id="journey-options">JourneyOptions</H2>
    <CodeBlock
      lang="ts"
      code={`
interface JourneyOptions<T = unknown> {
  version?: number;
  expiry?: number;
  expiryMode?: 'sliding' | 'absolute';
  validate?: (data: unknown) => data is T;
  migrate?: (oldData: unknown, oldVersion: number) => T | Promise<T>;
  autoSave?: boolean;
  debounceMs?: number;
}
`}
    />

    <H2 id="checkpoint-options">CheckpointOptions</H2>
    <CodeBlock
      lang="ts"
      code={`
interface CheckpointOptions {
  exclude?: string[];
  expiry?: number;
  completed?: boolean;
}
`}
    />

    <H2 id="journey-handle">JourneyHandle</H2>
    <CodeBlock
      lang="ts"
      code={`
interface JourneyHandle<T> {
  id: string;
  status: RecoveryStatus;
  checkpoint: (data: T, options?: CheckpointOptions) => Promise<JourneySnapshot<T>>;
  clear: () => Promise<void>;
  flush: () => Promise<void>;
  error: Error | null;
}
`}
    />

    <H2 id="recovery-status">RecoveryStatus</H2>
    <CodeBlock
      lang="ts"
      code={`
type RecoveryStatus =
  | 'idle' | 'checking' | 'available' | 'active' | 'restoring'
  | 'restored' | 'discarded' | 'expired' | 'invalid' | 'completed' | 'failed';
`}
    />

    <H2 id="recovery-state">RecoveryState</H2>
    <CodeBlock
      lang="ts"
      code={`
interface RecoveryState<T> {
  available: boolean;
  status: RecoveryStatus;
  data: T | null;
  snapshot: JourneySnapshot<T> | null;
  updatedAt?: number;
  error: Error | null;
  restore: () => Promise<T>;
  discard: () => Promise<void>;
  refresh: () => Promise<void>;
}
`}
    />

    <H2 id="recovery-event">RecoveryEvent</H2>
    <CodeBlock
      lang="ts"
      code={`
interface RecoveryEvent<T = unknown> {
  journeyId: string;
  type: 'saved' | 'save_failed' | 'cleared' | 'discarded' | 'restored'
      | 'migrated' | 'expired' | 'invalid' | 'completed';
  status: RecoveryStatus;
  snapshot?: JourneySnapshot<T> | null; // data only on 'restored'
  error?: JourneyRecoveryError;
  fromVersion?: number;                 // on 'migrated'
  timestamp: number;
}
`}
    />

    <H2 id="inspection-result">RecoveryInspectionResult</H2>
    <CodeBlock
      lang="ts"
      code={`
interface RecoveryInspectionResult<T = unknown> {
  available: boolean;
  status: RecoveryStatus;
  snapshot: JourneySnapshot<T> | null;
  error?: JourneyRecoveryError;
}
`}
    />

    <H2 id="other-types">Other exported types</H2>
    <Table
      caption="Other exported types"
      head={['Type', 'Description']}
      rows={[
        [<code>ExpiryMode</code>, "'sliding' | 'absolute'"],
        [<code>RecoveryEventType</code>, 'The type field of RecoveryEvent.'],
        [<code>JourneyErrorCode</code>, 'Union of JourneyRecoveryError codes.'],
        [<code>UseRecoveryOptions</code>, '{ autoRestore?: boolean }'],
        [<><code>RecoveryProviderProps</code> · <code>RecoveryProviderOptions</code></>, 'Provider props and options.'],
        [<><code>RecoveryContext</code> · <code>RecoveryContextValue</code></>, 'The React context object and its value (prefer useRecoveryContext).'],
        [<code>JourneyState</code>, '{ status, error } from JourneyManager.getJourneyState().'],
        [<><code>JourneyEventSink</code> · <code>RecoveryEventListener</code></>, 'Event listener signatures for addEventSink() and subscribe().'],
        [<code>RegisterOptions</code>, '{ allowDuplicate?: boolean } for registerJourney().'],
        [<code>CheckpointSaveMetadata</code>, '{ version, expiry?, expiryMode?, expiresAt? } for CheckpointManager.save().'],
        [<code>CheckpointManagerOptions</code>, '{ userId?, maxSizeBytes?, transform? }'],
        [<code>SnapshotSerializerOptions</code>, '{ maxSizeBytes?, formatVersion? }'],
        [<code>ValidationResult</code>, 'Result of SnapshotValidator.validate().'],
        [<code>JourneyDiagnostics</code>, 'Report returned by getDiagnostics().'],
        [<code>RecoveryInspectionResult</code>, 'Result of RecoveryManager.check().'],
        [<><code>AsyncStorageLike</code> · <code>MMKVLike</code> · <code>SecureStoreLike</code></>, 'Minimal client shapes accepted by the adapters.'],
        [<><code>SecureStoreOptions</code> · <code>SecureStoreAdapterOptions</code></>, 'SecureStore call options and adapter options (chunkSize, storeOptions, trackKeys).'],
        [<><code>TestRecoveryEnvironment</code> · <code>TestRecoveryEnvironmentOptions</code></>, 'Return value and options of the test environment factories.'],
        [<code>DebouncedFunction</code>, 'Return type of debounce(), with flush() and cancel().'],
      ]}
    />

    <H2 id="snapshot-transform">SnapshotTransform</H2>
    <CodeBlock
      lang="ts"
      code={`
interface SnapshotTransform {
  encode(serialized: string): string | Promise<string>;
  decode(stored: string): string | Promise<string>; // throw to reject the stored value
}
`}
    />

    <H2 id="storage-adapter">StorageAdapter</H2>
    <CodeBlock
      lang="ts"
      code={`
interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys?(): Promise<string[]>;
}
`}
    />
  </>
);

/* ================================================================== */
export const ErrorsApi: React.FC = () => (
  <>
    <p>
      Errors raised by the engine are instances of <code>JourneyRecoveryError</code>, with a machine-readable{' '}
      <code>code</code>.
    </p>
    <CodeBlock
      lang="ts"
      code={`
class JourneyRecoveryError extends Error {
  readonly code: JourneyErrorCode;
  readonly journeyId?: string;
  readonly cause?: unknown;   // underlying error, when there is one
}
`}
    />

    <H2 id="codes">Error codes</H2>
    <Table
      caption="Error codes"
      head={['Code', 'Raised when']}
      rows={[
        [<code>JOURNEY_NOT_FOUND</code>, 'restore() is called with nothing stored.'],
        [<code>JOURNEY_EXPIRED</code>, <>The checkpoint's <code>expiresAt</code> has passed.</>],
        [<code>SNAPSHOT_INVALID</code>, 'The structure or version is wrong, validate returned false or threw, or the snapshot is newer than the registered version.'],
        [<code>SNAPSHOT_CORRUPTED</code>, 'Stored JSON cannot be parsed, the checksum does not match, a SecureStore chunk is missing, or transform.decode threw.'],
        [<code>MIGRATION_FAILED</code>, 'The stored version is older and migrate is missing or throws, or the migrated data fails validate.'],
        [<code>STORAGE_UNAVAILABLE</code>, 'The storage backend threw on read, write or delete.'],
        [<code>SERIALIZATION_FAILED</code>, 'Data cannot be serialized, or exceeds the size limit (512 KB by default).'],
        [<code>JOURNEY_ALREADY_ACTIVE</code>, 'JourneyManager.registerJourney() is called twice for an id without allowDuplicate. The hooks always allow duplicates.'],
        [<code>RECOVERY_CANCELLED</code>, 'Reserved. Not raised by the current version.'],
      ]}
    />

    <H2 id="handling">Handling errors</H2>
    <CodeBlock
      code={`
import { JourneyRecoveryError } from '${PACKAGE_NAME}';

try {
  const data = await recovery.restore();
  resumeFrom(data);
} catch (err) {
  if (err instanceof JourneyRecoveryError) {
    switch (err.code) {
      case 'MIGRATION_FAILED':
        reportError(err.cause ?? err);
        await recovery.discard();
        break;
      case 'STORAGE_UNAVAILABLE':
        showRetry();
        break;
      default:
        await recovery.discard();
    }
  } else {
    throw err;
  }
}
`}
    />
    <p>
      In <code>useRecovery</code>, check-time problems do not throw. They are reported through <code>status</code>{' '}
      and <code>error</code>. Only <code>restore()</code> rejects. Save failures reach{' '}
      <code>useJourney().error</code>, <code>save_failed</code> events and the provider's <code>onError</code>.
    </p>
  </>
);
