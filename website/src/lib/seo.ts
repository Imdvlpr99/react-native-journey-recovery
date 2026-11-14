/**
 * Per-route SEO metadata. Free of React and DOM imports: the Vite build uses it to
 * pre-render one HTML file per route plus sitemap.xml, and the app uses it to keep
 * <head> in sync during client-side navigation.
 */
import { ALL_PAGE_META } from '../content/meta';

/** Canonical origin. Every deployment (Vercel, GitHub Pages) points search engines here. */
export const SITE_URL = 'https://rn-journey-recovery.vercel.app';
export const SITE_NAME = 'React Native Journey Recovery';
export const OG_IMAGE = `${SITE_URL}/og.png`;

export interface RouteMeta {
  /** Path relative to the site root, without a leading slash ('' is home). */
  path: string;
  title: string;
  description: string;
}

export const HOME_META: RouteMeta = {
  path: '',
  title: 'React Native Journey Recovery: restore interrupted flows after app kills and crashes',
  description:
    'Checkpoint multi-step flows in React Native and Expo, then restore them safely after the app is killed, crashes, or the user leaves. Checksums, expiry, schema migration, and AsyncStorage, MMKV or SecureStore.',
};

export const PLAYGROUND_META: RouteMeta = {
  path: 'playground',
  title: `Live playground · ${SITE_NAME}`,
  description:
    'Run a real React Native checkout app in your browser. Kill it, corrupt its storage or let it expire, and watch react-native-journey-recovery restore or reject the saved progress.',
};

export const NOT_FOUND_META: RouteMeta = {
  path: '',
  title: `Page not found · ${SITE_NAME}`,
  description: HOME_META.description,
};

export function docsMeta(id: string): RouteMeta | undefined {
  const page = ALL_PAGE_META.find((p) => p.id === id);
  if (!page) return undefined;
  return {
    path: `docs/${page.id}`,
    title: `${page.title} · ${SITE_NAME}`,
    description: `${page.description} Documentation for react-native-journey-recovery, a React Native and Expo library.`,
  };
}

/** Every indexable route, in sitemap order. */
export function allRouteMeta(): RouteMeta[] {
  return [HOME_META, PLAYGROUND_META, ...ALL_PAGE_META.map((p) => docsMeta(p.id) as RouteMeta)];
}

export function canonicalUrl(meta: RouteMeta): string {
  return meta.path ? `${SITE_URL}/${meta.path}` : `${SITE_URL}/`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Fills the %SEO_*% placeholders in website/index.html. */
export function fillHtmlTemplate(html: string, meta: RouteMeta, options: { noindex?: boolean } = {}): string {
  const values: Record<string, string> = {
    '%SEO_TITLE%': escapeHtml(meta.title),
    '%SEO_DESCRIPTION%': escapeHtml(meta.description),
    '%SEO_URL%': escapeHtml(canonicalUrl(meta)),
    '%SEO_IMAGE%': OG_IMAGE,
    '%SEO_ROBOTS%': options.noindex ? 'noindex, follow' : 'index, follow',
  };
  return html.replace(/%SEO_[A-Z]+%/g, (token) => values[token] ?? token);
}

export function sitemapXml(): string {
  const urls = allRouteMeta()
    .map((meta) => `  <url><loc>${escapeHtml(canonicalUrl(meta))}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}
