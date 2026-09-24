// node tools/timeline.mjs <url> <outDir> [WxH] [ms-between] [count]
// Screenshots a page at a fixed cadence from navigation, to see a load sequence.
import fs from 'node:fs';
import { launch, sleep } from './browser.mjs';
const [,, url, out, size = '1440x900', every = '500', count = '24'] = process.argv;
const [w, h] = size.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()));
const t0 = Date.now();
await page.goto(url, { waitUntil: 'commit' });
for (let i = 0; i < +count; i++) {
  await page.screenshot({ path: `${out}/t${String(Date.now() - t0).padStart(5, '0')}.png` });
  await sleep(+every);
}
await browser.close();
