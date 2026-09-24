# python3 tools/diff.py <refDir> <oursDir> [sheet.png]
# Mean absolute difference (0-255, greyscale) per same-named screenshot pair, plus an optional
# side-by-side sheet (reference left, ours right) for the pairs that differ most.
import sys, glob, os
import numpy as np
from PIL import Image
ref, ours = sys.argv[1], sys.argv[2]
sheet = sys.argv[3] if len(sys.argv) > 3 else None
rows = []
for f in sorted(glob.glob(f'{ours}/*.png')):
    r = os.path.join(ref, os.path.basename(f))
    if not os.path.exists(r): continue
    a = np.asarray(Image.open(r).convert('L'), dtype=np.float32)
    b = np.asarray(Image.open(f).convert('L'), dtype=np.float32)
    if a.shape != b.shape: rows.append((os.path.basename(f), -1)); continue
    rows.append((os.path.basename(f), float(np.abs(a - b).mean())))
for n, d in rows: print(f'{d:7.2f}  {n}')
ok = [d for _, d in rows if d >= 0]
print(f'pairs {len(rows)}  mean {np.mean(ok):.2f}  max {max(ok):.2f}')
if sheet:
    worst = sorted(rows, key=lambda x: -x[1])[:8]
    tw = 720
    ims = []
    for n, _ in worst:
        a = Image.open(os.path.join(ref, n)).convert('RGB'); b = Image.open(os.path.join(ours, n)).convert('RGB')
        th = int(a.height * tw / a.width)
        pair = Image.new('RGB', (tw * 2 + 8, th), 'red'); pair.paste(a.resize((tw, th)), (0, 0)); pair.paste(b.resize((tw, th)), (tw + 8, 0)); ims.append(pair)
    H = sum(i.height + 8 for i in ims); S = Image.new('RGB', (tw * 2 + 8, H), 'white'); y = 0
    for i in ims: S.paste(i, (0, y)); y += i.height + 8
    S.save(sheet)
