import type React from 'react';
import { Installation, Overview, Quickstart } from './pages/getting-started';
import { Architecture, Journeys, RecoveryLifecycle, StorageAdapters } from './pages/concepts';
import {
  AppLifecycle,
  Diagnostics,
  Navigation,
  ExpiryPolicies,
  FormIntegration,
  SchemaMigration,
  SecurityPrivacy,
  Testing,
  UserScoping,
} from './pages/guides';
import {
  CoreEngine,
  ErrorsApi,
  RecoveryProviderApi,
  TypesApi,
  UseJourneyApi,
  UseJourneyFormApi,
  UseRecoveryApi,
  UseRecoveryStatusApi,
} from './pages/api';

export interface DocPage {
  id: string;
  title: string;
  /** Shorter label for the sidebar when the title is long. */
  navTitle?: string;
  description: string;
  /** Extra search terms (API names, synonyms). */
  keywords: string[];
  /** Render the sidebar label in monospace (API symbols). */
  code?: boolean;
  Component: React.FC;
}

export interface DocGroup {
  title: string;
  pages: DocPage[];
}

export const DOC_GROUPS: DocGroup[] = [
  {
    title: 'Getting started',
    pages: [
      { id: 'overview', title: 'Introduction', description: 'What the library does, the problem it solves, and when to use it.', keywords: ['why', 'about', 'features'], Component: Overview },
      { id: 'installation', title: 'Installation', description: 'Install the package and choose a storage backend.', keywords: ['npm', 'yarn', 'pnpm', 'expo', 'setup', 'requirements'], Component: Installation },
      { id: 'quickstart', title: 'Quickstart', description: 'Checkpoint a checkout flow and offer to resume it, in four steps.', keywords: ['tutorial', 'example', 'getting started', 'checkout'], Component: Quickstart },
    ],
  },
  {
    title: 'Core concepts',
    pages: [
      { id: 'journeys', title: 'Journeys and checkpoints', description: 'What gets stored, when it is written, and how writes are ordered.', keywords: ['snapshot', 'auto-save', 'debounce', 'queue', 'mutex', 'storage key', 'completed', 'flush'], Component: Journeys },
      { id: 'recovery-lifecycle', title: 'Recovery lifecycle', description: 'Every status a journey can be in, what a check validates, and lifecycle events.', keywords: ['status', 'checking', 'available', 'expired', 'invalid', 'restored', 'completed', 'onRecovery', 'onError', 'events', 'save_failed', 'analytics'], Component: RecoveryLifecycle },
      { id: 'storage-adapters', title: 'Storage adapters', description: 'AsyncStorage, MMKV, SecureStore, in-memory, and writing your own.', keywords: ['AsyncStorageAdapter', 'MMKVStorageAdapter', 'SecureStoreAdapter', 'MemoryStorageAdapter', 'custom', 'chunking', 'keychain', 'trackKeys', 'getAllKeys'], Component: StorageAdapters },
      { id: 'architecture', title: 'Architecture', description: 'The engine layers and the read and write paths.', keywords: ['engine', 'layers', 'design', 'internals'], Component: Architecture },
    ],
  },
  {
    title: 'Guides',
    pages: [
      { id: 'form-integration', title: 'Forms', description: 'Save and restore React Hook Form values with useJourneyForm.', keywords: ['react-hook-form', 'useJourneyForm', 'form'], Component: FormIntegration },
      { id: 'schema-migration', title: 'Schema migration', description: 'Upgrade checkpoints saved by older versions of your app.', keywords: ['version', 'migrate', 'MIGRATION_FAILED', 'upgrade'], Component: SchemaMigration },
      { id: 'expiry-policies', title: 'Expiry', description: 'Expire stale progress per app, per journey or per checkpoint.', keywords: ['ttl', 'defaultExpiry', 'expiresAt', 'JOURNEY_EXPIRED', 'expiryMode', 'absolute', 'sliding'], Component: ExpiryPolicies },
      { id: 'security-privacy', title: 'Security and privacy', description: 'Exclude sensitive fields, encrypt at rest, and treat restored data as untrusted.', keywords: ['exclude', 'pii', 'pci', 'encryption', 'checksum', 'secure', 'transform', 'hmac', 'signing', 'tamper'], Component: SecurityPrivacy },
      { id: 'user-scoping', title: 'User scoping', description: 'Keep each user\'s checkpoints separate on shared devices.', keywords: ['userId', 'logout', 'sign out', 'clearUserJourneys', 'multi-user'], Component: UserScoping },
      { id: 'app-lifecycle', title: 'App lifecycle', description: 'Flush pending saves when the app goes to the background.', keywords: ['AppState', 'background', 'flush', 'flushOnBackground', 'killed', 'onError', 'save failed'], Component: AppLifecycle },
      { id: 'navigation', title: 'Restoring navigation', navTitle: 'Navigation', description: 'Send the user back to the screen they left, with React Navigation or Expo Router.', keywords: ['react-navigation', 'expo-router', 'route', 'screen', 'reset', 'deep link'], Component: Navigation },
      { id: 'diagnostics', title: 'Diagnostics', description: 'Find out why a checkpoint can or cannot be restored.', keywords: ['getDiagnostics', 'debug', 'JourneyDiagnostics'], Component: Diagnostics },
      { id: 'testing', title: 'Testing', description: 'Test recovery flows with an in-memory environment.', keywords: ['jest', 'vitest', 'createTestRecoveryEnvironment', 'seedCheckpoint', 'renderHook'], Component: Testing },
    ],
  },
  {
    title: 'API reference',
    pages: [
      { id: 'recovery-provider', title: 'RecoveryProvider', code: true, description: 'Provider props, engine options and useRecoveryContext.', keywords: ['provider', 'options', 'useRecoveryContext', 'keyPrefix', 'onError', 'maxSizeBytes', 'transform'], Component: RecoveryProviderApi },
      { id: 'use-journey', title: 'useJourney', code: true, description: 'Register a journey and save checkpoints.', keywords: ['checkpoint', 'clear', 'JourneyHandle', 'CheckpointOptions'], Component: UseJourneyApi },
      { id: 'use-recovery', title: 'useRecovery', code: true, description: 'Check for, restore and discard a checkpoint.', keywords: ['restore', 'discard', 'autoRestore', 'RecoveryState', 'refresh'], Component: UseRecoveryApi },
      { id: 'use-recovery-status', title: 'useRecoveryStatus', code: true, description: 'Read only the recovery status of a journey.', keywords: ['status', 'badge'], Component: UseRecoveryStatusApi },
      { id: 'use-journey-form', title: 'useJourneyForm', code: true, description: 'Form integration signature, options and return value.', keywords: ['FormLike', 'restoreToForm', 'clearForm'], Component: UseJourneyFormApi },
      { id: 'core-engine', title: 'Core engine', description: 'JourneyManager, RecoveryManager, CheckpointManager and LifecycleManager.', keywords: ['JourneyManager', 'RecoveryManager', 'CheckpointManager', 'LifecycleManager', 'SnapshotSerializer', 'without react', 'headless'], Component: CoreEngine },
      { id: 'types', title: 'Types', description: 'TypeScript interfaces exported by the package.', keywords: ['JourneySnapshot', 'JourneyOptions', 'RecoveryStatus', 'RecoveryEvent', 'StorageAdapter', 'interface'], Component: TypesApi },
      { id: 'errors', title: 'Errors', description: 'JourneyRecoveryError and every error code.', keywords: ['JourneyRecoveryError', 'error codes', 'STORAGE_UNAVAILABLE', 'SNAPSHOT_CORRUPTED'], Component: ErrorsApi },
    ],
  },
];

export const ALL_PAGES: (DocPage & { group: string })[] = DOC_GROUPS.flatMap((g) =>
  g.pages.map((p) => ({ ...p, group: g.title }))
);

export const FIRST_PAGE_ID = ALL_PAGES[0].id;

export function findPage(id: string | null | undefined) {
  if (!id) return undefined;
  return ALL_PAGES.find((p) => p.id === id);
}

export function neighbors(id: string) {
  const i = ALL_PAGES.findIndex((p) => p.id === id);
  return {
    prev: i > 0 ? ALL_PAGES[i - 1] : undefined,
    next: i >= 0 && i < ALL_PAGES.length - 1 ? ALL_PAGES[i + 1] : undefined,
  };
}
