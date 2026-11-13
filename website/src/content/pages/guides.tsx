import React from 'react';
import { CodeBlock } from '../../components/CodeBlock';
import { Callout, DocLink, H2, H3, Status, Table } from '../../components/Prose';
import { PACKAGE_NAME } from '../../lib/site';

/* ================================================================== */
export const FormIntegration: React.FC = () => (
  <>
    <p>
      <code>useJourneyForm</code> connects a form library to a journey. It saves field values as the user types and
      can load saved values back into the form. It is built for React Hook Form and works with any form object that
      has <code>watch</code>, <code>getValues</code> and <code>reset</code>.
    </p>

    <H2 id="react-hook-form">With React Hook Form</H2>
    <CodeBlock
      title="ApplicationForm.tsx"
      code={`
import { useForm } from 'react-hook-form';
import { useJourneyForm } from '${PACKAGE_NAME}';

type Application = { fullName: string; email: string; income: number; ssn: string };

export function ApplicationForm() {
  const form = useForm<Application>();

  const journey = useJourneyForm('loan-application', form, {
    exclude: ['ssn'],       // never written to storage
    debounceMs: 400,
    expiry: 2 * 60 * 60 * 1000,
  });

  return (
    <>
      {journey.hasSavedProgress && (
        <ResumeBanner
          onResume={journey.restoreToForm}
          onDismiss={journey.clearForm}
        />
      )}
      <Fields control={form.control} />
      <SubmitButton
        onPress={form.handleSubmit(async (values) => {
          await api.submit(values);
          await journey.clearForm();
        })}
      />
    </>
  );
}
`}
    />
    <p>
      Every change reported by <code>form.watch</code> is checkpointed. Auto-save is on by default, so writes are
      debounced (500 ms unless you set <code>debounceMs</code>).
    </p>

    <H2 id="auto-restore">Restoring automatically</H2>
    <p>
      Set <code>autoRestore: true</code> to load saved values into the form as soon as they are found, without asking
      the user. <code>onRestored</code> runs after every restore, which is a good place to jump to the right step.
    </p>
    <CodeBlock
      code={`
useJourneyForm('profile', form, {
  autoRestore: true,
  onRestored: (values) => setStep(values.lastStep ?? 0),
});
`}
    />

    <H2 id="versioned-forms">Versioned forms</H2>
    <p>
      Pass schema options through <code>journey</code> so saved values from older app versions are migrated before
      they reach <code>form.reset</code>:
    </p>
    <CodeBlock
      code={`
useJourneyForm('loan-application', form, {
  journey: { version: 2, migrate: migrateApplication, validate: isApplicationV2 },
});
`}
    />

    <H2 id="options">Options</H2>
    <Table
      caption="useJourneyForm options"
      head={['Option', 'Type', 'Default', 'Description']}
      rows={[
        [<code>autoSave</code>, 'boolean', <code>true</code>, 'Debounce saves.'],
        [<code>debounceMs</code>, 'number', <code>500</code>, 'Debounce delay in milliseconds.'],
        [<code>autoRestore</code>, 'boolean', <code>false</code>, 'Load saved values into the form as soon as they are found.'],
        [<code>onRestored</code>, '(values) => void', 'none', 'Called after values are loaded into the form.'],
        [<code>exclude</code>, 'string[]', 'none', 'Field names or dot paths to leave out of storage.'],
        [<code>expiry</code>, 'number', 'provider default', 'Expiry in milliseconds, applied on every save.'],
        [<code>journey</code>, 'JourneyOptions', 'none', 'version, migrate, validate and expiryMode for the journey.'],
      ]}
    />

    <H2 id="return-value">Return value</H2>
    <Table
      caption="useJourneyForm return value"
      head={['Field', 'Type', 'Description']}
      rows={[
        [<code>journeyId</code>, 'string', 'The journey id you passed.'],
        [<code>hasSavedProgress</code>, 'boolean', 'A valid checkpoint is available to restore.'],
        [<code>status</code>, 'RecoveryStatus', 'Recovery status from the underlying useRecovery.'],
        [<code>restoreToForm()</code>, 'Promise<T>', 'Restore saved values and reset the form with them.'],
        [<code>clearForm()</code>, 'Promise<void>', 'Delete the checkpoint and reset the form to its defaults.'],
        [<code>checkpointForm()</code>, 'Promise<JourneySnapshot<T>>', 'Save the current values now.'],
      ]}
    />

    <Callout type="note" title="Other form libraries">
      <p>
        Pass any object matching <code>FormLike</code>: <code>watch(callback)</code> returning an unsubscribe function
        or an object with <code>unsubscribe()</code>, plus <code>getValues()</code> and <code>reset(values?)</code>.
      </p>
    </Callout>
  </>
);

