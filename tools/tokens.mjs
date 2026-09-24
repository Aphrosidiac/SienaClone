// node tools/tokens.mjs <base> <outDir> <WxH> <route,...> — runs the reference-clone token
// extractor in each page (preloader skipped, 6 s settle) and writes <route>-<w>.json.
import fs from 'node:fs';
import os from 'node:os';
import { launch, sleep } from './browser.mjs';
const [,, base, out, size, routesArg] = process.argv;
const [w, h] = size.split('x').map(Number);
const src = fs.readFileSync(`${os.homedir()}/.claude/skills/reference-clone/scripts/extract_tokens.js`, 'utf8');
fs.mkdirSync(out, { recursive: true });
const browser = await launch();
for (const route of routesArg.split(',')) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768 });
  const host = new URL(base).hostname;
  await ctx.addCookies([{ name: 'preloader_shown', value: String(Date.now()), domain: host, path: '/' }, { name: 'tutorial_shown', value: 'true', domain: host, path: '/' }]);
  const page = await ctx.newPage();
  await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForLoadState('load', { timeout: 60000 }).catch(() => {});
  await sleep(6000);
  const r = await page.evaluate(src);
  const name = route === '/' ? 'home' : route.slice(1).replace(/\//g, '_');
  fs.writeFileSync(`${out}/${name}-${w}.json`, JSON.stringify(r, null, 1));
  console.log(name, w, 'ok');
  await ctx.close();
}
await browser.close();
