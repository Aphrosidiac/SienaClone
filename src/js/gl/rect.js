import { app } from '../core/app.js';
import { gl } from './gl.js';

// Document-space bounds of an element (adds the Lenis scroll offset).
export function bounds(el) {
  const r = el.getBoundingClientRect();
  const y = app.scroll?.y || 0;
  return {
    top: r.top + y, bottom: r.bottom + y, width: r.width, height: r.height, left: r.left, right: r.right,
    wh: window.innerHeight, ww: window.innerWidth, offset: r.top + y,
  };
}

// Bounds converted to GL world units, with the element centre relative to the viewport centre.
export function glBounds(el, px = gl.vp.px) {
  if (!el) return { centerx: 0, centery: 0, width: 1, height: 1 };
  const b = bounds(el);
  b.centerx = -gl.vp.w / 2 + b.left + b.width / 2;
  b.centery = gl.vp.h / 2 - b.top - b.height / 2;
  for (const k of Object.keys(b)) b[k] *= px;
  return b;
}
