# Converts the dated snapshot (docs/reference/<day>/raw/*.html) into our pages.
# The reference markup is kept verbatim (class names, data attributes, structure) because the CSS
# and the behaviour modules are keyed to it; this script only
#   - drops their analytics, Webflow runtime, jQuery and the remote app bundle,
#   - points every asset at our mirror (public/assets, see assets-manifest.tsv),
#   - swaps the brand chrome to FF Dev Studio and writes the demo disclaimer in,
#   - loads our stylesheet and our module entry.
# Regenerate instead of hand-editing the output pages.
import re, os, html, csv, json, sys
DAY = 'docs/reference/2026-09-24'
DISCLAIMER = 'Demo recreation of Siena Film Foundation by FF Dev Studio · Every film, still, video and word about the films belongs to Siena Film Foundation and its filmmakers · Not affiliated · Not a live site'
DISCLAIMER_SHORT = 'Demo recreation of Siena Film Foundation · The assets are not ours · Not affiliated'
EMAIL = 'hello@ffdev.studio'
PAGES = {
    'index': 'index.html', 'work': 'work/index.html', 'about': 'about/index.html', 'contact': 'contact/index.html',
    'cookies': 'cookies/index.html', 'privacy': 'privacy/index.html', 'terms': 'terms/index.html', '404xyz': '404.html',
}
for slug in ['ana-maxim', 'by-any-means', 'kafkas-last-trial', 'moon-in-the-12th-house', 'my-project-x', 'outsider-freud', 'savoy', 'taboo']:
    PAGES[f'films__{slug}'] = f'films/{slug}/index.html'

URLMAP = {}
with open(f'{DAY}/assets-manifest.tsv') as fh:
    for r in csv.DictReader(fh, delimiter='\t'):
        if r['status'] == '200':
            URLMAP[r['source_url']] = '/' + r['local_path'].removeprefix('public/')
MEDIA_SWAP = {
    '/assets/media/logo_intro_desktop.mp4': '/assets/media/ff_intro_desktop.mp4',
    '/assets/media/intro_mobile.mp4': '/assets/media/ff_intro_mobile.mp4',
}
missing = set()
def map_url(u):
    raw = u
    u = html.unescape(u).strip().replace(' ', '%20')
    if u in URLMAP:
        v = URLMAP[u]; return MEDIA_SWAP.get(v, v)
    if u.startswith('https://') and ('website-files' in u or 'jsdelivr' in u):
        missing.add(u)
    return raw

LOGO = open('src/brand/ff-logo.svg').read()
def swap_logo(m):
    cls = re.search(r'class="([^"]*svg-logo[^"]*)"', m.group(0)).group(1)
    return LOGO.replace('class="svg-logo"', f'class="{cls}"')

# Credits and biography lines that name the reference company as a fact about its films stay as written.
PROTECT = [
    'Rabinovich Foundation, Siena Film Foundation', 'Fieldhouse Pictures, Siena Film Foundation',
    'Siena film foundation, The new', 'Fundfor Cinema and TV, Siena Film Foundation', 'Mifal Hapais, Siena Film Foundation',
    'Lee joined the Siena Film Foundation', 'founded Siena Film Foundation', 'Siena Film Foundation supports',
]
TEXT = [
    ('©2024. SIENA FILM FOUNDATION. ', DISCLAIMER_SHORT),
    ('©2024. SIENA FILM FOUNDATION. ', DISCLAIMER_SHORT),
    ('SIENA FILM FOUNDATION', 'FF DEV STUDIO'),
    ('SIENA FILM FOUNDATION', 'FF DEV STUDIO'),
    ('SIENA FILM', 'FF DEV'),
    ('>FOUNDATION\u00a0IS\u00a0A<', '>STUDIO\u00a0IS\u00a0A<'),  # about hero reads "SIENA FILM / FOUNDATION IS A"
    ('>SIENA<', '>FF<'),
    ('@siena. All Rights Reserved 2024', '@ffdev.studio · ' + DISCLAIMER_SHORT),
    ('@siena. All Rights Reserved', '@ffdev.studio · ' + DISCLAIMER_SHORT),
    ('12 Cinematic Lane, Tel Aviv 6688123, Israel', 'Kuala Lumpur, Malaysia'),
    ('Siena Film Foundation', 'FF Dev Studio'),
]
EMAILS = re.compile(r'(?i)\b(lee|press|info|legal|licensing)@siena\.film')

