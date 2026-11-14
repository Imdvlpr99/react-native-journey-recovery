import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { allRouteMeta, fillHtmlTemplate, HOME_META, NOT_FOUND_META, robotsTxt, sitemapXml } from './src/lib/seo';

/**
 * Emits one HTML file per route (docs/<id>.html, playground.html) with its own title,
 * description, canonical URL and Open Graph tags, plus 404.html, sitemap.xml and robots.txt.
 * Crawlers and link previews get correct metadata without running JavaScript, and deep
 * links work on static hosts (GitHub Pages) without a server-side rewrite.
 */
function seoPages(): Plugin {
  return {
    name: 'seo-pages',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        // In dev, fill with home metadata; the build fills each emitted file in generateBundle.
        return ctx.server ? fillHtmlTemplate(html, HOME_META) : html;
      },
    },
    generateBundle(_options, bundle) {
      const index = bundle['index.html'];
      if (!index || index.type !== 'asset') this.error('seo-pages: index.html missing from the bundle');
      const template = String(index.source);

      for (const meta of allRouteMeta()) {
        const html = fillHtmlTemplate(template, meta);
        if (meta.path === '') index.source = html;
        else this.emitFile({ type: 'asset', fileName: `${meta.path}.html`, source: html });
      }
      this.emitFile({ type: 'asset', fileName: '404.html', source: fillHtmlTemplate(template, NOT_FOUND_META, { noindex: true }) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml() });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt() });
    },
  };
}

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react(), tailwindcss(), seoPages()],
  // Path routes need absolute asset URLs. GitHub Pages serves the site from /<repo>/, so its workflow sets DOCS_BASE.
  base: process.env.DOCS_BASE ?? '/',
  build: {
    // Generated site lives apart from the hand-written docs/ folder and is cleared on every build.
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'react-native-journey-recovery': path.resolve(__dirname, '../src/index.ts'),
      // The playground is a React Native app rendered on the web.
      'react-native': 'react-native-web',
    },
  },
});
