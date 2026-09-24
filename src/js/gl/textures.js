import { Texture } from 'ogl';

export function loadTexture(g, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const t = new Texture(g, { image: img, wrapS: g.REPEAT, wrapT: g.REPEAT });
      t.a = [img.naturalWidth, img.naturalHeight];
      resolve(t);
    };
    img.src = src;
  });
}

// One atlas holds both frame masks: roll card shape (left 71.68%) and slider card shape (right).
const MASKS = { mask_desk: '/assets/img/6787be25e793fecfdd4a360b_all-masks.webp' };

export async function loadMasks(g) {
  const keys = Object.keys(MASKS);
  const tex = await Promise.all(keys.map((k) => loadTexture(g, MASKS[k])));
  return Object.fromEntries(keys.map((k, i) => [k, tex[i]]));
}
