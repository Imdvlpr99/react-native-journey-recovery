import React from 'react';
import { CodeBlock, CodeTabs } from '../../components/CodeBlock';
import { Callout, DocLink, H2, H3, Step, Steps, Table } from '../../components/Prose';
import { playgroundHref } from '../../lib/router';
import { PACKAGE_NAME } from '../../lib/site';

/* ================================================================== */
export const Overview: React.FC = () => (
  <>
    <p>
      <code>{PACKAGE_NAME}</code> saves the progress of multi-step flows in React Native and Expo apps, and
      restores it after the app is killed, crashes, or the user walks away. You name the flow, save
      checkpoints as the user moves through it, and decide on the next launch whether to resume or start over.
    </p>

    <H2 id="the-problem">The problem</H2>
    <p>Long flows get interrupted all the time:</p>
    <ul>
      <li>The OS reclaims memory and kills the app in the background, without running any JavaScript cleanup.</li>
      <li>The user switches apps to copy a one-time code from SMS or an authenticator, and the app reloads.</li>
      <li>The app crashes, the battery dies, or the device restarts.</li>
    </ul>
    <p>
      The usual fix is to persist the whole global store. That writes far more than you need, can put
      passwords and tokens on disk, and restores state that no longer matches the server.
    </p>

    <H2 id="what-it-does">What the library does</H2>
    <p>It gives each flow, called a <em>journey</em>, its own recovery record with explicit rules:</p>
    <ul>
      <li><strong>Named journeys.</strong> <code>useJourney('checkout')</code> owns one record, independent of your state manager.</li>
      <li><strong>Ordered writes.</strong> Saves to the same journey run one at a time, so a slow write never overwrites a newer one.</li>
      <li><strong>Integrity checks.</strong> Every snapshot carries a checksum. Corrupted data is reported as <code>invalid</code>, not restored.</li>
      <li><strong>Expiry.</strong> Old progress expires after a time you set, per app, per journey, or per checkpoint.</li>
      <li><strong>Schema migration.</strong> Bump a version number and provide <code>migrate()</code>; old snapshots are upgraded on restore.</li>
      <li><strong>Field exclusion.</strong> Drop sensitive keys before anything is written.</li>
      <li><strong>User scoping.</strong> Records are namespaced per user on shared devices.</li>
      <li><strong>Pluggable storage.</strong> AsyncStorage, MMKV, Expo SecureStore, in-memory, or your own adapter.</li>
      <li><strong>Observable.</strong> Typed lifecycle events and an <code>onError</code> callback, so a failed background save is never silent.</li>
    </ul>

    <H2 id="when-to-use">When to use it</H2>
    <p>
      Use it for flows where losing progress costs the user real effort: onboarding and KYC, checkout,
      loan or insurance applications, booking flows, long forms and surveys.
    </p>
    <p>It is not the right tool for:</p>
    <ul>
      <li><strong>App-wide state persistence.</strong> Use your state manager's persistence for that.</li>
      <li><strong>The source of truth.</strong> A restored checkpoint is UI progress. Confirm anything that matters, such as payment or submission status, with your backend.</li>
      <li><strong>Secrets.</strong> Exclude card numbers, passwords and tokens, even when using encrypted storage.</li>
    </ul>

    <H2 id="next-steps">Next steps</H2>
    <ul>
      <li><DocLink to="installation">Install the package</DocLink> and a storage backend.</li>
      <li>Follow the <DocLink to="quickstart">quickstart</DocLink> to checkpoint and restore a checkout flow.</li>
      <li>Try the <a href={playgroundHref()}>live playground</a>: a React Native app running in your browser.</li>
      <li>Read <DocLink to="recovery-lifecycle">the recovery lifecycle</DocLink> to understand each status.</li>
    </ul>
  </>
);

/* ================================================================== */
export const Installation: React.FC = () => (
  <>
    <CodeTabs
      tabs={[
        { label: 'npm', lang: 'bash', code: `npm install ${PACKAGE_NAME}` },
        { label: 'yarn', lang: 'bash', code: `yarn add ${PACKAGE_NAME}` },
        { label: 'pnpm', lang: 'bash', code: `pnpm add ${PACKAGE_NAME}` },
        { label: 'expo', lang: 'bash', code: `npx expo install ${PACKAGE_NAME}` },
      ]}
    />

    <H2 id="requirements">Requirements</H2>
    <ul>
      <li><code>react</code> 18 or later (peer dependency).</li>
      <li>TypeScript is optional. Type definitions ship with the package.</li>
      <li>No native code. Works in bare React Native and Expo, including Expo Go.</li>
    </ul>

    <H2 id="storage-backend">Choose a storage backend</H2>
    <p>
      The library does not import any storage package. Each adapter wraps a client you pass in, so you install
      only the backend you use.
    </p>
    <Table
      caption="Storage backends"
      head={['Backend', 'Install', 'Adapter']}
      rows={[
        [
          'AsyncStorage',
          <code>npm install @react-native-async-storage/async-storage</code>,
          <code>AsyncStorageAdapter</code>,
        ],
        ['MMKV', <code>npm install react-native-mmkv</code>, <code>MMKVStorageAdapter</code>],
        ['Expo SecureStore', <code>npx expo install expo-secure-store</code>, <code>SecureStoreAdapter</code>],
        ['In-memory', 'Nothing to install', <code>MemoryStorageAdapter</code>],
      ]}
    />
    <p>
      Not sure? Start with AsyncStorage. See <DocLink to="storage-adapters">storage adapters</DocLink> for the
      trade-offs.
    </p>

    <H2 id="imports">Imports</H2>
    <p>Everything is exported from the package root:</p>
    <CodeBlock
      lang="ts"
      code={`
import {
  RecoveryProvider,
  useJourney,
  useRecovery,
  AsyncStorageAdapter,
  JourneyRecoveryError,
} from '${PACKAGE_NAME}';
`}
    />
  </>
);

