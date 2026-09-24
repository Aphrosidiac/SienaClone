# Collect every asset URL referenced by the snapshot (HTML, CSS, bundle, inline JSON) and mirror it
# into public/assets/, keeping the original filename. Writes docs/reference/<day>/assets-manifest.tsv.
import re, os, sys, glob, html, urllib.parse, subprocess, concurrent.futures as cf
DAY = 'docs/reference/2026-09-24'
PAT = re.compile(r'https://(?:cdn\.prod\.website-files\.com|cdn\.jsdelivr\.net/gh/niccolomiranda/siena|uploads-ssl\.webflow\.com|d3e54v103j8qbb\.cloudfront\.net)/[^\s"\'()<>,\\]+')
HOSTS = PAT.pattern.split('(?:')[1].split(')')[0].replace('\\.', '.').split('|')
ATTR = re.compile(r'(?:src|href|content|data-src|poster)="([^"]+)"')
SRCSET = re.compile(r'srcset="([^"]+)"')
JSONURL = re.compile(r'"(?:url|src|image)"\s*:\s*"([^"]+)"')
CSSURL = re.compile(r'url\(\s*[\'"]?([^\'")]+)')
def keep(u):
    return u.startswith('https://') and any(h in u for h in HOSTS) and 'jquery' not in u and not (u.endswith('.js') and 'webflow' in u)
urls = set()
for f in glob.glob(f'{DAY}/raw/*.html') + glob.glob(f'{DAY}/bundle/*.css') + [f'{DAY}/bundle/app.js']:
    t = open(f, encoding='utf-8', errors='ignore').read()
    found = [html.unescape(u) for u in ATTR.findall(t) + JSONURL.findall(t)] + CSSURL.findall(html.unescape(t))
    for ss in SRCSET.findall(t):
        found += [c.strip().rsplit(' ', 1)[0] for c in html.unescape(ss).split(', ')]
    found += PAT.findall(t) if f.endswith('.js') else []
    for u in found:
        u = u.strip()
        if keep(u): urls.add(u.replace(' ', '%20'))
def local(u):
    p = urllib.parse.urlparse(u)
    name = urllib.parse.unquote(p.path.rsplit('/', 1)[-1])
    name = re.sub(r'[^A-Za-z0-9._-]+', '-', name)
    sub = 'media' if 'jsdelivr' in u else ('css' if name.endswith('.css') else 'img')
    return f'public/assets/{sub}/{name}'
def get(u):
    dest = local(u); os.makedirs(os.path.dirname(dest), exist_ok=True)
    if not os.path.exists(dest) or os.path.getsize(dest) == 0:
        r = subprocess.run(['curl', '-sSL', '--max-time', '120', '-o', dest, '-w', '%{http_code}\t%{content_type}', u], capture_output=True, text=True)
        code, ct = (r.stdout.split('\t') + [''])[:2]
    else:
        code, ct = '200', 'cached'
    return u, code, os.path.getsize(dest) if os.path.exists(dest) else 0, ct, dest
with cf.ThreadPoolExecutor(8) as ex:
    rows = list(ex.map(get, sorted(urls)))
with open(f'{DAY}/assets-manifest.tsv', 'w') as fh:
    fh.write('source_url\tstatus\tbytes\tcontent_type\tlocal_path\n')
    for r in rows: fh.write('\t'.join(map(str, r)) + '\n')
bad = [r for r in rows if r[1] != '200']
print(len(rows), 'assets;', sum(r[2] for r in rows) // 1048576, 'MiB;', len(bad), 'failed')
for b in bad[:20]: print(b)
