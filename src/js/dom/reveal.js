import gsap from 'gsap';
import { Observe } from './track.js';

const STAGGER = 0.03;

// [data-a="group"]: on entering view its [data-a] children animate in — lines draw (scaleX),
// alphas fade, items rise from 200%. Reset whenever the group leaves view.
class Line {
  constructor(el, i, delay) {
    Object.assign(this, { el, i, delay });
    this.setOut();
    gsap.set(el, { transformOrigin: i % 2 === 0 ? 'left' : 'right' });
  }
  isIn() {
    this.anim = gsap.to(this.el, { scaleX: 1, duration: 1.2, delay: this.delay + this.i * STAGGER });
  }
  setOut() {
    this.anim?.kill();
    gsap.set(this.el, { scaleX: 0 });
    this.el.style.visibility = 'visible';
  }
}
class Alpha {
  constructor(el, i, delay) {
    Object.assign(this, { el, i, delay });
    this.setOut();
  }
  isIn() {
    this.anim = gsap.to(this.el, { autoAlpha: 1, duration: 1.2, delay: this.delay + this.i * STAGGER });
  }
  setOut() {
    this.anim?.kill();
    gsap.set(this.el, { autoAlpha: 0 });
    this.el.style.visibility = 'visible';
  }
}
class Item {
  constructor(el, i, delay) {
    Object.assign(this, { el, i, delay });
    this.setOut();
  }
  isIn() {
    this.anim = gsap.to(this.el, { yPercent: 0, duration: 1.2, delay: this.delay + this.i * STAGGER });
  }
  setOut() {
    this.anim?.kill();
    gsap.set(this.el, { yPercent: 200 });
    this.el.style.visibility = 'visible';
  }
}
const KINDS = { line: Line, alpha: Alpha, item: Item };

export class RevealGroup extends Observe {
  constructor(el) {
    super(el);
    this.once = el.dataset.once === 'true';
    this.delay = +el.dataset.delay || 0;
    this.items = [...el.querySelectorAll('[data-a]')].map((c, i) => KINDS[c.dataset.a] && new KINDS[c.dataset.a](c, i, this.delay)).filter(Boolean);
  }
  isIn() {
    this.items.forEach((i) => i.isIn());
  }
  isOut() {
    this.items.forEach((i) => i.setOut());
  }
  destroy() {
    this.stop();
  }
}
