import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AsyncStorageAdapter, type RecoveryEvent } from 'react-native-journey-recovery';
import { App as CheckoutApp } from './CheckoutApp';
import appSource from './CheckoutApp.tsx?raw';
import { createDemoStorage } from './demoStorage';
import { HOME_WALLPAPER, HomeScreen, LaunchTransition, Phone } from './Device';
import { CodeBlock } from '../components/CodeBlock';
import { ClockIcon, DangerIcon, ShieldIcon } from '../components/Icons';
import { docsHref } from '../lib/router';

const KEY = '@rn_journey:checkout';

type LogKind = 'write' | 'remove' | 'lost' | 'app' | 'recovery' | 'tamper';
interface LogEntry {
  id: number;
  at: number;
  kind: LogKind;
  text: string;
}

const LOG_TONE: Record<LogKind, string> = {
  write: 'text-accent',
  remove: 'text-fg-muted',
  lost: 'text-warn',
  app: 'text-info',
  recovery: 'text-accent',
  tamper: 'text-danger',
};

interface StoredSnapshot {
  version?: number;
  status?: string;
  updatedAt?: number;
  expiresAt?: number;
  checksum?: string;
  data?: Record<string, unknown>;
}

function parse(raw: string | null): StoredSnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSnapshot;
  } catch {
    return null;
  }
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
}

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/* ------------------------------------------------------------------ */