/* ================================================================== */
export const SchemaMigration: React.FC = () => (
  <>
    <p>
      App updates change the shape of your data. If a user saved progress on the old version, migration upgrades the
      checkpoint when it is restored, instead of throwing it away or crashing on unexpected fields.
    </p>

    <H2 id="versioning">Version your journey</H2>
    <p>
      Every snapshot records the <code>version</code> it was saved with (default <code>1</code>). When you change the
      shape of the data, increase <code>version</code> and provide <code>migrate</code>.
    </p>
    <CodeBlock
      title="checkoutJourney.ts"
      lang="ts"
      code={`
import type { JourneyOptions } from '${PACKAGE_NAME}';

// v1: { step, address: string }
// v2: { step, address: { line1, city, postcode } }
// v3: adds shippingMethod

export type CheckoutV3 = {
  step: 'shipping' | 'payment' | 'review';
  address: { line1: string; city: string; postcode: string };
  shippingMethod: 'standard' | 'express';
};

export const checkoutJourney: JourneyOptions<CheckoutV3> = {
  version: 3,
  migrate: (old: any, fromVersion) => {
    let data = old;
    if (fromVersion < 2) {
      data = { ...data, address: { line1: data.address, city: '', postcode: '' } };
    }
    if (fromVersion < 3) {
      data = { ...data, shippingMethod: 'standard' };
    }
    return data as CheckoutV3;
  },
};
`}
    />
    <p>
      Apply each step in sequence from the stored version, as above, so a user upgrading from v1 straight to v3 gets
      every change. <code>migrate</code> may be async.
    </p>

    <H2 id="when-it-runs">When migration runs</H2>
    <ol>
      <li><code>useRecovery</code> checks the checkpoint as usual. Migration does not run during the check.</li>
      <li>When you call <code>restore()</code>, a stored version lower than the registered version triggers <code>migrate(data, storedVersion)</code>.</li>
      <li>The migrated data is saved back at the new version and returned.</li>
    </ol>
    <Table
      caption="Migration outcomes"
      head={['Situation', 'Result']}
      rows={[
        ['Stored version equals registered version', 'Data is returned unchanged.'],
        ['Stored version is lower, migrate provided', 'migrate runs, result is saved and returned.'],
        ['Stored version is lower, no migrate', <>restore() throws <code>MIGRATION_FAILED</code>.</>],
        ['migrate throws', <>restore() throws <code>MIGRATION_FAILED</code> with the original error as <code>cause</code>.</>],
        ['Migrated data fails validate', <>restore() throws <code>MIGRATION_FAILED</code>; storage keeps the old version.</>],
        ['Stored version is newer (app rolled back)', <>The check reports <Status value="invalid" /> with <code>SNAPSHOT_INVALID</code>; nothing is restored.</>],
      ]}
    />

    <H2 id="register-before-restore">Register before you restore</H2>
    <p>
      Restore uses the options registered by <code>useJourney</code>. If the component that restores never calls{' '}
      <code>useJourney</code> with your options, the registered version is treated as <code>1</code>: a v1 checkpoint
      is returned unmigrated, and anything newer is reported as <Status value="invalid" /> with a message telling you
      to register. Share the options object and call <code>useJourney</code> next to <code>useRecovery</code>:
    </p>
    <CodeBlock
      code={`
function CheckoutEntry() {
  useJourney<CheckoutV3>('checkout', checkoutJourney); // registers version, migrate, validate
  const recovery = useRecovery<CheckoutV3>('checkout');
  // ...
}
`}
    />

    <Callout type="tip" title="validate always sees the current shape">
      <p>
        The check skips your <code>validate</code> function for older versions, so they reach <code>migrate</code>.
        The migrated data is then validated before it is saved back, so <code>validate</code> only ever needs to
        accept the newest shape.
      </p>
    </Callout>
  </>
);