def convert(name, out):
    h = open(f'{DAY}/raw/{name}.html', encoding='utf-8').read()
    # --- strip what we do not ship
    h = re.sub(r'<!-- Last Published:.*?-->', '', h)
    h = re.sub(r'<link href="https://cdn\.prod\.website-files\.com" rel="preconnect"[^>]*>', '', h)
    h = re.sub(r'<link href="[^"]*webflow[^"]*\.css" rel="stylesheet"[^>]*>', '', h)
    h = re.sub(r'<script async="" src="https://www\.googletagmanager[^>]*></script>', '', h)
    h = re.sub(r'<script type="text/javascript">window\.dataLayer.*?</script>', '', h, flags=re.S)
    h = re.sub(r'<!--\s*<link\s+rel="stylesheet"\s+href="http://localhost.*?-->', '', h, flags=re.S)
    h = re.sub(r'<link\s+rel="stylesheet"\s+href="https://siena-film-foundation\.vercel\.app[^>]*>', '', h)
    h = re.sub(r'<script\s+defer\s+src="https://siena-film-foundation\.vercel\.app/app\.js"\s*></script>', '', h)
    h = re.sub(r'<!-- styles -->|<!-- cloud -->|<!--<link rel="stylesheet" href="http://localhost[^>]*-->', '', h)
    h = re.sub(r'<script src="https://d3e54v103j8qbb[^>]*></script>', '', h)
    h = re.sub(r'<script src="https://cdn\.prod\.website-files\.com/[^"]*\.js"[^>]*></script>', '', h)
    h = re.sub(r'<script>\s*function updateFavicon\(\).*?</script>', '', h, flags=re.S)
    h = re.sub(r'<meta name=”viewport”[^>]*/>', '', h)  # their duplicate viewport tag with typographic quotes
    h = re.sub(r'<link href="[^"]*favicon[^"]*" rel="shortcut icon"[^>]*/>', '<link href="/assets/brand/ff-favicon.svg" rel="icon" type="image/svg+xml"/>', h)
    h = re.sub(r'<link href="[^"]*web-clip[^"]*" rel="apple-touch-icon"/>', '<link href="/assets/brand/ff-favicon.svg" rel="apple-touch-icon"/>', h)
    # --- assets -> our mirror
    def attr(m):
        a, v = m.group(1), m.group(2)
        if a == 'srcset':
            parts = [p.strip() for p in html.unescape(v).split(', ')]
            v = ', '.join(' '.join([map_url(p.rsplit(' ', 1)[0])] + p.rsplit(' ', 1)[1:]) for p in parts)
            return f'{a}="{v}"'
        return f'{a}="{map_url(v)}"'
    h = re.sub(r'\b(src|href|content|data-src|poster|srcset)="([^"]*)"', attr, h)
    h = re.sub(r'url\((&quot;|["\']?)([^)"\'&]+)\1\)', lambda m: f'url({m.group(1)}{map_url(m.group(2))}{m.group(1)})', h)
    h = re.sub(r'("(?:url|src|image)"\s*:\s*")([^"]+)(")', lambda m: m.group(1) + map_url(m.group(2)) + m.group(3), h)
    h = re.sub(r'<meta content="[^"]*" property="og:image"/>', '<meta content="/assets/brand/og.jpg" property="og:image"/>', h)
    h = re.sub(r'<meta content="[^"]*" name="twitter:image"/>', '<meta content="/assets/brand/og.jpg" name="twitter:image"/>', h)
    # the unused 4K logo film is referenced only as a data-src on the preloader
    h = h.replace(' data-src="/assets/media/animated_logo_black.mp4"', '')
    # --- brand
    h = re.sub(r'<svg[^>]*class="[^"]*svg-logo[^"]*"[^>]*>.*?</svg>', swap_logo, h, flags=re.S)
    h = EMAILS.sub(EMAIL, h)
    h = re.sub(r'(?i)lee@siena\.film|press@siena\.film', EMAIL.upper(), h)
    h = h.replace('LEE@SiENA.film', EMAIL.upper()).replace('PRESS@SiENA.FILM', EMAIL.upper())
    h = re.sub(r'https://www\.(facebook|instagram|linkedin)\.com/[^"]*', 'https://ffdev.studio', h)
    h = h.replace('https://siena.film', 'https://ffdev.studio')
    h = re.sub(r'<meta content="Siena Film Foundation is a boutique[^"]*" (name|property)="([^"]+)"/>',
               lambda m: f'<meta content="{DISCLAIMER}" {m.group(1)}="{m.group(2)}"/>', h)
    keep = {f'\x00{i}\x00': p for i, p in enumerate(PROTECT)}
    for k, p in keep.items(): h = h.replace(p, k)
    for a, b in TEXT: h = h.replace(a, b)
    for k, p in keep.items(): h = h.replace(k, p)
    # --- disclaimer on the entry screen, under the ENTER button
    h = re.sub(r'(<div class="preloader-cont">)', r'\1<p class="ff-disclaimer" data-ff="disclaimer">' + DISCLAIMER + '</p>', h, count=1)
    # --- our stylesheet + module entry
    h = h.replace('</head>', '<link rel="stylesheet" href="/src/styles/index.css"/></head>', 1)
    h = h.replace('</body>', '<script type="module" src="/src/main.js"></script></body>', 1)
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    open(out, 'w', encoding='utf-8').write(h)

for name, out in PAGES.items():
    convert(name, out)
left = {}
for out in PAGES.values():
    t = open(out).read()
    t2 = re.sub(r'<script type="application/json".*?</script>', '', t, flags=re.S)
    hits = [m.group(0) for m in re.finditer(r'.{40}(?i:siena).{40}', t2)]
    ext = re.findall(r'https://[^"\s)]+', t2)
    left[out] = (len(hits), len([e for e in ext if 'ffdev.studio' not in e]))
print(json.dumps(left, indent=0))
print('unmapped asset urls:', len(missing)); [print(' ', u) for u in sorted(missing)[:10]]
