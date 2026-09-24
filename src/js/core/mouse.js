import { lerp } from './math.js';

// Pointer position with a 0.2 lerp follower (cex/cey) used by the custom cursor.
export const mouse = {
  isActive: true,
  cx: window.innerWidth / 2,
  cy: window.innerHeight / 2,
  cex: 0,
  cey: 0,
  render() {
    if (!this.isActive) return;
    this.cex = lerp(this.cex, this.cx, 0.2);
    this.cey = lerp(this.cey, this.cy, 0.2);
  },
};

document.addEventListener('mousemove', (e) => {
  mouse.cx = e.clientX;
  mouse.cy = e.clientY;
});