/* ================================================================== */
export const ExpiryPolicies: React.FC = () => (
  <>
    <p>
      Expiry stops the app from offering to resume something the user has long forgotten, or that no longer matches
      prices, stock or regulations.
    </p>

    <H2 id="setting-expiry">Setting an expiry</H2>
    <p>Set it at three levels. The most specific one wins.</p>
    <CodeBlock
      code={`
// 1. App-wide default
<RecoveryProvider storage={storage} options={{ defaultExpiry: 24 * 60 * 60 * 1000 }}>

// 2. Per journey
useJourney('flight-booking', { expiry: 30 * 60 * 1000 });

// 3. Per checkpoint
journey.checkpoint(data, { expiry: 5 * 60 * 1000 });
`}
    />
    <Table
      caption="Expiry precedence"
      head={['Level', 'Option', 'Wins over']}
      rows={[
        ['Checkpoint', <code>checkpoint(data, {'{ expiry }'})</code>, 'journey and provider'],
        ['Journey', <code>useJourney(id, {'{ expiry }'})</code>, 'provider'],
        ['Provider', <code>options.defaultExpiry</code>, 'nothing (no expiry if unset)'],
      ]}
    />

    <H2 id="sliding">Sliding or absolute</H2>
    <p>
      By default expiry is <strong>sliding</strong>: <code>expiresAt</code> is <em>now + expiry</em> each time a
      checkpoint is written, so an active user keeps pushing it forward. Use <strong>absolute</strong> for a fixed
      deadline measured from the journey's first save, such as a fare hold or a reserved seat:
    </p>
    <CodeBlock
      code={`
useJourney('flight-booking', { expiry: 15 * 60 * 1000, expiryMode: 'absolute' });

// or as the app-wide default
<RecoveryProvider storage={storage} options={{ defaultExpiry: DAY, expiryMode: 'absolute' }}>
`}
    />
    <p>
      An expiry of <code>0</code> expires immediately. Leave it unset for no expiry. Migration keeps the original
      deadline.
    </p>

    <H2 id="handling-expired">Handling expired checkpoints</H2>
    <p>
      An expired checkpoint gives <Status value="expired" /> with a <code>JOURNEY_EXPIRED</code> error.{' '}
      <code>available</code> is <code>false</code> and <code>restore()</code> throws, but <code>snapshot</code> is still
      set, so you can explain what happened before discarding it:
    </p>
    <CodeBlock
      code={`
const recovery = useRecovery<Booking>('flight-booking');

useEffect(() => {
  if (recovery.status === 'expired') {
    toast.show('Your held fares expired. Please search again.');
    recovery.discard();
  }
}, [recovery.status]);
`}
    />
    <Callout type="note">
      <p>Expired checkpoints are not deleted automatically. They stay in storage until you call <code>discard()</code> or <code>clear()</code>.</p>
    </Callout>
  </>
);

