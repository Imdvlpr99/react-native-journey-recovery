import React, { useEffect } from 'react';
import { docsHref } from '../lib/router';
import { LINKS, PACKAGE_NAME } from '../lib/site';
import { CodeTabs, CopyButton } from './CodeBlock';
import {
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  CloseIcon,
  DatabaseIcon,
  EyeOffIcon,
  PlayIcon,
  MigrateIcon,
  QueueIcon,
  RouteIcon,
  ShieldIcon,
  UsersIcon,
} from './Icons';
import { Status } from './Prose';
import { Reveal, spotlightHandlers } from './Motion';
import { RecoveryTicker } from './RecoveryTicker';

const INSTALL = `npm install ${PACKAGE_NAME}`;

const HERO_TABS = [
  {
    label: 'Checkpoint.tsx',
    code: `
const journey = useJourney<Checkout>('checkout');

async function onContinue() {
  await journey.checkpoint(
    { step: 'payment', address, items },
    { exclude: ['cardNumber'] },
  );
  navigation.navigate('Payment');
}
`,
  },
  {
    label: 'Resume.tsx',
    code: `
const recovery = useRecovery<Checkout>('checkout');

if (recovery.available) {
  return (
    <ResumePrompt
      savedAt={recovery.updatedAt}
      onResume={recovery.restore}
      onStartOver={recovery.discard}
    />
  );
}
`,
  },
  {
    label: 'App.tsx',
    code: `
const storage = new AsyncStorageAdapter(AsyncStorage);

<RecoveryProvider
  storage={storage}
  options={{ appState: AppState, defaultExpiry: DAY }}
>
  <App />
</RecoveryProvider>
`,
  },
];

const FEATURES = [
  { icon: RouteIcon, title: 'Named journeys', body: 'Each flow owns one recovery record, separate from your app state.', api: "useJourney('checkout')", page: 'journeys' },
  { icon: QueueIcon, title: 'Ordered writes', body: 'Saves to a journey run one at a time. A slow write never overwrites a newer one.', api: 'per-journey FIFO queue', page: 'journeys' },
  { icon: ShieldIcon, title: 'Integrity checks', body: 'Every snapshot is checksummed. Corrupted data is reported, not restored.', api: "status: 'invalid'", page: 'recovery-lifecycle' },
  { icon: ClockIcon, title: 'Expiry', body: 'Stale progress expires per app, per journey or per checkpoint.', api: 'defaultExpiry', page: 'expiry-policies' },
  { icon: MigrateIcon, title: 'Schema migration', body: 'Bump the version, add migrate(). Old checkpoints upgrade on restore.', api: 'migrate(old, version)', page: 'schema-migration' },
  { icon: EyeOffIcon, title: 'Field exclusion', body: 'Leave card numbers and passwords out before anything is written.', api: "exclude: ['cvv']", page: 'security-privacy' },
  { icon: UsersIcon, title: 'User scoping', body: 'Keys are namespaced per user, so shared devices never leak progress.', api: 'userId', page: 'user-scoping' },
  { icon: DatabaseIcon, title: 'Any storage', body: 'AsyncStorage, MMKV, Expo SecureStore, in-memory, or your own adapter.', api: 'StorageAdapter', page: 'storage-adapters' },
];

const STEPS = [
  { title: 'Checkpoint', body: 'Save the data needed to rebuild the current step.', statuses: ['active'] },
  { title: 'Interrupt', body: 'The app is killed, crashes, or the user leaves. The last checkpoint stays on disk.', statuses: [] },
  { title: 'Check', body: 'On the next launch, the checkpoint is parsed, checksummed, expiry-checked and validated.', statuses: ['available', 'expired', 'invalid'] },
  { title: 'Resume or discard', body: 'The user decides. Older schemas are migrated on restore.', statuses: ['restored', 'idle'] },
];

const ADAPTERS = [
  { name: 'AsyncStorageAdapter', pkg: '@react-native-async-storage/async-storage', note: 'Sensible default' },
  { name: 'MMKVStorageAdapter', pkg: 'react-native-mmkv', note: 'Fastest writes' },
  { name: 'SecureStoreAdapter', pkg: 'expo-secure-store', note: 'Encrypted, auto-chunked for Android' },
  { name: 'MemoryStorageAdapter', pkg: 'built in', note: 'Tests and previews' },
];

