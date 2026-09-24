// node tools/capture.mjs <base> <outDir> <WxH> <route,route,...> [steps]
// Same procedure for the reference and our build so the diffs compare like with like:
// preloader skipped via its own cookie, Math.random seeded, wheel-driven scroll in fixed steps.
import fs from 'node:fs';
import { launch, sleep } from './browser.mjs';
const [,, base, out, size = '1440x900', routesArg = '/', stepsArg = '6'] = process.argv;
const [w, h] = size.split('x').map(Number);
const host = new URL(base).hostname;
fs.mkdirSync(out, { recursive: true });
const browser = await launch();
// waits until slide transforms and scroll position hold still (reels settle at the render rate,
// which varies a lot under software GL); returns the film the nav card shows
async function settle(page, max = 25000) {
  const t0 = Date.now(); let last = ''; let same = 0;
  while (Date.now() - t0 < max) {
    const sig = await page.evaluate(() => [...document.querySelectorAll('[data-roll="item"],[data-slider="item"],[data-reviews="slide"]')].map((e) => e.style.transform.replace(/-?\d+(\.\d+)?/g, (n) => Math.round(+n))).join('|') + '@' + Math.round(window.scrollY));
    same = sig === last ? same + 1 : 0; last = sig;
    if (same >= 3) break;
    await sleep(400);
  }
  await sleep(900);
  return page.evaluate(() => [...document.querySelectorAll('.menu-row-film-item')].find((e) => getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0.5)?.dataset.id || '');
}
for (const route of routesArg.split(',')) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
  await ctx.addCookies([
    { name: 'preloader_shown', value: String(Date.now()), domain: host, path: '/' },
    { name: 'tutorial_shown', value: 'true', domain: host, path: '/' },
  ]);
  await ctx.addInitScript(() => {
    let s = 1234567;
    Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  });
  const page = await ctx.newPage();
  const name = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_');
  for (let attempt = 0; attempt < 3; attempt++) {
    try { await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 90000 }); break; }
    catch (e) { console.log('retry', route, e.message.split('\n')[0]); }
  }
  await page.waitForLoadState('load', { timeout: 60000 }).catch(() => console.log('load not reached', route));
  await sleep(4000);
  const film0 = await settle(page);
  await page.screenshot({ path: `${out}/${name}-${w}-00.png` });
  const films = [film0];
  for (let i = 1; i <= +stepsArg; i++) {
    await page.mouse.move(w / 2, h / 2);
    for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, 150); await sleep(40); }
    await sleep(600);
    films.push(await settle(page));
    await page.screenshot({ path: `${out}/${name}-${w}-${String(i).padStart(2, '0')}.png` });
  }
  console.log(name, w, 'films:', films.join(' > '));
  await ctx.close();
}
await browser.close();
