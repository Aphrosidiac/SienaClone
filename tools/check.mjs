// node tools/check.mjs <url...> — loads each URL, reports failed requests, console errors,
// page errors and any request leaving our origin.
import { launch, sleep } from './browser.mjs';
const urls = process.argv.slice(2);
const browser = await launch();
for (const url of urls) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const origin = new URL(url).origin;
  const bad = [];
  page.on('response', (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`));
  page.on('requestfailed', (r) => bad.push(`FAIL ${r.url()} ${r.failure()?.errorText}`));
  page.on('request', (r) => !r.url().startsWith(origin) && !r.url().startsWith('data:') && !r.url().startsWith('blob:') && bad.push(`EXTERNAL ${r.url()}`));
  page.on('pageerror', (e) => bad.push(`PAGEERROR ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !m.text().includes('Failed to load resource') && bad.push(`CONSOLE ${m.text().slice(0, 200)}`));
  await page.goto(url, { waitUntil: 'load' });
  await sleep(4000);
  console.log(url, bad.length ? '' : 'clean');
  [...new Set(bad)].forEach((b) => console.log('  ', b));
  await page.close();
}
await browser.close();