/* ================================================================== */
export const Quickstart: React.FC = () => (
  <>
    <p>
      This guide saves a three-step checkout (shipping, payment, review) and offers to resume it on the next
      launch. It takes about five minutes.
    </p>

    <Steps>
      <Step title="Wrap your app in RecoveryProvider" id="provider">
        <p>
          Create the storage adapter once, outside any component, and pass it to the provider. Passing{' '}
          <code>AppState</code> lets the library write pending saves when the app goes to the background, and{' '}
          <code>onError</code> tells you if a save ever fails.
        </p>
        <CodeBlock
          title="App.tsx"
          code={`
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { RecoveryProvider, AsyncStorageAdapter } from '${PACKAGE_NAME}';

const storage = new AsyncStorageAdapter(AsyncStorage);

export default function App() {
  return (
    <RecoveryProvider
      storage={storage}
      options={{
        appState: AppState,
        autoSave: true,
        debounceMs: 400,
        defaultExpiry: 24 * 60 * 60 * 1000, // 24 hours
      }}
      onError={(error, journeyId) => reportError(error, { journeyId })}
    >
      <RootNavigator />
    </RecoveryProvider>
  );
}
`}
        />
      </Step>

      <Step title="Save checkpoints as the user progresses" id="checkpoint">
        <p>
          Call <code>checkpoint()</code> with the data you need to rebuild the screen. Each call replaces the
          previous checkpoint for that journey. With auto-save on, <code>flush()</code> makes sure it is written
          before you move on.
        </p>
        <CodeBlock
          title="ShippingScreen.tsx"
          code={`
import { useJourney } from '${PACKAGE_NAME}';

export type Checkout = {
  step: 'shipping' | 'payment' | 'review';
  address?: Address;
  shippingMethod?: 'standard' | 'express';
};

export function ShippingScreen({ navigation }) {
  const journey = useJourney<Checkout>('checkout');
  const [address, setAddress] = useState<Address>(emptyAddress);

  const onContinue = async () => {
    journey.checkpoint({ step: 'payment', address });
    await journey.flush(); // rejects if the write failed
    navigation.navigate('Payment');
  };

  return <AddressForm value={address} onChange={setAddress} onSubmit={onContinue} />;
}
`}
        />
      </Step>

      <Step title="Offer to resume on the next launch" id="restore">
        <p>
          <code>useRecovery()</code> checks storage when it mounts. While it checks, <code>status</code> is{' '}
          <code>'checking'</code>. When a valid checkpoint exists, <code>available</code> is <code>true</code>.
        </p>
        <CodeBlock
          title="CheckoutEntry.tsx"
          code={`
import { useRecovery } from '${PACKAGE_NAME}';

export function CheckoutEntry({ navigation }) {
  const recovery = useRecovery<Checkout>('checkout');

  if (recovery.status === 'checking') return <LoadingView />;

  if (recovery.available) {
    return (
      <ResumePrompt
        savedAt={recovery.updatedAt}
        onResume={async () => {
          const saved = await recovery.restore();
          navigation.replace(screenFor(saved.step), { draft: saved });
        }}
        onStartOver={() => recovery.discard()}
      />
    );
  }

  return <ShippingScreen navigation={navigation} />;
}
`}
        />
      </Step>

      <Step title="Clear the journey when it completes" id="complete">
        <p>Once the order is placed, remove the checkpoint so the user is not offered to resume it.</p>
        <CodeBlock
          code={`
const journey = useJourney<Checkout>('checkout');

const onPlaceOrder = async () => {
  await api.placeOrder(cart);
  await journey.clear();
  navigation.replace('OrderConfirmed');
};
`}
        />
      </Step>
    </Steps>

    <Callout type="warning" title="Keep the adapter stable">
      <p>
        Create the adapter at module level or with <code>useMemo</code>. A new adapter on every render rebuilds the
        recovery engine and drops pending auto-saves.
      </p>
    </Callout>

    <Callout type="tip" title="Using version, validate or migrate?">
      <p>
        Recovery checks look up the options registered by <code>useJourney</code>. Define your journey options once
        and call <code>useJourney(id, options)</code> in the component that restores as well. See{' '}
        <DocLink to="schema-migration" heading="register-before-restore">schema migration</DocLink>.
      </p>
    </Callout>

    <H3 id="whats-next">What's next</H3>
    <ul>
      <li><DocLink to="form-integration">Connect React Hook Form</DocLink> to save field values automatically.</li>
      <li><DocLink to="security-privacy">Exclude sensitive fields</DocLink> before they are written.</li>
      <li><DocLink to="testing">Test your recovery flow</DocLink> with an in-memory environment.</li>
    </ul>
  </>
);
