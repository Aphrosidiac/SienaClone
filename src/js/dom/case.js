import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { app } from '../core/app.js';
import { state } from '../core/state.js';
import { wrapHalf } from '../core/math.js';
import { Track } from './track.js';

// Film page hero: a short title hides the third decorative line.
export class CaseHero {
  constructor(el) {
    const lines = [...el.querySelector("[data-cs='lines']").children];
    if (el.dataset.case.length < 13) lines[2].style.display = 'none';
  }
}

// Film page: two rows of stills driven by page scroll, one each way; about 40% of the small
// parallax labels are hidden at random, as in the reference.
export class CaseFootage {
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.items = [...document.querySelectorAll('[data-footage="item"]')];
    this.items2 = [...document.querySelectorAll("[data-footage='item2']")];
    this.current = 0;
    this.isVisible = false;
    this.setupViewport();
    const par = (el) => [...el.querySelectorAll('[data-parallax]')].map((p) => ({ element: p, value: +p.dataset.parallax }));
    this.parallaxItems = this.items.map(par).filter((a) => a.length);
    this.reverseParallaxItems = this.items2.map((el) => (par(el).length ? par(el) : null));
    this.imageParallaxItems = this.items.map((el) => el.querySelector('[data-imgParallax]'));
    this.imageReverseParallax = this.items2.map((el) => el.querySelector('[data-imgParallax]'));
    this.parallaxItems.forEach((p) => Math.random() < 0.4 && (p[0].element.style.display = 'none'));
    this.reverseParallaxItems.forEach((p) => p && Math.random() < 0.4 && (p[0].element.style.display = 'none'));
    this.observer = new IntersectionObserver((es) => es.forEach((e) => (this.isVisible = e.isIntersecting)), { root: null, rootMargin: '50px', threshold: 0 });
    this.observer.observe(this.wrapper);
    setTimeout(() => this.setupViewport(), 1000);
  }
  setupViewport() {
    this.viewport = { width: this.items[0].clientWidth, marginWidth: (this.wrapper.clientWidth - this.items[0].clientWidth) / 2 };
  }
  update() {
    if (!this.isVisible) return;
    this.current = app.scroll.percent * 8;
    const n = this.items.length;
    this.items.forEach((item, t) => {
      const i = this.current + t;
      const x1 = (wrapHalf(i, n) - t) * this.viewport.width + this.viewport.marginWidth;
      const x2 = (wrapHalf(i, n) + t) * this.viewport.width + this.viewport.marginWidth;
      item.style.transform = `translateX(${x1}px)`;
      this.items2[t].style.transform = `translateX(${-x2}px)`;
      if (!app.isMobile && this.parallaxItems[t]) {
        const u = wrapHalf(i, n / 2);
        // the reference writes `i + isMobile ? 0 : 3.5`, which parses as `(i + isMobile) ? 0 : 3.5`:
        // the reverse row is only blurred while the strip sits exactly on 0. Kept as shipped.
        const c = wrapHalf(i ? 0 : 3.5, n / 2);
        if (this.imageParallaxItems[t]) this.imageParallaxItems[t].style.filter = `blur(${Math.abs(u) * 2}px)`;
        if (this.imageReverseParallax[t]) this.imageReverseParallax[t].style.filter = `blur(${Math.abs(c) * 2}px)`;
      }
    });
  }
  destroy() {
    this.observer.disconnect();
  }
}

// Image that drifts inside its clipped frame as it crosses the viewport.
export class ParallaxImage extends Track {
  constructor(el) {
    const config = { bounds: [0, 1], top: 'bottom', bottom: 'top' };
    if (el.getBoundingClientRect().top + (app.scroll?.y || 0) < 20) config.top = 'top';
    super({ element: el, config });
    this.amount = +el.dataset.amount || 1;
    this.scale = this.amount === 1 || app.isMobile ? 1.2 : 1.3;
    this.anim = el.querySelector('img');
    el.style.overflow = 'clip';
    this.afterRender();
  }
  afterRender() {
    this.anim.style.transform = `translateY(${-10 * this.amount + this.value * 20 * this.amount}%) scale(${this.scale})`;
  }
}

// "Next film" footer: shows only the film after the current one (wrapping).
export class NextFilm {
  constructor(el) {
    this.all = [...el.children];
    let at = 0;
    this.all.forEach((c, i) => c.dataset.id === state.pageRef.case && (at = i));
    const next = at + 1 < this.all.length ? at + 1 : 0;
    this.all.forEach((c, i) => (c.style.display = i !== next ? 'none' : 'flex'));
  }
}

// Film title: split into lines that rise in, decorative lines draw, alphas fade; long titles
// then slide their lines apart (alternating) as the hero scrolls away.
export class CaseTitle extends Track {
  constructor(el) {
    super({ element: document.querySelector("[data-cs='herow']"), config: { top: 'top', bottom: 'top' } });
    this.mainWrap = document.querySelector('[data-a="casetitle"]');
    this.lines = this.mainWrap.querySelectorAll("[data-a='line']");
    this.alphas = this.mainWrap.querySelectorAll("[data-a='alpha']");
    this.img = document.querySelector('.cs-main-img');
    gsap.set(this.img, { autoAlpha: 0 });
    setTimeout(() => this.setup(el), 300);
  }
  setup(el) {
    this.split = new SplitText(el, { type: 'lines', linesClass: 'split-line-move-case' });
    this.inners = this.split.lines.map((line) => {
      const text = line.textContent;
      line.textContent = '';
      const inner = document.createElement('div');
      inner.textContent = text;
      line.appendChild(inner);
      return inner;
    });
    gsap.set(this.inners, { yPercent: 120 });
    gsap.set(this.lines, { scaleX: 0 });
    gsap.set(this.alphas, { autoAlpha: 0 });
    if (this.split.lines.length > 1) {
      this.isActive = true;
      this.afterRender();
    }
    gsap.to(this.inners, { yPercent: 0, delay: 0.4 });
    gsap.to(this.lines, { scaleX: 1, delay: 0.8, stagger: { amount: 0.2, from: 'random' } });
    gsap.to(this.alphas, { autoAlpha: 1, delay: 0.4, stagger: { amount: 0.2 } });
    gsap.to(this.img, { yPercent: 0, delay: 0.4 });
    gsap.to(this.img, { autoAlpha: 1, delay: 0.5 });
  }
  afterRender() {
    if (!this.isActive) return;
    this.split.lines.forEach((line, i) => {
      line.style.transform = `translateX(${this.value * 10 * (i % 2 === 0 ? 1 : -1)}%)`;
    });
  }
}

// Film page: the logo turns black over white sections ([data-color="white"]).
export class LogoColor {
  triggers = [...document.querySelectorAll('[data-color]')];
  logo = document.querySelector('.nav-link');
  constructor() {
    this.observers = this.triggers.map((el) => {
      const o = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (this.logo.style.color = el.dataset.color === 'white' ? 'black' : 'white')), {
        rootMargin: '0% 0% -90% 0%',
        threshold: 0,
      });
      o.observe(el);
      return o;
    });
  }
  destroy() {
    this.triggers.forEach((t) => (t.style.color = 'white'));
    this.observers.forEach((o) => o.disconnect());
  }
}