/* ================================================================== */
export const SecurityPrivacy: React.FC = () => (
  <>
    <p>Checkpoints are written to disk. Treat them like any other data your app stores on the device.</p>

    <H2 id="exclude-fields">Exclude sensitive fields</H2>
    <p>Pass <code>exclude</code> to drop fields before the snapshot is serialized:</p>
    <CodeBlock
      code={`
await journey.checkpoint(paymentForm, {
  exclude: ['cardNumber', 'cvv', 'password'],
});
`}
    />
    <p>
      Each entry is a top-level key or a <strong>dot path</strong>. Paths pass through arrays, so{' '}
      <code>'cards.cvv'</code> removes <code>cvv</code> from every item of <code>cards</code>:
    </p>
    <CodeBlock
      code={`
await journey.checkpoint(order, {
  exclude: ['payment.cardNumber', 'payment.cvv', 'savedCards.cvv', 'password'],
});
`}
    />

    <H2 id="never-store">Never store</H2>
    <ul>
      <li>Full card numbers, CVV codes and bank credentials.</li>
      <li>Passwords, PINs and one-time codes.</li>
      <li>Access tokens, refresh tokens and session cookies.</li>
      <li>Government ID numbers, unless you use encrypted storage and have a clear need.</li>
    </ul>

    <H2 id="encryption">Encryption at rest</H2>
    <Table
      caption="Encryption by adapter"
      head={['Adapter', 'Encrypted at rest']}
      rows={[
        [<code>SecureStoreAdapter</code>, 'Yes, Keychain (iOS) or Keystore (Android).'],
        [<code>MMKVStorageAdapter</code>, 'Only if you create the MMKV instance with an encryption key.'],
        [<code>AsyncStorageAdapter</code>, 'No. Plain files or SQLite in the app sandbox.'],
      ]}
    />

    <H2 id="checksums">What checksums protect against</H2>
    <p>
      Every snapshot has an FNV-1a checksum of its data. It catches accidental corruption: partial writes, truncated
      values, or data edited by an older build. It is <strong>not</strong> a cryptographic signature. Someone with
      access to the device storage can change the data and recompute the checksum.
    </p>

    <H2 id="transform">Encryption and signing with a transform</H2>
    <p>
      For real tamper detection or encryption with your own keys, pass a <code>transform</code>. It wraps the stored
      string: <code>encode</code> runs before every write, <code>decode</code> after every read. If{' '}
      <code>decode</code> throws, the checkpoint is reported as <Status value="invalid" /> with{' '}
      <code>SNAPSHOT_CORRUPTED</code> and is never restored.
    </p>
    <CodeBlock
      title="hmacTransform.ts"
      lang="ts"
      code={`
import { createHmac, timingSafeEqual } from 'react-native-quick-crypto';
import type { SnapshotTransform } from '${PACKAGE_NAME}';

export function hmacTransform(secret: string): SnapshotTransform {
  const sign = (value: string) => createHmac('sha256', secret).update(value).digest('hex');
  return {
    encode: (serialized) => \`\${sign(serialized)}.\${serialized}\`,
    decode: (stored) => {
      const dot = stored.indexOf('.');
      const signature = stored.slice(0, dot);
      const payload = stored.slice(dot + 1);
      const expected = sign(payload);
      if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        throw new Error('Signature mismatch');
      }
      return payload;
    },
  };
}

// Keep the instance stable: create it once, not on every render.
const transform = hmacTransform(deviceSecretFromKeychain);
<RecoveryProvider storage={storage} options={{ transform }}>
`}
    />
    <p>
      Keep the secret in the Keychain or Keystore, not in your JavaScript bundle. Encoding can be async, so you can use
      AES encryption the same way.
    </p>

    <Callout type="danger" title="Restored data is untrusted input">
      <p>
        Validate restored data before you use it, and re-check anything with business impact (prices, eligibility,
        payment status) with your server.
      </p>
    </Callout>

    <H2 id="events-and-diagnostics">Events and diagnostics</H2>
    <p>
      Lifecycle events other than <code>restored</code> carry metadata only, so analytics listeners do not receive user
      input. <code>restored</code> events and diagnostics reports include your data: strip sensitive fields before
      sending them anywhere.
    </p>

    <H2 id="shared-devices">Shared devices</H2>
    <p>
      If several people can sign in on one device, scope checkpoints per user and clear them on sign-out. See{' '}
      <DocLink to="user-scoping">user scoping</DocLink>.
    </p>
  </>
);