const InstallCommand: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex h-11 items-center gap-2 rounded-lg border border-code-line bg-code pl-4 pr-1.5 ${className}`}>
    <span className="select-none font-mono text-sm text-[#4ade80]" aria-hidden="true">$</span>
    <code className="scroll-thin min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[0.8125rem] text-[#d8dee9]">
      {INSTALL}
    </code>
    <CopyButton text={INSTALL} label="Copy install command" />
  </div>
);

const SectionHeading: React.FC<{ eyebrow: string; title: string; children?: React.ReactNode; id: string }> = ({
  eyebrow,
  title,
  children,
  id,
}) => (
  <Reveal className="max-w-2xl">
    <p className="font-mono text-xs uppercase tracking-wider text-accent">{eyebrow}</p>
    <h2 id={id} className="mt-3 text-2xl font-semibold tracking-tight text-fg sm:text-3xl [text-wrap:balance]">
      {title}
    </h2>
    {children && <p className="mt-3 text-base leading-relaxed text-fg-muted sm:text-lg">{children}</p>}
  </Reveal>
);

export const Landing: React.FC = () => {
  useEffect(() => {
    document.title = 'react-native-journey-recovery: checkpoint and restore interrupted flows';
    window.scrollTo(0, 0);
  }, []);

  return (
    <main id="main">
      {/* ---------------- Hero ---------------- */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
        />
        <div aria-hidden="true" className="anim-drift pointer-events-none absolute -top-48 left-[5%] h-[30rem] w-[30rem] rounded-full bg-accent/[0.14] blur-[110px]" />
        <div aria-hidden="true" className="anim-drift-slow pointer-events-none absolute -top-24 right-0 h-[26rem] w-[26rem] rounded-full bg-info/[0.12] blur-[110px]" />
        <div className="relative mx-auto grid max-w-[90rem] items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="min-w-0">
            <a
              href={LINKS.changelog}
              target="_blank"
              rel="noreferrer"
              style={{ '--enter-delay': '0ms' } as React.CSSProperties}
              className="anim-enter inline-flex items-center gap-2 rounded-full border border-line bg-elev py-1 pl-1 pr-3 text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono font-medium text-accent">v0.1.0</span>
              React Native · Expo · TypeScript
            </a>
            <h1
              id="hero-title"
              style={{ '--enter-delay': '90ms' } as React.CSSProperties}
              className="anim-enter mt-6 text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.025em] text-fg sm:text-6xl [text-wrap:balance]"
            >
              Never make users start over.
            </h1>
            <p style={{ '--enter-delay': '180ms' } as React.CSSProperties} className="anim-enter mt-5 max-w-xl text-lg leading-relaxed text-fg-muted [text-wrap:pretty]">
              Checkpoint multi-step flows and restore them safely after the app is killed, crashes, or the user walks
              away. Checksums, expiry and schema migration are built in.
            </p>
            <div style={{ '--enter-delay': '270ms' } as React.CSSProperties} className="anim-enter mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={docsHref('quickstart')}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-fg px-5 text-[0.9375rem] font-medium text-bg transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
              >
                Get started <ArrowRightIcon size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <a
                href="#/playground"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line-strong px-5 text-[0.9375rem] font-medium text-fg transition-colors hover:bg-hover"
              >
                <PlayIcon size={15} /> Try it live
              </a>
            </div>
            <div style={{ '--enter-delay': '360ms' } as React.CSSProperties} className="anim-enter">
              <InstallCommand className="mt-6 max-w-md" />
            </div>
          </div>

          <div style={{ '--enter-delay': '220ms' } as React.CSSProperties} className="anim-enter min-w-0 space-y-3">
            <CodeTabs tabs={HERO_TABS} className="shadow-[var(--shadow)]" />
            <RecoveryTicker />
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section aria-labelledby="features-title" className="border-b border-line">
        <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading id="features-title" eyebrow="What you get" title="A recovery layer, not another persistence plugin">
            Persisting your whole store writes too much, keeps secrets on disk and restores state that no longer
            matches the server. Journeys save only what a flow needs, with explicit rules for when it is safe to
            restore.
          </SectionHeading>

          <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body, api, page }, i) => (
              <Reveal as="li" key={title} delay={(i % 4) * 70} className="bg-bg">
                <a
                  href={docsHref(page)}
                  {...spotlightHandlers()}
                  className="group relative flex h-full flex-col overflow-hidden p-6 transition-colors hover:bg-elev"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(280px_circle_at_var(--mx,50%)_var(--my,0%),var(--accent-soft),transparent_70%)]"
                  />
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg-muted transition-[color,border-color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:border-accent/40 group-hover:text-accent">
                    <Icon size={18} />
                  </span>
                  <h3 className="relative mt-4 font-semibold text-fg">{title}</h3>
                  <p className="relative mt-1.5 flex-1 text-[0.9375rem] leading-relaxed text-fg-muted">{body}</p>
                  <code className="relative mt-4 self-start rounded border border-line bg-elev px-1.5 py-0.5 font-mono text-xs text-fg-muted">
                    {api}
                  </code>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------- Lifecycle ---------------- */}
      <section aria-labelledby="lifecycle-title" className="border-b border-line">
        <div className="mx-auto max-w-[90rem] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeading id="lifecycle-title" eyebrow="How it works" title="Four steps, every status explicit">
            Nothing is restored silently. Each outcome is a status your UI can handle.
          </SectionHeading>

          <Reveal as="ol" className="stagger relative mt-12 grid gap-8 md:grid-cols-4 md:gap-6">
            <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-px bg-line md:bottom-auto md:right-0 md:h-px md:w-auto" />
            <span aria-hidden="true" className="draw-line absolute bottom-0 left-0 top-0 w-px bg-gradient-to-b from-accent via-accent/70 to-accent/10 md:bottom-auto md:right-0 md:h-px md:w-auto md:bg-gradient-to-r" />
            {STEPS.map((step, i) => (
              <li key={step.title} style={{ '--i': i } as React.CSSProperties} className="relative pl-6 md:pl-0 md:pt-6">
                <span
                  style={{ '--dot-delay': `${250 + i * 330}ms`, animationDelay: `${i * 0.6}s` } as React.CSSProperties}
                  className="pop-dot anim-pulse absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-bg bg-accent md:-top-[5px] md:left-0"
                />
                <p className="font-mono text-xs text-fg-subtle">0{i + 1}</p>
                <h3 className="mt-1 font-semibold text-fg">{step.title}</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-fg-muted">{step.body}</p>
                {step.statuses.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {step.statuses.map((s) => <Status key={s} value={s} />)}
                  </div>
                )}
              </li>
            ))}
          </Reveal>
          <a href={docsHref('recovery-lifecycle')} className="group mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline hover:underline-offset-4">
            Read the recovery lifecycle <ArrowRightIcon size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </div>
      </section>

      {/* ---------------- Storage + scope ---------------- */}
      <section aria-labelledby="storage-title" className="border-b border-line">
        <div className="mx-auto grid max-w-[90rem] gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="min-w-0">
            <SectionHeading id="storage-title" eyebrow="Storage" title="Bring your own backend">
              Adapters wrap the client you pass in. The library has no storage dependencies of its own.
            </SectionHeading>
            <Reveal as="ul" delay={100} className="mt-8 divide-y divide-line rounded-xl border border-line">
              {ADAPTERS.map((a) => (
                <li key={a.name} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <code className="font-mono text-sm text-fg">{a.name}</code>
                    <p className="truncate font-mono text-xs text-fg-subtle">{a.pkg}</p>
                  </div>
                  <span className="text-sm text-fg-muted sm:text-right">{a.note}</span>
                </li>
              ))}
            </Reveal>
          </div>

          <div className="min-w-0">
            <SectionHeading id="scope-title" eyebrow="Scope" title="Know what it is for">
              Restored progress is UI state. Your server stays the source of truth.
            </SectionHeading>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-line p-5">
                <h3 className="text-sm font-semibold text-fg">Use it for</h3>
                <ul className="mt-3 space-y-2 text-[0.9375rem] text-fg-muted">
                  {['Onboarding and KYC', 'Checkout and booking', 'Loan and insurance applications', 'Long forms and surveys'].map((t) => (
                    <li key={t} className="flex gap-2"><CheckIcon size={16} className="mt-1 shrink-0 text-accent" />{t}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-line p-5">
                <h3 className="text-sm font-semibold text-fg">Not for</h3>
                <ul className="mt-3 space-y-2 text-[0.9375rem] text-fg-muted">
                  {['Persisting your whole store', 'Payment or submission status', 'Passwords, tokens, card data', 'Syncing between devices'].map((t) => (
                    <li key={t} className="flex gap-2"><CloseIcon size={16} className="mt-1 shrink-0 text-fg-subtle" />{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section aria-labelledby="cta-title">
        <Reveal className="mx-auto flex max-w-[90rem] flex-col items-start gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 id="cta-title" className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              Add recovery to your first flow in five minutes.
            </h2>
            <p className="mt-2 text-fg-muted">
              Install the package, wrap your app, and save a checkpoint. Or{' '}
              <a href="#/playground" className="text-accent underline underline-offset-4">try the live demo</a> first.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <InstallCommand className="sm:w-[26rem]" />
            <a
              href={docsHref('quickstart')}
              className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-fg px-5 text-[0.9375rem] font-medium text-bg transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
            >
              Read the quickstart <ArrowRightIcon size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
};
