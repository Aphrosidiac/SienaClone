// node tools/flow.mjs <url> <outDir> <WxH> <script.json>
// Runs a list of steps: {wait:ms} {click:selector} {mouse:[x,y]} {wheel:dy} {drag:[x1,y1,x2,y2]} {key:'Escape'}
// {shot:name} {shots:[name,count,everyMs]} {eval:"js"} {goto:url}
import fs from 'node:fs';
import { launch, sleep } from './browser.mjs';
const [,, url, out, size = '1440x900', scriptPath] = process.argv;
const steps = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
const [w, h] = size.split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 768, isMobile: w < 768 });
const page = await ctx.newPage();
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && console.log('console:', m.text().slice(0, 200)));
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(url, { waitUntil: 'load' });
for (const s of steps) {
  if (s.wait) await sleep(s.wait);
  if (s.click) await page.click(s.click, { force: true }).catch((e) => console.log('click fail', s.click, e.message.split('\n')[0]));
  if (s.mouse) await page.mouse.move(s.mouse[0], s.mouse[1], { steps: s.steps || 10 });
  if (s.clickAt) await page.mouse.click(s.clickAt[0], s.clickAt[1]);
  if (s.wheel) { for (let i = 0; i < (s.times || 1); i++) { await page.mouse.wheel(0, s.wheel); await sleep(s.gap || 60); } }
  if (s.drag) { const [a, b, c, d] = s.drag; await page.mouse.move(a, b); await page.mouse.down(); await page.mouse.move(c, d, { steps: s.steps || 20 }); await page.mouse.up(); }
  if (s.key) await page.keyboard.press(s.key);
  if (s.goto) await page.goto(s.goto, { waitUntil: 'load' });
  if (s.eval) console.log(s.label || 'eval', JSON.stringify(await page.evaluate(s.eval)));
  if (s.shot) await page.screenshot({ path: `${out}/${s.shot}.png`, fullPage: !!s.full });
  if (s.shots) { const [n, c, e] = s.shots; for (let i = 0; i < c; i++) { await page.screenshot({ path: `${out}/${n}-${String(i).padStart(2, '0')}.png` }); await sleep(e); } }
}
await browser.close();
