// node tools/intro/render.mjs <desktop|mobile>  -> public/assets/media/ff_intro_<kind>.mp4
// Serves the repo root, drives intro.html frame by frame, pipes JPEG frames into ffmpeg at 60 fps.
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { launch } from '../browser.mjs';
const kind = process.argv[2] || 'desktop';
const M = kind === 'mobile';
const root = path.resolve('public');
const server = http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  const f = p === '/intro.html' ? path.resolve('tools/intro/intro.html') : path.join(root, decodeURIComponent(p));
  fs.readFile(f, (e, b) => { if (e) { res.statusCode = 404; return res.end(); } res.end(b); });
}).listen(0);
const port = server.address().port;
const [W, H] = M ? [1080, 1920] : [2160, 1440];
const browser = await launch();
const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
await page.goto(`http://localhost:${port}/intro.html?m=${M ? 1 : 0}`);
await page.waitForFunction(() => window.ready);
const dur = await page.evaluate(() => CFG.dur);
const out = `public/assets/media/ff_intro_${kind}.mp4`;
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '60', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const n = Math.round(dur * 60);
for (let i = 0; i < n; i++) {
  const data = await page.evaluate((t) => { draw(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, i / 60);
  ff.stdin.write(Buffer.from(data.split(',')[1], 'base64'));
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close(); server.close();
console.log(out, n, 'frames');
