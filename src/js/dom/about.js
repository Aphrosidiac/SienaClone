import gsap from 'gsap';
import { app } from '../core/app.js';
import { lerp } from '../core/math.js';
import { Track } from './track.js';

// About: the big statement block — its four sections slide in/apart, scrubbed by scroll.
export class AboutText extends Track {
  lvalue = 0;
  constructor(el) {
    super({ element: el, config: {} });
    this.sections = [...el.children];
    this.tl = this.build();
  }
  build() {
    const s = this.sections;
    const tl = gsap.timeline({ paused: true, ease: 'linear', defaults: { duration: 1, ease: 'linear' } });
    const a = gsap.timeline();
    tl.add(a);
    a.from(s[0].children, { xPercent: 50, duration: 0.8, stagger: 0.07 });

    const b = gsap.timeline();
    tl.add(b, 0);
    const rows = s[1].children[0].children;
    b.fromTo(rows[0].children[1], { xPercent: -10 }, { xPercent: 10 });
    b.fromTo(rows[1].children[1], { xPercent: 20 }, { xPercent: -20 }, '<');
    b.fromTo(rows[2].children[1], { xPercent: -10 }, { xPercent: 10 }, '<');
    b.fromTo(rows[3].children[1], { xPercent: 30 }, { xPercent: -50 }, '<');

    const c = gsap.timeline();
    tl.add(c, 0.1);
    const g = s[2].children[0];
    c.from(g.children[0].children[0], { xPercent: -50, duration: 0.9 });
    c.from(g.children[0].children[1], { xPercent: 50, duration: 0.9 }, '<');
    c.from(g.children[1].children[0], { scaleX: 2, xPercent: -20, duration: 0.8, delay: 0.1 }, '<');
    c.from(g.children[1].children[1], { xPercent: 20, duration: 0.8 }, '<');

    const d = gsap.timeline();
    tl.add(d, 0.2);
    const words = s[3].children[1].children[0];
    d.from(s[3].children[0], { xPercent: -50, duration: 0.8 });
    d.from(words.children[0], { xPercent: 50, duration: 0.8, stagger: { from: 'random', amount: 0.1 } }, '<');
    d.from(words.children[1], { xPercent: -20, duration: 0.8, stagger: { from: 'random', amount: 0.1 } }, '<');
    d.from(words.children[2], { xPercent: 50, duration: 0.8, stagger: { from: 'random', amount: 0.1 } }, '<');
    d.from(s[3].children[2], { xPercent: 20, yPercent: app.isMobile ? 200 : -200, duration: 0.8 }, '<');
    return tl;
  }
  render() {
    this.lvalue = lerp(this.lvalue, this.value, 0.1);
    this.tl?.seek(this.lvalue);
  }
}

// Offset of a grid cell from the grid centre, turned into an outward 3D start pose.
function fromCentre(el, dist = 10, rot = 300, depth = 2000) {
  const c = { width: window.innerWidth / 2, height: app.isMobile ? window.innerHeight / 5 : window.innerHeight / 2 };
  const p = { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 };
  const ang = Math.atan2(Math.abs(c.height - p.y), Math.abs(c.width - p.x));
  const dx = Math.abs(Math.cos(ang) * dist);
  const dy = Math.abs(Math.sin(ang) * dist);
  const d = Math.sqrt((c.width - p.x) ** 2 + (c.height - p.y) ** 2) / Math.sqrt(c.width ** 2 + c.height ** 2);
  return {
    x: p.x < c.width ? -dx : dx,
    y: p.y < c.height ? -dy : dy,
    z: depth * d,
    rotateX: (p.y < c.height ? -1 : 1) * (dy / dist) * rot * d,
    rotateY: (p.x < c.width ? 1 : -1) * (dx / dist) * rot * d,
  };
}

// About: the image grid assembles out of depth as it scrolls to centre.
export class AboutGrid extends Track {
  lvalue = 0;
  constructor(el) {
    super({ element: el, config: { top: 'center', bottom: 'bottom' } });
    this.grid = el.children[0];
    this.images = [...this.grid.children];
    this.tl = gsap
      .timeline({ defaults: { ease: 'linear' } })
      .set(this.grid, { perspective: 600 })
      .fromTo(
        this.images,
        {
          x: (i, t) => fromCentre(t, 900).x,
          y: (i, t) => fromCentre(t, 900).y,
          z: (i, t) => fromCentre(t, i, i, -3e3).z, // depth only uses the distance from centre
          rotateX: (i, t) => fromCentre(t, 250, -160, -3e3).rotateX,
          rotateY: (i, t) => fromCentre(t, 250, -160, -3e3).rotateY,
          autoAlpha: 0.05,
          scale: 0.4,
        },
        { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, autoAlpha: 1.2, scale: 1, duration: 1, stagger: { amount: 0.15, from: 'center', grid: [4, 9] } },
      );
  }
  render() {
    this.lvalue = lerp(this.lvalue, this.value, 0.1);
    this.tl?.seek(this.lvalue);
  }
}

// About: tall arched portrait — outline strokes undraw, image fades and settles from 1.5x.
export class TallArch {
  a = { scale: 1.5 };
  constructor(el) {
    this.el = el;
    this.img = el.querySelector('img');
    this.track = new Track({ element: document.querySelector('[data-track="abouthero"]'), config: { top: 'top', bottom: 'top' } });
    this.svg = [...el.querySelector('svg').querySelectorAll('.reveal')];
    gsap.set(this.img, { autoAlpha: 0 });
    setTimeout(() => this.animateIn(), 200);
  }
  animateIn() {
    if (this.svg.length) gsap.to(this.svg, { drawSVG: '0% 0%', stagger: 0.1 });
    gsap.to(this.img, { autoAlpha: 1, delay: 0.5 });
    gsap.to(this.a, { scale: 1, duration: 1.8, delay: 0.5 });
  }
  render() {
    this.img.style.transform = `translateY(${this.track.value * 10}%) scale(${this.a.scale})`;
  }
  destroy() {
    this.track.destroy();
  }
}

// About hero: alternating rows drift apart on scroll; the frame outline undraws on entry.
export class AboutHero {
  constructor(el) {
    this.el = el;
    this.track = new Track({ element: el, config: { top: 'top', bottom: 'top' } });
    this.items = el.querySelectorAll('[data-a="item"]');
    this.svg = document.querySelector("[data-reveal='svg']").querySelector('rect.reveal');
    setTimeout(() => gsap.to(this.svg, { drawSVG: '0% 0%', duration: 2 }), 200);
  }
  render() {
    this.items.forEach((item, i) => {
      item.parentElement.style.transform = `translateX(${this.track.value * 5 * (i % 2 === 0 ? 1 : -1)}%)`;
    });
  }
  destroy() {
    this.track.destroy();
  }
}