/* ================================================================== */
export const UserScoping: React.FC = () => (
  <>
    <p>
      Pass <code>userId</code> to the provider to store checkpoints under a per-user key. One user never sees
      another user's progress, even on a shared device.
    </p>

    <CodeBlock
      code={`
function Root() {
  const { user } = useAuth();

  return (
    <RecoveryProvider storage={storage} options={{ userId: user?.id }}>
      <App />
    </RecoveryProvider>
  );
}
`}
    />
    <p>Keys gain a <code>u:&lt;userId&gt;:</code> segment:</p>
    <CodeBlock
      lang="text"
      code={`
@rn_journey:u:user_42:checkout
@rn_journey:u:user_77:checkout
`}
    />
    <p>
      Changing <code>userId</code> rebuilds the engine, so hooks below the provider start reading the new user's
      checkpoints. A <code>:</code> in a user or journey id is escaped, so ids such as <code>'a:b'</code> cannot
      collide with another user's keys.
    </p>

    <H2 id="sign-out">Clearing on sign-out</H2>
    <p>
      Remove a user's checkpoints with <code>clearUserJourneys</code> on the checkpoint manager. Get it from{' '}
      <code>useRecoveryContext()</code>:
    </p>
    <CodeBlock
      code={`
import { useRecoveryContext } from '${PACKAGE_NAME}';

function useSignOut() {
  const { journeyManager } = useRecoveryContext();

  return async (userId: string) => {
    await journeyManager.getCheckpointManager().clearUserJourneys(userId);
    await auth.signOut();
  };
}
`}
    />
    <Callout type="note">
      <p>
        <code>clearUserJourneys</code> lists keys through the adapter's <code>getAllKeys</code>. All built-in adapters
        support it; <code>SecureStoreAdapter</code> does so through its key index (<code>trackKeys</code>, on by
        default). A custom adapter without <code>getAllKeys</code> makes it a no-op.
      </p>
    </Callout>
  </>
);

/* ================================================================== */
export const AppLifecycle: React.FC = () => (
  <>
    <p>
      With auto-save, the latest changes wait in a debounce timer. If the app is killed during that window, they are
      lost. Background flushing writes them when the app leaves the foreground.
    </p>

    <H2 id="flush-on-background">Flush when the app backgrounds</H2>
    <p>
      Pass React Native's <code>AppState</code> to the provider. When it reports <code>'background'</code> or{' '}
      <code>'inactive'</code>, pending saves for every journey are written.
    </p>
    <CodeBlock
      code={`
import { AppState } from 'react-native';

<RecoveryProvider
  storage={storage}
  options={{ appState: AppState, autoSave: true, debounceMs: 400 }}
>
`}
    />
    <p>
      This is on as soon as you pass <code>appState</code>. Set <code>flushOnBackground: false</code> to turn it off.
      Any object with an <code>addEventListener('change', listener)</code> method works, which is useful in tests.
    </p>

    <H2 id="best-effort">It is best-effort</H2>
    <p>
      The OS can suspend or kill the app before an async write finishes, especially on iOS. To reduce the risk:
    </p>
    <ul>
      <li>Keep <code>debounceMs</code> short (300 to 500 ms).</li>
      <li>Save at step transitions with an immediate checkpoint and <code>await</code> it before navigating.</li>
      <li>Use MMKV for the fastest writes.</li>
    </ul>

    <H3 id="mixing-modes">Mixing immediate and debounced saves</H3>
    <p>
      Auto-save is a per-journey setting. A common pattern is two journeys: a debounced one for field edits and an
      immediate one for completed steps. Or keep auto-save off and call <code>checkpoint()</code> only at step
      boundaries.
    </p>

    <H2 id="errors">When a background save fails</H2>
    <p>
      With auto-save, <code>checkpoint()</code> resolves before the write happens, so a failed write cannot reject it.
      Failures are reported instead: <code>useJourney().status</code> becomes <Status value="failed" /> with the error
      in <code>error</code>, and the provider calls <code>onError</code>. Background and unmount flushes report the
      same way.
    </p>
    <CodeBlock
      code={`
<RecoveryProvider
  storage={storage}
  options={{ appState: AppState, autoSave: true }}
  onError={(error, journeyId) => crashReporter.record(error, { journeyId })}
>
`}
    />

    <H2 id="manual-flush">Flushing manually</H2>
    <p>
      <code>journey.flush()</code> writes a pending auto-save now and rejects if it fails. Await it before
      navigating away from a step whose data must not be lost:
    </p>
    <CodeBlock
      code={`
const journey = useJourney<Checkout>('checkout'); // auto-save on

const onContinue = async () => {
  journey.checkpoint(form);
  await journey.flush(); // throws if the write failed
  navigation.navigate('Payment');
};

// All journeys at once:
const { lifecycleManager } = useRecoveryContext();
await lifecycleManager.flush();
`}
    />
  </>
);

