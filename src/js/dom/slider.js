import VirtualScroll from 'virtual-scroll';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { app } from '../core/app.js';
import { state } from '../core/state.js';
import { lerp, mod, wrapAround, map } from '../core/math.js';
import { gl } from '../gl/gl.js';

// Work: a horizontal, looping slider of films. In "footage" mode the slider freezes on the
// chosen film and wheel/drag instead drive that film's stills strip (footageCurrent), which
// also drifts on its own.
class HorizontalLoop {
  current = 0;
  footageCurrent = 0;
  target = 0;
  footageTarget = 0;
  isScrolling = false;
  isDragging = false;
  dragStart = 0;
  dragStartTarget = 0;
  dragDirection = 0;
  lastPos = 0;
  lastKeyTime = 0;
  speed = 0;
  lspeed = 0;
  currentIndex = 0;
  isMoving = false;
  isActive = true;
  lerpResetTimeout = null;

  constructor(wrapper, selector, config = {}) {
    this.config = {
      scrollSpeed: 0.001,
      lerpFactor: app.isMobile ? 0.12 : 0.04,
      staticLerpFactor: app.isMobile ? 0.12 : 0.04,
      mouseMultiplier: 0.5,
      touchMultiplier: 40,
      keyScrollCooldown: 200,
      dragSensitivity: 0.005,
      directionDecay: 0.95,
      directionSensitivity: 0.3,
      speedDecay: 0.95,
      ...config,
    };
    this.wrapper = wrapper;
    this.items = [...document.querySelectorAll(selector)];
    this.vp = {
      width: 0,
      wrapperWidth: 0,
      marginWidth: 0,
      updateDimensions: () => {
        this.vp.width = this.items[0].clientWidth;
        this.vp.wrapperWidth = this.wrapper.clientWidth;
        this.vp.marginWidth = (this.vp.wrapperWidth - this.vp.width) / 2;
      },
    };
  }
  get settledIndex() {
    return mod(Math.round(-(this.isActive ? this.current : this.footageCurrent)), this.items.length);
  }
  init() {
    this.parallaxItems = this.items
      .map((item) => {
        const els = [...item.querySelectorAll('[data-parallax]')].map((el) => ({ item: el, value: +el.dataset.parallax }));
        return els.length ? els : null;
      })
      .filter(Boolean);
    this.vp.updateDimensions();
    this.setupScroller();
    this.addEventListeners();
    this.wrapper.style.cursor = 'grab';
  }
  addEventListeners() {
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.onTouchStart = (e) => {
      if (!app.isMobile) e.preventDefault();
      this.handleMouseDown(e.touches[0]);
    };
    this.onTouchMove = (e) => {
      e.preventDefault();
      this.handleMouseMove(e.touches[0]);
    };
    this.extraTrigger = document.querySelector('[data-slider="additionaltrigger"]');
    this.wrapper.addEventListener('mousedown', this.handleMouseDown);
    this.extraTrigger?.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.wrapper.addEventListener('touchstart', this.onTouchStart);
    window.addEventListener('touchmove', this.onTouchMove);
    window.addEventListener('touchend', this.handleMouseUp);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeydown);
  }
  handleMouseDown(e) {
    this.dragDirection = 0;
    this.isDragging = true;
    this.dragStart = e.clientX;
    this.dragStartTarget = this.isActive ? this.target : this.footageTarget;
    this.wrapper.style.cursor = 'grabbing';
  }
  handleMouseMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStart;
    this.speed = map(dx * 5e-4, -0.5, 0.5, -1, 1);
    this.updateDirection((e.clientX - this.lastPos) * 0.003);
    this.lastPos = e.clientX;
    const t = this.dragStartTarget + dx * this.config.dragSensitivity;
    if (this.isActive) this.target = t;
    else this.footageTarget = t;
  }
  handleMouseUp() {
    this.isDragging = false;
    this.dragDirection = 0;
    this.wrapper.style.cursor = 'grab';
  }
  setupScroller() {
    this.scroller = new VirtualScroll({
      mouseMultiplier: this.config.mouseMultiplier,
      touchMultiplier: this.config.touchMultiplier + 20,
      firefoxMultiplier: 30,
      keyStep: 120,
      preventTouch: true,
      unpreventTouchClass: 'vs-touchmove-allowed',
      passive: true,
      useKeyboard: false,
    });
    this.scroller.on((e) => {
      if (this.isDragging) return;
      this.isScrolling = true;
      const d = (e.deltaY + e.deltaX) * this.config.scrollSpeed;
      if (this.isActive) this.target += d;
      else this.footageTarget += d;
      this.speed = map((e.deltaY + e.deltaX) * 15e-5, -0.2, 0.2, -1, 1);
      this.updateDirection(d * this.config.directionSensitivity);
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => (this.isScrolling = false), 150);
    });
  }
  updateDirection(v) {
    this.dragDirection = Math.max(-1, Math.min(1, this.dragDirection + v));
  }
  updatePositions(pos, moveItems) {
    this.speed *= 0.95;
    if (!app.isMobile) this.lspeed = lerp(this.lspeed, Math.abs(this.speed), 0.1);
    this.parallaxValues = this.items.map((item, i) => {
      const o = wrapAround(pos + i, this.items.length / 2);
      if (moveItems) item.style.transform = `translateX(${(o - i) * this.vp.width + this.vp.marginWidth}px)`;
      if (!app.isMobile) {
        this.parallaxItems[i]?.forEach((p) => {
          p.item.style.filter = `blur(${Math.abs(o) * p.value * 2}px)`;
          p.item.style.opacity = 1 - Math.abs(o) * 0.4;
          p.item.style.transform = `translateX(${o * Math.abs(this.lspeed) * 100}%)`;
        });
      }
      return o;
    });
  }
  update() {
    this.speed *= this.config.speedDecay;
    this.dragDirection *= this.config.directionDecay;
    this.speed = Math.max(-1, Math.min(1, this.speed));
    if (Math.abs(this.speed) < 0.001) this.speed = 0;
    if (Math.abs(this.dragDirection) < 0.001) this.dragDirection = 0;
    if (this.isActive) {
      this.target = lerp(this.target, Math.round(this.target), 0.1);
      this.current = lerp(this.current, this.target, this.config.lerpFactor);
      this.updatePositions(this.current, true);
    } else {
      this.footageCurrent = lerp(this.footageCurrent, this.footageTarget, this.config.lerpFactor);
      this.footageCurrent -= gl.time * (app.isMobile ? 0.02 : 1e-4);
      this.updatePositions(this.footageCurrent, false);
    }
    const moving = this.isDragging || this.isScrolling;
    if (moving !== this.isMoving) {
      this.isMoving = moving;
      document.body.classList.toggle('moving', moving);
    }
    if (this.settledIndex !== this.currentIndex) {
      this.currentIndex = this.settledIndex;
      if (this.isActive) this.onSlideChange?.(this.currentIndex);
    }
    this.updateParent?.();
  }
  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.vp.updateDimensions();
      this.updatePositions(this.current, true);
      this.updatePositions(this.footageCurrent, false);
    }, 100);
  }
  handleKeydown(e) {
    const now = Date.now();
    if (now - this.lastKeyTime < this.config.keyScrollCooldown) {
      e.preventDefault();
      return;
    }
    clearTimeout(this.lerpResetTimeout);
    this.config.lerpFactor = 0.08;
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      this.goToPrevSlide();
      this.lastKeyTime = now;
    } else if (e.code === 'ArrowRight' || e.code === 'Space') {
      e.preventDefault();
      this.goToNextSlide();
      this.lastKeyTime = now;
    }
    this.lerpResetTimeout = setTimeout(() => (this.config.lerpFactor = this.config.staticLerpFactor), this.config.keyScrollCooldown + 500);
  }
  goToNextSlide() {
    if (this.isActive) this.target = Math.round(this.target) - 1;
    else this.footageTarget = Math.round(this.footageTarget) - 1;
  }
  goToPrevSlide() {
    if (this.isActive) this.target = Math.round(this.target) + 1;
    else this.footageTarget = Math.round(this.footageTarget) + 1;
  }
  goToIndex(index) {
    const n = this.items.length;
    const at = -Math.round(this.target) % n;
    let d = (index % n) - at;
    if (Math.abs(d) > n / 2) d = d > 0 ? d + n : d - n;
    if (this.isActive) this.target -= d;
  }
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.handleMouseUp);
    this.wrapper.removeEventListener('mousedown', this.handleMouseDown);
    this.wrapper.removeEventListener('touchstart', this.onTouchStart);
    this.extraTrigger?.removeEventListener('mousedown', this.handleMouseDown);
    clearTimeout(this.resizeTimeout);
    clearTimeout(this.scrollTimeout);
    clearTimeout(this.lerpResetTimeout);
    document.body.classList.remove('moving');
    this.scroller.destroy();
  }
}

