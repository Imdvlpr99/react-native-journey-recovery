import { canonicalUrl, type RouteMeta } from './seo';

function setMeta(selector: string, attr: 'content' | 'href', value: string): void {
  document.head.querySelector(selector)?.setAttribute(attr, value);
}

/** Updates the tags that website/index.html declares, after a client-side navigation. */
export function applyHeadMeta(meta: RouteMeta, options: { noindex?: boolean } = {}): void {
  const url = canonicalUrl(meta);
  document.title = meta.title;
  setMeta('meta[name="description"]', 'content', meta.description);
  setMeta('meta[name="robots"]', 'content', options.noindex ? 'noindex, follow' : 'index, follow');
  setMeta('link[rel="canonical"]', 'href', url);
  setMeta('meta[property="og:title"]', 'content', meta.title);
  setMeta('meta[property="og:description"]', 'content', meta.description);
  setMeta('meta[property="og:url"]', 'content', url);
  setMeta('meta[name="twitter:title"]', 'content', meta.title);
  setMeta('meta[name="twitter:description"]', 'content', meta.description);
}
