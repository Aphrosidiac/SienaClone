import { app } from '../core/app.js';
import { clamp, map } from '../core/math.js';
import { bounds } from '../gl/rect.js';

// In/out of viewport watcher: isIn()/isOut() hooks, optional callbacks and class toggle.
export class Observe {
  inView = false;
  constructor(element, { config, addClass, cb } = {}) {
    this.element = element;
    this.config = { root: null, margin: '10px', threshold: 0, autoStart: true, ...config };
    this.cb = cb;
    this.addClass = addClass;
    this.in = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          this.enter();
          if (this.once) this.stop();
        }),
      { root: this.config.root, rootMargin: this.config.margin, threshold: this.config.threshold },
    );
    this.out = new IntersectionObserver((entries) => entries.forEach((e) => !e.isIntersecting && this.leave()), {
      root: this.config.root,
      rootMargin: '0px',
      threshold: 0,
    });
    if (this.config.autoStart) this.start();
  }
  enter() {
    this.inView = true;
    this.isIn?.();
    this.cb?.in?.();
    if (this.addClass) this.element.classList.add(this.addClass);
  }
  leave() {
    this.inView = false;
    this.isOut?.();
    this.cb?.out?.();
    if (this.addClass) this.element.classList.remove(this.addClass);
  }
  start() {
    this.in.observe(this.element);
    this.out.observe(this.element);
  }
  stop() {
    this.in.unobserve(this.element);
    this.out.unobserve(this.element);
  }
}

function trackBounds(el, config) {
  const b = bounds(el);
  if (config.top === 'center') b.top -= b.wh / 2;
  else if (config.top === 'bottom') b.top -= b.wh;
  if (config.bottom === 'center') b.bottom -= b.wh / 2;
  else if (config.bottom === 'bottom') b.bottom -= b.wh;
  return b;
}

// Scroll progress (0..1) of an element between two edges, updated from the Lenis scroll.
// Defaults: from its top meeting the viewport bottom to its bottom meeting the viewport top.
export class Track extends Observe {
  value = 0;
  constructor({ element, config, cb, addClass }) {
    super(element, { config, cb, addClass });
    this.config = { bounds: [0, 1], top: 'bottom', bottom: 'top', ...config };
    queueMicrotask(() => {
      this.resize();
      this.off = app.scroll.subscribe(() => this.onScroll());
    });
  }
  resize() {
    this.bounds = trackBounds(this.element, this.config);
  }
  onScroll() {
    if (!this.inView) return;
    this.value = clamp(0, 1, map(app.scroll.y, this.bounds.top, this.bounds.bottom, this.config.bounds[0], this.config.bounds[1]));
    this.afterRender();
    this.render?.();
  }
  afterRender() {}
  destroy() {
    this.off?.();
    this.stop();
  }
}