export const Playground: React.FC = () => {
  const demo = useMemo(() => createDemoStorage(), []);
  const storage = useMemo(() => new AsyncStorageAdapter(demo.client), [demo]);

  const [running, setRunning] = useState(true);
  const [launchId, setLaunchId] = useState(1);
  const [raw, setRaw] = useState<string | null>(() => demo.peek(KEY));
  const [log, setLog] = useState<LogEntry[]>(() => [{ id: 0, at: Date.now(), kind: 'app', text: 'App launched' }]);
  const [tab, setTab] = useState<'storage' | 'events' | 'source'>('storage');
  const [now, setNow] = useState(Date.now());
  const logId = useRef(0);
  const relaunchTimer = useRef<number | undefined>(undefined);

  const addLog = useCallback((kind: LogKind, text: string) => {
    logId.current += 1;
    const entry = { id: logId.current, at: Date.now(), kind, text };
    setLog((prev) => [entry, ...prev].slice(0, 60));
  }, []);

  useEffect(() => {
    document.title = 'Playground · journey-recovery';
    window.scrollTo(0, 0);
    return () => window.clearTimeout(relaunchTimer.current);
  }, []);

  // Watch storage.
  useEffect(
    () =>
      demo.subscribe((e) => {
        if (e.key !== KEY) return;
        setRaw(demo.peek(KEY));
        if (e.type === 'write') addLog('write', `Checkpoint written · ${e.bytes} B`);
        else if (e.type === 'remove') addLog('remove', 'Checkpoint deleted');
        else addLog('lost', 'Pending write lost: the app was killed');
      }),
    [demo, addLog]
  );

  // Tick for relative times while something is stored.
  useEffect(() => {
    if (!raw) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [raw]);

  const onRecovery = useCallback(
    (event: RecoveryEvent) => {
      // Writes are already logged from storage; show the other lifecycle events.
      if (event.type === 'saved') return;
      if (event.type === 'save_failed') addLog('tamper', `Event: save_failed (${event.error?.code ?? 'error'})`);
      else addLog('recovery', `Event: ${event.type}`);
    },
    [addLog]
  );

  const kill = useCallback(() => {
    demo.setAlive(false); // before unmount, so the unmount flush is dropped like on a real device
    setRunning(false);
    addLog('app', 'App killed');
  }, [demo, addLog]);

  const launch = useCallback(() => {
    demo.setAlive(true);
    setLaunchId((n) => n + 1);
    setRunning(true);
    addLog('app', 'App launched');
  }, [demo, addLog]);

  /** Kill, apply a change to storage, then relaunch so the app sees it on startup. */
  const tamperAndRelaunch = (mutate: (s: StoredSnapshot) => StoredSnapshot, message: string) => {
    const current = parse(demo.peek(KEY));
    if (!current) return;
    if (running) kill();
    demo.poke(KEY, JSON.stringify(mutate(current)));
    setRaw(demo.peek(KEY));
    addLog('tamper', message);
    window.clearTimeout(relaunchTimer.current);
    relaunchTimer.current = window.setTimeout(launch, 700);
  };

  const corrupt = () =>
    tamperAndRelaunch(
      (s) => ({ ...s, data: { ...s.data, city: 'Tampered City' } }),
      'Edited data.city without updating the checksum'
    );

  const expire = () => tamperAndRelaunch((s) => ({ ...s, expiresAt: Date.now() - 1000 }), 'Moved expiresAt into the past');

  const reset = () => {
    if (running) kill();
    demo.poke(KEY, null);
    setRaw(null);
    setLog([]);
    window.clearTimeout(relaunchTimer.current);
    relaunchTimer.current = window.setTimeout(launch, 300);
  };

  const snapshot = parse(raw);
  const hasData = Boolean(snapshot);

  return (
    <main id="main" className="mx-auto w-full max-w-[90rem] flex-1 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <header className="anim-enter max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">Playground</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Try it without installing anything</h1>
        <p className="mt-3 text-lg leading-relaxed text-fg-muted">
          A real React Native app running in your browser through react-native-web, using the library itself. Fill in a
          step or two, then kill the app and open it again.
        </p>
      </header>

      <div style={{ '--enter-delay': '120ms' } as React.CSSProperties} className="anim-enter mt-10 grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-14">
        {/* ---------------- Device ---------------- */}
        <div className="mx-auto w-full max-w-[380px] lg:mx-0">
          <Phone appearance={running ? 'light' : 'dark'} screenBg={running ? '#FFFFFF' : HOME_WALLPAPER}>
            {running ? (
              <LaunchTransition key={launchId}>
                <CheckoutApp storage={storage} onRecovery={onRecovery} />
              </LaunchTransition>
            ) : (
              <HomeScreen onOpen={launch} />
            )}
          </Phone>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={running ? kill : launch}
              className={`h-11 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 ${
                running ? 'bg-danger text-white dark:text-[#1f0a0a]' : 'bg-fg text-bg'
              }`}
            >
              {running ? 'Kill app' : 'Open app'}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-11 rounded-lg border border-line-strong text-sm font-medium text-fg transition-colors hover:bg-hover"
            >
              Reload page
            </button>
          </div>
          <p className="mt-3 text-center text-xs leading-relaxed text-fg-subtle">
            Storage is this browser's localStorage{demo.persistent ? '' : ' (unavailable here, using memory)'}. Writes are
            debounced by 400 ms, so a kill right after typing can lose the last change.
          </p>
        </div>

        {/* ---------------- Panel ---------------- */}
        <div className="min-w-0">
          <section aria-labelledby="scenarios-title">
            <h2 id="scenarios-title" className="text-sm font-semibold text-fg">Try a scenario</h2>
            <ol className="mt-3 space-y-2 text-[0.9375rem] text-fg-muted">
              <li><span className="font-mono text-xs text-fg-subtle">1</span>&nbsp; Enter a shipping address and continue to delivery.</li>
              <li><span className="font-mono text-xs text-fg-subtle">2</span>&nbsp; Press <strong className="font-medium text-fg">Kill app</strong>, then <strong className="font-medium text-fg">Open app</strong>. You are offered to resume.</li>
              <li><span className="font-mono text-xs text-fg-subtle">3</span>&nbsp; Type a card number and look at storage: it is never written.</li>
            </ol>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <ScenarioButton
                icon={<ShieldIcon size={16} />}
                title="Corrupt the data"
                body="Change a field behind the app's back. The checksum no longer matches."
                result="invalid"
                disabled={!hasData}
                onClick={corrupt}
              />
              <ScenarioButton
                icon={<ClockIcon size={16} />}
                title="Expire it"
                body="Move expiresAt into the past, as if 10 minutes went by."
                result="expired"
                disabled={!hasData}
                onClick={expire}
              />
              <ScenarioButton
                icon={<DangerIcon size={16} />}
                title="Reset everything"
                body="Delete the checkpoint and the event log, then relaunch."
                result="idle"
                onClick={reset}
              />
            </div>
          </section>

          <section className="mt-10" aria-label="Inspector">
            <div role="tablist" aria-label="Inspector" className="flex gap-1 border-b border-line">
              {(
                [
                  ['storage', 'Storage'],
                  ['events', `Events${log.length ? ` (${log.length})` : ''}`],
                  ['source', 'App source'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`relative -mb-px border-b-2 px-3 py-2.5 text-sm transition-colors ${
                    tab === id ? 'border-accent font-medium text-fg' : 'border-transparent text-fg-muted hover:text-fg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="pt-5">
              {tab === 'storage' && <StorageView raw={raw} snapshot={snapshot} now={now} />}
              {tab === 'events' && <EventsView log={log} />}
              {tab === 'source' && (
                <>
                  <p className="mb-4 text-sm text-fg-muted">
                    The whole app. It imports only <code className="font-mono text-fg">react-native</code> and{' '}
                    <code className="font-mono text-fg">react-native-journey-recovery</code>, so it runs unchanged on iOS
                    and Android. On web, AsyncStorage is backed by localStorage.
                  </p>
                  <div className="scroll-thin max-h-[40rem] overflow-y-auto rounded-lg">
                    <CodeBlock code={appSource} title="CheckoutApp.tsx" />
                  </div>
                </>
              )}
            </div>
          </section>

          <p className="mt-10 text-sm text-fg-muted">
            Want to build this yourself? Follow the{' '}
            <a href={docsHref('quickstart')} className="text-accent underline underline-offset-4">quickstart</a> or read
            about the <a href={docsHref('recovery-lifecycle')} className="text-accent underline underline-offset-4">recovery lifecycle</a>.
          </p>
        </div>
      </div>
    </main>
  );
};

/* ------------------------------------------------------------------ */

const ScenarioButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
  result: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, title, body, result, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex flex-col items-start rounded-xl border border-line p-4 text-left transition-colors hover:border-line-strong hover:bg-elev disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
  >
    <span className="flex items-center gap-2 text-sm font-medium text-fg">
      <span className="text-fg-muted">{icon}</span>
      {title}
    </span>
    <span className="mt-1.5 flex-1 text-[0.8125rem] leading-relaxed text-fg-muted">{body}</span>
    <span className="mt-3 font-mono text-xs text-fg-subtle">
      expect <span className="text-fg">{result}</span>
    </span>
  </button>
);

const StorageView: React.FC<{ raw: string | null; snapshot: StoredSnapshot | null; now: number }> = ({
  raw,
  snapshot,
  now,
}) => {
  if (!raw) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
        <p className="text-sm font-medium text-fg">Nothing stored yet</p>
        <p className="mt-1 text-sm text-fg-muted">Type in the app. A checkpoint appears here 400 ms after you stop.</p>
      </div>
    );
  }

  const bytes = new TextEncoder().encode(raw).length;
  const data = snapshot?.data ?? {};
  const cardExcluded = !('cardNumber' in data);
  const pretty = snapshot ? JSON.stringify(snapshot, null, 2) : raw;

  const facts: [string, React.ReactNode][] = [
    ['Key', <code className="font-mono">{KEY}</code>],
    ['Size', `${bytes} B`],
    ['Schema version', snapshot?.version ?? '—'],
    ['Saved', snapshot?.updatedAt ? `${formatDuration(now - snapshot.updatedAt)} ago` : '—'],
    [
      'Expires',
      snapshot?.expiresAt
        ? snapshot.expiresAt <= now
          ? <span className="text-warn">expired</span>
          : `in ${formatDuration(snapshot.expiresAt - now)}`
        : 'never',
    ],
    ['Checksum', <code className="font-mono">{snapshot?.checksum ?? '—'}</code>],
  ];

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {facts.map(([label, value]) => (
          <div key={label} className="bg-bg px-3 py-2.5">
            <dt className="text-xs text-fg-subtle">{label}</dt>
            <dd className="mt-0.5 truncate text-sm text-fg">{value}</dd>
          </div>
        ))}
      </dl>
      {cardExcluded && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <code className="font-mono text-fg">cardNumber</code> is not in storage. It is excluded on every checkpoint.
        </p>
      )}
      <CodeBlock code={pretty} lang="json" title="localStorage" />
    </div>
  );
};

const EventsView: React.FC<{ log: LogEntry[] }> = ({ log }) =>
  log.length === 0 ? (
    <p className="text-sm text-fg-muted">No events yet.</p>
  ) : (
    <ol className="scroll-thin max-h-[28rem] divide-y divide-line overflow-y-auto rounded-lg border border-line font-mono text-[0.8125rem]" aria-live="polite">
      {log.map((e) => (
        <li key={e.id} className="flex gap-3 px-3 py-2">
          <span className="shrink-0 text-fg-subtle">{clock(e.at)}</span>
          <span className={LOG_TONE[e.kind]}>{e.text}</span>
        </li>
      ))}
    </ol>
  );

export default Playground;
