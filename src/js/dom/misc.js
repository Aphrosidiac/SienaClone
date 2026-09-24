import gsap from 'gsap';
import { state } from '../core/state.js';

const TUTORIAL_COOKIE = 'tutorial_shown';
const TUTORIAL_TTL = 48 * 60 * 60 * 1000;

// Home: a small player that rises from the bottom 2 s after entry, plays the how-to clip and
// steps through its captions every 4.8 s, then drops away. Shown once per 48 h (cookie).
export class Tutorial {
  step = 0;
  constructor(el) {
    this.el = el;
    if (getComputedStyle(el).display === 'none' || !this.shouldShow()) {
      el.remove();
      return;
    }
    this.play = () => {
      state.off('PRELOADER_CLICKED', this.play);
      setTimeout(() => {
        gsap.to(this.el, { duration: 0.4, yPercent: 0 });
        document.cookie = `${TUTORIAL_COOKIE}=true; expires=${new Date(Date.now() + TUTORIAL_TTL).toUTCString()}; path=/`;
        this.video.play().catch(() => {});
        this.interval = setInterval(this.playStep, 4800);
        gsap.to(this.texts[0], { yPercent: -100 });
      }, 2000);
    };
    this.playStep = () => {
      gsap.to(this.texts[this.step], { yPercent: -200, duration: 1.2 });
      this.step++;
      if (this.step < this.texts.length) gsap.to(this.texts[this.step], { yPercent: -100, duration: 1.2, delay: 0.1 });
      if (this.step === this.texts.length) {
        clearInterval(this.interval);
        this.animateOut();
      }
    };
    gsap.set(el, { yPercent: 100 });
    el.style.visibility = 'visible';
    this.close = el.querySelector("[data-tutorial='close']");
    this.texts = [...el.querySelector("[data-tutorial='texts']").children];
    this.video = el.querySelector("[data-tutorial='video']");
    this.close.onclick = () => this.animateOut();
    if (state.PRELOADER_CLICKED) this.play();
    else state.on('PRELOADER_CLICKED', this.play);
  }
  shouldShow() {
    return !document.cookie.split('; ').find((c) => c.startsWith(TUTORIAL_COOKIE));
  }
  animateOut() {
    gsap.to(this.el, { duration: 1.8, yPercent: 100, onComplete: () => this.el.remove() });
  }
  destroy() {
    clearInterval(this.interval);
    state.off('PRELOADER_CLICKED', this.play);
  }
}

// Keeps an SVG outline (rect) 2 px inside its container at any size.
export class SvgResizer {
  constructor(el) {
    this.container = el;
    this.rects = [...el.querySelector("[data-svg='resize']").querySelectorAll('rect')];
    this.update = () => {
      const r = this.container.getBoundingClientRect();
      const w = r.width - 4;
      const h = r.height - 4;
      if (w > 0 && h > 0) this.rects.forEach((rect) => (rect.setAttribute('width', w), rect.setAttribute('height', h)));
    };
    this.update();
    this.ro = new ResizeObserver(this.update);
    this.ro.observe(el);
    window.addEventListener('resize', this.update);
  }
  destroy() {
    this.ro.disconnect();
    window.removeEventListener('resize', this.update);
  }
}

// Film page credits marquee: clones its list so the CSS loop never runs out; tells CSS how many
// entries (capped at 14) it holds.
export class Marquee {
  constructor(el) {
    const clone = el.children[0].cloneNode(true);
    el.appendChild(clone); // (the reference appends the same node five times, which moves it once)
    const n = el.children[0].children[0].children.length;
    el.setAttribute('data-marquee-active', n > 14 ? 14 : n);
  }
}

// Nav entrance: logo fades, menu card drops in, after the page's intro delay.
export class NavIntro {
  hasAnimated = false;
  constructor(el) {
    this.el = el;
    this.logo = el.querySelector('[data-a="logo"]');
    this.menu = el.querySelector('[data-a="menu"]');
    this.animateIn = () => {
      if (this.hasAnimated) return;
      this.hasAnimated = true;
      gsap.set(this.el, { autoAlpha: 1 });
      gsap.to(this.logo, { autoAlpha: 1, duration: 0.8, delay: this.delay });
      gsap.to(this.menu, { yPercent: 0, duration: 1.2, delay: this.delay + 0.1 });
    };
    gsap.set(el, { autoAlpha: 0 });
    gsap.set(this.logo, { autoAlpha: 0 });
    gsap.set(this.menu, { yPercent: -200 });
    if (state.ANIMATE_IN === true) this.animateIn();
    state.on('ANIMATE_IN', this.animateIn);
  }
  get delay() {
    return state.page === 'work' || state.page === 'home' ? 1.6 : 0.6;
  }
  destroy() {
    state.off('ANIMATE_IN', this.animateIn);
  }
}
