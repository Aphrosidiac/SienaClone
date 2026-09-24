# Builds the nav/footer logo for the reference's 131x63 logo slot from the FF brand-system glyphs:
# the FF mark on top, "DEV STUDIO" glyphs letter-spaced across the full width beneath (the reference
# sets "FILM FOUNDATION" the same way under its wordmark).
import re
SRC = '../ffdevstudio/brand-system/assets/svg/ff-lockup-stacked-white.svg'
s = open(SRC).read()
mark = re.findall(r'<path d="(M[0-9][^"]*Z)"/>', s)[:4]
glyphs = re.findall(r'<path transform="translate\(([\d.]+) 105\) scale\(0\.01200 -0\.01200\)" d="([^"]+)"', s)
if not glyphs:
    glyphs = [(m[0], m[1]) for m in re.findall(r'<path d="([^"]+)" transform="translate\(([\d.]+) 105\)[^"]*"', s)]
    glyphs = [(b, a) for a, b in glyphs]
assert len(mark) == 4 and len(glyphs) >= 9, (len(mark), len(glyphs))
K = 131 / 194                      # mark scale into the 131-wide slot
xs = [float(x) for x, _ in glyphs]
last_w = 194 - 0 - xs[-1] if xs[-1] < 180 else 8
# spread glyph origins over the width, with a word gap between "Dev" and "Studio" (glyph index 3)
n = len(glyphs); span = 131 - 7.2
gaps = n - 1 + 0.5
pos, step, x = [], span / gaps, 0.0
for i in range(n):
    if i == 3: x += step * 1.5
    pos.append(x); x += step if i != 2 else 0
out = ['<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 131 63" width="100%" class="svg-logo" role="img" aria-label="FF Dev Studio">']
out.append(f'<path fill="currentColor" transform="scale({K:.5f})" d="{" ".join(mark)}"/>')
for (ox, d), px in zip(glyphs, pos):
    out.append(f'<path fill="currentColor" transform="translate({px:.3f} 62.6) scale(0.00810 -0.00810)" d="{d}"/>')
out.append('</svg>')
open('src/brand/ff-logo.svg', 'w').write(''.join(out))
print('glyphs', n, [round(p, 1) for p in pos])