// ---- Flip the film title and meta block into the footage panel and back -----------------------
let titleMoved = null;
let shortTitle = false;
let shortTitleLength = null;
function flipTitle(pair) {
  if (pair) {
    const len = pair[1].querySelector('h2').textContent.length;
    if (len < 10) {
      shortTitle = true;
      shortTitleLength = len;
      gsap.to(pair[1].children, { duration: 0.8, ease: 'expo.out', y: '2.5rem' });
    }
    const s = Flip.getState(pair);
    titleMoved = [pair[1], pair[1].parentElement];
    pair[0].appendChild(pair[1]);
    pair[1].style.textAlign = 'left';
    pair[1].style.alignItems = 'start';
    Flip.from(s, { duration: 1.2, ease: 'expo.out' });
  } else if (titleMoved) {
    if (shortTitle) {
      gsap.to(titleMoved[0].children, { duration: 0.8, ease: 'expo.out', y: '0rem' });
      shortTitle = false;
    }
    const s = Flip.getState(titleMoved);
    titleMoved[1].appendChild(titleMoved[0]);
    titleMoved[0].style.textAlign = 'center';
    titleMoved[0].style.alignItems = 'center';
    Flip.from(s, { duration: 1.2, scale: true });
    titleMoved = null;
  }
}
let metaMoved = null;
let metaShifted = false;
function flipMeta(pair) {
  if (pair) {
    const s = Flip.getState(pair);
    metaMoved = [pair[1], pair[1].parentElement];
    pair[0].appendChild(pair[1]);
    if (shortTitle) {
      metaShifted = true;
      gsap.to(pair[1].children, { duration: 0.8, ease: 'expo.out', xPercent: -(10 - shortTitleLength) * 10 });
    }
    Flip.from(s, { duration: 1.2, ease: 'expo.out' });
  } else if (metaMoved) {
    if (metaShifted) {
      gsap.to(metaMoved[0].children, { duration: 0.8, ease: 'expo.out', xPercent: 0 });
      metaShifted = false;
    }
    const s = Flip.getState(metaMoved);
    metaMoved[1].appendChild(metaMoved[0]);
    Flip.from(s, { duration: 1.2, scale: true });
    metaMoved = null;
  }
}

