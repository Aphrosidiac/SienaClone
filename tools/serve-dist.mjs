// node tools/serve-dist.mjs [port] — serves dist/ like Cloudflare Pages: /x -> /x/index.html or
// /x.html, unknown paths -> 404.html with status 404, byte ranges for media.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const port = +(process.argv[2] || 3165);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.ttf': 'font/ttf', '.json': 'application/json' };
function resolveFile(p) {
  const f = path.join(root, decodeURIComponent(p));
  if (!f.startsWith(root)) return null;
  for (const c of [f, `${f.replace(/\/$/, '')}/index.html`, `${f}.html`]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
}
http.createServer((req, res) => {
  const p = req.url.split('?')[0];
  let file = resolveFile(p), status = 200;
  if (!file) { file = path.join(root, '404.html'); status = 404; }
  const type = TYPES[path.extname(file)] || 'application/octet-stream';
  const size = fs.statSync(file).size;
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range && status === 200) {
    const start = +range[1] || 0, end = range[2] ? +range[2] : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(status, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`dist on http://localhost:${port}`));
