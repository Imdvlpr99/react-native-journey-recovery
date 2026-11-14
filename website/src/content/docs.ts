import type React from 'react';
import { DOC_META_GROUPS, type DocPageMeta } from './meta';
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

export interface DocPage extends DocPageMeta {
  Component: React.FC;
}

export interface DocGroup {
  title: string;
  pages: DocPage[];
}

const COMPONENTS: Record<string, React.FC> = {
  overview: Overview,
  installation: Installation,
  quickstart: Quickstart,
  journeys: Journeys,
  'recovery-lifecycle': RecoveryLifecycle,
  'storage-adapters': StorageAdapters,
  architecture: Architecture,
  'form-integration': FormIntegration,
  'schema-migration': SchemaMigration,
  'expiry-policies': ExpiryPolicies,
  'security-privacy': SecurityPrivacy,
  'user-scoping': UserScoping,
  'app-lifecycle': AppLifecycle,
  navigation: Navigation,
  diagnostics: Diagnostics,
  testing: Testing,
  'recovery-provider': RecoveryProviderApi,
  'use-journey': UseJourneyApi,
  'use-recovery': UseRecoveryApi,
  'use-recovery-status': UseRecoveryStatusApi,
  'use-journey-form': UseJourneyFormApi,
  'core-engine': CoreEngine,
  types: TypesApi,
  errors: ErrorsApi,
};

export const DOC_GROUPS: DocGroup[] = DOC_META_GROUPS.map((g) => ({
  title: g.title,
  pages: g.pages.map((p) => {
    const Component = COMPONENTS[p.id];
    if (!Component) throw new Error(`No component registered for docs page "${p.id}"`);
    return { ...p, Component };
  }),
}));

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