/* ================================================================== */
export const Diagnostics: React.FC = () => (
  <>
    <p>
      When a user reports "my progress disappeared", diagnostics explain why a checkpoint can or cannot be restored,
      without changing it.
    </p>

    <CodeBlock
      code={`
import { useRecoveryContext } from '${PACKAGE_NAME}';

function DebugJourney({ id }: { id: string }) {
  const { recoveryManager } = useRecoveryContext();
  const [report, setReport] = useState<JourneyDiagnostics | null>(null);

  useEffect(() => {
    recoveryManager.getDiagnostics(id).then(setReport);
  }, [id]);

  return <Text selectable>{JSON.stringify(report, null, 2)}</Text>;
}
`}
    />
    <p>
      Outside React, call <code>getRecoveryDiagnostics(journeyManager, journeyId)</code>.
    </p>

    <H2 id="report-fields">Report fields</H2>
    <Table
      caption="JourneyDiagnostics fields"
      head={['Field', 'Description']}
      rows={[
        [<code>exists</code>, 'A value is stored for this journey.'],
        [<code>status</code>, <>The status a check would report: <Status value="idle" />, <Status value="available" />, <Status value="expired" />, <Status value="invalid" /> or <Status value="completed" />.</>],
        [<code>isRecoverable</code>, 'restore() would succeed, migration aside.'],
        [<code>validationError</code>, 'Why it is not recoverable, in plain words.'],
        [<code>schemaVersion</code> , 'Version stored in the snapshot.'],
        [<code>targetSchemaVersion</code>, 'Version currently registered for the journey.'],
        [<code>isEligibleForMigration</code>, 'Stored version is older and a migrate function is registered.'],
        [<code>createdAt · updatedAt · expiresAt</code>, 'Timestamps from the snapshot.'],
        [<code>isExpired · timeUntilExpiryMs</code>, 'Expiry state and remaining time.'],
        [<code>payloadSizeBytes</code>, 'Size of the stored string in bytes.'],
        [<code>hasChecksum · checksumValid</code>, 'Integrity check results.'],
        [<code>formatVersion</code>, 'Internal storage format version.'],
        [<code>snapshot</code>, 'The parsed snapshot, or null.'],
      ]}
    />
    <Callout type="tip">
      <p>
        Wire diagnostics into a hidden developer menu or attach them to bug reports. They contain your checkpoint data,
        so strip sensitive fields before sending them anywhere.
      </p>
    </Callout>
  </>
);

/* ================================================================== */
export const Testing: React.FC = () => (
  <>
    <p>
      The test environment builds the full engine on in-memory storage and gives you a provider wrapper for{' '}
      <code>renderHook</code> and <code>render</code>. It works with Jest and Vitest.
    </p>

    <H2 id="hooks">Testing hooks</H2>
    <CodeBlock
      title="checkout.test.tsx"
      code={`
import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
  createTestRecoveryEnvironment,
  useJourney,
  useRecovery,
} from '${PACKAGE_NAME}';

it('restores a saved checkout', async () => {
  const env = createTestRecoveryEnvironment();
  await env.seedCheckpoint('checkout', { step: 'payment' });

  const { result } = renderHook(() => useRecovery('checkout'), { wrapper: env.wrapper });

  await waitFor(() => expect(result.current.status).toBe('available'));

  await act(async () => {
    await result.current.restore();
  });

  expect(result.current.data).toEqual({ step: 'payment' });
});
`}
    />

    <H2 id="seeding">Seeding checkpoints</H2>
    <p>
      <code>seedCheckpoint(id, data, metadata?)</code> writes a checkpoint directly. Pass{' '}
      <code>{'{ version, expiry }'}</code> as metadata to test migrations and expiry. Or seed everything up front with
      the async variant:
    </p>
    <CodeBlock
      code={`
const env = await initTestRecoveryEnvironment({
  initialCheckpoints: {
    checkout: { data: { step: 'review' } },
    onboarding: { data: { name: 'Ada' }, metadata: { version: 1 } },
  },
});
`}
    />

    <H2 id="inspecting-storage">Inspecting storage</H2>
    <p>
      <code>env.storage</code> is the <code>MemoryStorageAdapter</code> in use, so you can assert on what was written,
      for example that an excluded field never reached storage:
    </p>
    <CodeBlock
      code={`
const raw = await env.storage.getItem('@rn_journey:payment');
expect(raw).not.toContain('4242');
`}
    />

    <H2 id="environment">Environment reference</H2>
    <Table
      caption="Test environment"
      head={['Member', 'Description']}
      rows={[
        [<code>wrapper</code>, 'Provider component for render and renderHook.'],
        [<code>storage</code>, 'The MemoryStorageAdapter in use.'],
        [<code>seedCheckpoint()</code>, 'Write a checkpoint directly.'],
        [<code>checkpointManager · journeyManager · recoveryManager · lifecycleManager</code>, 'Engine instances for direct assertions.'],
      ]}
    />
    <p>
      Options (<code>TestRecoveryEnvironmentOptions</code>) accept every{' '}
      <DocLink to="recovery-provider" heading="options">provider option</DocLink>, including{' '}
      <code>maxSizeBytes</code> and <code>transform</code>, plus <code>initialCheckpoints</code> (async variant only).
      Both functions return a <code>TestRecoveryEnvironment</code>.
    </p>
    <Callout type="note" title="Two engines">
      <p>
        <code>wrapper</code> renders its own <code>RecoveryProvider</code> over the same storage. Seeded data is visible
        to hooks, but journeys registered through <code>env.journeyManager</code> are not. Register through hooks in
        component tests.
      </p>
    </Callout>
  </>
);

