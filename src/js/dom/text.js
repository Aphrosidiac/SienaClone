import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { state } from '../core/state.js';

// Each character carries a copy of itself below; rolling the pair up N times reads as a
// slot-machine flicker that lands back on the letter.
function slotChars(chars, cls) {
  chars.forEach((c) => {
    const ch = c.textContent;
    c.innerHTML = `<div class="${cls[0]}">${ch}</div><div class="${cls[1]}">${ch}</div>`;
  });
}

let homeTitleCount = 0;

// Home: the film title on each roll slide. When its slide settles (via the nav queue) the letters
// flicker after 2 s, then again every 6 s while the page is still.
export class HomeTitle {
  index = homeTitleCount++;
  constructor(el) {
    this.el = el;
    this.charTimelines = [];
    this.isScrolling = false;
    this.handleScroll = () => {
      this.isScrolling = true;
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
        if (this.index === state.SLIDER_SETTLED) this.startRepeatAnimation();
      }, 1000);
    };
    this.onSettled = () => {
      if (this.index !== state.SLIDER_SETTLED) return;
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
      clearTimeout(this.initialAnimationTimeout);
      this.initialAnimationTimeout = setTimeout(() => this.startRepeatAnimation(), 2000);
    };
    if (state.page === 'home') this.create();
  }
  create() {
    const first = this.el.textContent.toLowerCase().split(' ')[0].split("'");
    this.el.classList.add('split-line-wrapper', first[0]);
    this.split = new SplitText(this.el, { type: 'lines', linesClass: 'split-line-move' });
    this.rolloverSplit = new SplitText(this.split.lines, { type: 'chars', charsClass: 'split-rollover' });
    slotChars(this.rolloverSplit.chars, ['originalText2', 'cloneText2']);
    this.rolloverSplit.chars.forEach((c) => {
      const tl = gsap.timeline({ paused: true });
      gsap.set(c.children, { y: '18%' });
      tl.to(c.children, { yPercent: '-=100', repeat: gsap.utils.random(8, 14, 1), ease: 'none', duration: 1 });
      this.charTimelines.push(tl);
    });
    state.on('ON_QUEUE', this.onSettled);
    document.addEventListener('scroll', this.handleScroll);
  }
  playAnimation() {
    this.playTween?.kill();
    this.playTween = gsap.to(this.charTimelines, {
      progress: 1,
      duration: 2,
      stagger: { each: 0.04, ease: 'linear', from: 'random' },
      ease: 'expo.out',
      onComplete: () => gsap.set(this.charTimelines, { progress: 0 }),
    });
  }
  startRepeatAnimation() {
    if (this.repeatInterval) return;
    this.playAnimation();
    this.repeatInterval = setInterval(() => {
      if (!this.isScrolling && this.index === state.SLIDER_SETTLED) this.playAnimation();
    }, 6000);
  }
  destroy() {
    this.charTimelines.forEach((t) => t.kill());
    clearInterval(this.repeatInterval);
    clearTimeout(this.scrollTimeout);
    clearTimeout(this.initialAnimationTimeout);
    this.playTween?.kill();
    document.removeEventListener('scroll', this.handleScroll);
    state.off('ON_QUEUE', this.onSettled);
    homeTitleCount = 0;
  }
}

// [data-an="rollover"]: letters rise in and flicker 6–10 times on load (random order).
export class Rollover {
  constructor(el) {
    this.el = el;
    this.charTimelines = [];
    this.delay = +el.dataset.del + 0.5 || 0;
    this.split = new SplitText(el, { type: 'chars', charsClass: 'split-rollover' });
    slotChars(this.split.chars, ['originalText', 'cloneText']);
    this.split.chars.forEach((c) => {
      const tl = gsap.timeline({ paused: true });
      gsap.set(c, { yPercent: 115 });
      tl.to(c, { yPercent: 0, duration: 1, ease: 'linear' });
      tl.to(c.children, { yPercent: '-=115', repeat: gsap.utils.random(6, 10, 1), ease: 'none', duration: 1 });
      this.charTimelines.push(tl);
    });
    gsap.to(this.charTimelines, { progress: 1, duration: 2, stagger: { each: 0.1, from: 'random' }, ease: 'expo.out', delay: this.delay });
  }
  destroy() {
    this.charTimelines.forEach((t) => t.kill());
    this.split.revert();
    gsap.killTweensOf(this.el);
  }
}

// [data-an="rollover2"]: three stacked copies per letter scroll through once, 0.5 s after load.
export class Rollover2 {
  constructor(el) {
    this.split = new SplitText(el, { type: 'chars', charsClass: 'split-rollover' });
    this.split.chars.forEach((c) => {
      const d = document.createElement('div');
      d.classList.add('rollover');
      d.innerHTML = c.innerHTML;
      c.innerHTML = '';
      c.appendChild(d);
    });
    this.split.chars.forEach((c) => {
      for (let i = 0; i < 2; i++) {
        const d = document.createElement('div');
        d.classList.add('rollover');
        d.style.position = 'absolute';
        d.innerHTML = c.innerHTML;
        c.appendChild(d);
      }
    });
    gsap.set(this.split.chars, { yPercent: 100 });
    setTimeout(() => gsap.to(this.split.chars, { yPercent: -200, stagger: { from: 'random', amount: 0.2 } }), 500);
  }
}
