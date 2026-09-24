import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { existsSync, globSync } from 'node:fs';

// Multi-page static build: every converted page is an entry.
const pages = globSync('{index.html,404.html,{work,about,contact,cookies,privacy,terms}/index.html,films/*/index.html}');

// Clean URLs in dev (/films/savoy -> /films/savoy/index.html), as Cloudflare Pages serves them.
const cleanUrls = () => ({
  name: 'clean-urls',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const [path, query] = req.url.split('?');
      if (!path.includes('.') && path !== '/' && existsSync(resolve(`.${path.replace(/\/$/, '')}/index.html`))) {
        req.url = `${path.replace(/\/$/, '')}/index.html${query ? `?${query}` : ''}`;
      }
      next();
    });
  },
});

export default defineConfig({
  appType: 'mpa',
  plugins: [cleanUrls()],
  build: { rollupOptions: { input: Object.fromEntries(pages.map((p) => [p.replace(/\/index\.html$|\.html$/, '') || 'index', resolve(p)])) } },
});