/* ================================================================== */
export const Navigation: React.FC = () => (
  <>
    <p>
      Restoring data is half the job; the user also expects to land on the screen they left. Save where they were as
      part of the checkpoint, then navigate there after <code>restore()</code>. No adapter is needed.
    </p>

    <H2 id="save-the-step">Save the step, not the navigation state</H2>
    <p>
      Store a small, stable step name rather than the router's internal state. Screen names and params change between
      app versions; a step name you control can be migrated like any other field.
    </p>
    <CodeBlock
      code={`
type Checkout = {
  step: 'shipping' | 'delivery' | 'payment' | 'review';
  address?: Address;
  delivery?: 'standard' | 'express';
};

const SCREEN_FOR_STEP: Record<Checkout['step'], keyof CheckoutStackParams> = {
  shipping: 'Shipping',
  delivery: 'Delivery',
  payment: 'Payment',
  review: 'Review',
};
`}
    />

    <H2 id="react-navigation">React Navigation</H2>
    <p>
      Rebuild the stack with <code>reset</code> so Back walks through the earlier steps instead of leaving the flow:
    </p>
    <CodeBlock
      code={`
import { CommonActions } from '@react-navigation/native';

const STEPS: Checkout['step'][] = ['shipping', 'delivery', 'payment', 'review'];

async function resume(navigation, recovery) {
  const saved = await recovery.restore();
  const upTo = STEPS.slice(0, STEPS.indexOf(saved.step) + 1);

  navigation.dispatch(
    CommonActions.reset({
      index: upTo.length - 1,
      routes: upTo.map((step) => ({ name: SCREEN_FOR_STEP[step], params: { draft: saved } })),
    }),
  );
}
`}
    />

    <H2 id="expo-router">Expo Router</H2>
    <p>
      With file-based routes, map the step to a path and replace the current entry, so the resume prompt is not left
      in the history:
    </p>
    <CodeBlock
      code={`
import { router } from 'expo-router';

const PATH_FOR_STEP: Record<Checkout['step'], string> = {
  shipping: '/checkout/shipping',
  delivery: '/checkout/delivery',
  payment: '/checkout/payment',
  review: '/checkout/review',
};

async function resume(recovery) {
  const saved = await recovery.restore();
  router.replace(PATH_FOR_STEP[saved.step]);
}
`}
    />
    <p>
      Pass the restored data through your own state (a context, a store, or the journey itself) rather than URL
      params, so sensitive fields never appear in a route.
    </p>

    <Callout type="tip" title="Deep links still win">
      <p>
        If the app was opened from a deep link or notification, honour that first and offer to resume afterwards.
        Check <code>recovery.available</code> on the destination screen instead of redirecting on launch.
      </p>
    </Callout>
  </>
);