export class Slider extends HorizontalLoop {
  y = 0;
  footagey = 0;
  lDragDirection = 0;
  isAnimatingFootage = false;
  triggers = [...document.querySelectorAll('[data-roll="menuItem"]')];
  mark = document.querySelector('[data-slider="mark"]');
  link = document.querySelector('[data-slider="link"]');
  toggleWrapper = document.querySelector('[data-work="toggleWrapper"]');
  toggle = { mode: false, items: [...document.querySelector('[data-work="toggle"]').querySelectorAll('button')] };

  constructor(wrapper, selector = "[data-roll='item']") {
    super(wrapper, selector);
    this.onWebglLoaded = () => {
      if (state.PRELOADER_CLICKED === true) this.animateIn();
      else state.on('PRELOADER_CLICKED', this.animateIn);
    };
    this.animateIn = () => {
      state.off('PRELOADER_CLICKED', this.animateIn);
      this.current = this.target = -100;
      if (!app.isMobile) this.speed = this.lspeed = 5;
      setTimeout(() => (this.current = 0), 200);
    };
    this.handleSettled = (i) => {
      this.link.href = this.links[i];
      this.trimTriggers.forEach((t, n) => t.classList.toggle('current', n === i));
    };
    this.handleFootageView = (v) => this.footageView(v);

    this.links = this.items.map((item) => item.querySelector('a').href);
    this.link.href = this.links[0];
    this.texts = this.items.map((item) => item.querySelector('.roll-cont-item'));
    this.alt = this.items.map((item) => {
      const wrapper = item.querySelector("[data-alt='view']");
      return { wrapper, move: wrapper.querySelector("[data-alt='movey']"), hide: wrapper.querySelector("[data-alt='hide']") };
    });
    state.on('SLIDER_SETTLED', this.handleSettled);
    state.on('LOADED_WEBGL', this.onWebglLoaded);
    this.trimTriggers = this.triggers.slice(this.triggers.length / 2);
    this.init();

    this.clicks = this.triggers.map((t, i) => {
      const fn = () => this.goToIndex(i);
      t.addEventListener('click', fn);
      return () => t.removeEventListener('click', fn);
    });
    this.toggle.items.forEach((btn) => {
      btn.onclick = () => {
        if (this.isAnimatingFootage) return;
        this.toggleWrapper.classList.toggle('toggled');
        this.isAnimatingFootage = true;
        this.toggle.items[+this.toggle.mode].classList.remove('inactive');
        this.toggle.mode = !this.toggle.mode;
        this.toggle.items[+this.toggle.mode].classList.add('inactive');
        this.toggleMode();
      };
    });
    state.on('FOOTAGE', this.handleFootageView);
  }
  updateParent() {
    if (this.mark) {
      this.lDragDirection = lerp(this.lDragDirection, this.dragDirection, 0.05);
      this.mark.style.transform = `translateX(${this.lDragDirection * 500}%)`;
    }
    this.y = this.current;
    this.footagey = this.footageCurrent;
  }
  // footage mode on/off; on phones the film's alt view slides its title down instead of a Flip
  toggleMode() {
    const f = () => state.work.FOOTAGE;
    if (app.isMobile && f() !== false) {
      gsap.to(this.alt[f()].hide, { autoAlpha: 1, duration: 0.5, delay: 0.1 });
      gsap.to(this.alt[f()].move, { yPercent: 0, duration: 0.6 });
    }
    if (this.toggle.mode) {
      this.isActive = false;
      state.work.FOOTAGE = this.currentIndex;
    } else {
      this.isActive = true;
      state.work.FOOTAGE = false;
    }
    if (app.isMobile && f() !== false) {
      gsap.to(this.alt[f()].hide, { autoAlpha: 0, duration: 0.4 });
      const y = this.alt[f()].move.children[1].textContent.length > 9 ? 60 : 100;
      gsap.to(this.alt[f()].move, { yPercent: y, duration: 0.6 });
    }
  }
  footageView(v) {
    if (v !== false) {
      if (this.currentIndex === v) {
        const targets = [...document.querySelectorAll('[data-flip="target"]')];
        const items = [...this.items[this.currentIndex].querySelectorAll("[data-flip='item']")];
        targets[1].style.opacity = state.windowWidth < 1500 ? 0 : 1;
        if (!app.isMobile) {
          flipTitle([targets[0], items[0]]);
          flipMeta([targets[1], items[1]]);
        }
      }
      this.items.forEach((item, i) => {
        if (i === v) return;
        const o = wrapAround(this.current + i, this.items.length / 2);
        gsap.to(this.texts[i], { autoAlpha: 0, xPercent: o * 200, duration: 0.8 });
      });
      setTimeout(() => (this.isAnimatingFootage = false), 950);
    } else {
      if (!app.isMobile) {
        flipTitle();
        flipMeta();
      }
      this.items.forEach((item, i) => gsap.to(this.texts[i], { autoAlpha: 1, xPercent: 0, duration: 0.8 }));
      setTimeout(() => (this.isAnimatingFootage = false), 850);
    }
  }
  onSlideChange() {
    state.SLIDER_SETTLED = this.currentIndex;
  }
  destroyParent() {
    state.off('FOOTAGE', this.handleFootageView);
    state.off('SLIDER_SETTLED', this.handleSettled);
    state.off('LOADED_WEBGL', this.onWebglLoaded);
    state.off('PRELOADER_CLICKED', this.animateIn);
    state.work.FOOTAGE = false;
    this.destroy();
    this.clicks.forEach((off) => off());
    this.toggle.items.forEach((btn) => (btn.onclick = null));
  }
}
