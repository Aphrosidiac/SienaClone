import VirtualScroll from 'virtual-scroll';
import { app } from '../core/app.js';
import { state } from '../core/state.js';
import { lerp, mod, wrapAround } from '../core/math.js';

// Home: a vertical, endlessly looping roll of film slides driven by wheel, drag and arrow keys.
// `current` is a float slide index (negative = forward); it lerps to `target`, which itself is
// pulled toward the nearest integer so the roll always settles on a slide.
class VerticalLoop {
  current = 0;
  target = 0;
  isScrolling = false;
  isDragging = false;
  dragStart = { x: 0, y: 0 };
  dragStartTarget = 0;
  lastKeyTime = 0;
  speed = 0;
  currentIndex = 0;
  isMoving = false;
  moveThrottle = 10;
  lastMoveTime = 0;

  constructor(wrapper, selector, config = {}) {
    this.config = {
      scrollSpeed: 0.001,
      lerpFactor: app.isMobile ? 0.09 : 0.05,
      mouseMultiplier: 0.5,
      touchMultiplier: 5,
      keyScrollCooldown: 200,
      dragSensitivity: 0.005,
      // the reference spreads a nested `roll` preset in here too; nothing reads it
      ...config,
    };
    this.wrapper = wrapper;
    this.items = [...document.querySelectorAll(selector)];
    this.vp = {
      height: 0,
      wrapperHeight: 0,
      marginHeight: 0,
      updateDimensions: () => {
        this.vp.height = this.items[0].clientHeight;
        this.vp.wrapperHeight = this.wrapper.clientHeight;
        this.vp.marginHeight = (this.vp.wrapperHeight - this.vp.height) / 2;
      },
    };
  }
  get settledIndex() {
    return mod(Math.round(-this.current), this.items.length);
  }
  init() {
    this.setupParallaxItems();
    this.vp.updateDimensions();
    this.setupScroller();
    this.setupDragHandlers();
    this.wrapper.style.cursor = 'grab';
    this.resizeHandler = this.handleResize.bind(this);
    this.keydownHandler = this.handleKeydown.bind(this);
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('keydown', this.keydownHandler);
  }
  setupParallaxItems() {
    this.parallaxItems = this.items
      .map((item) => {
        const els = [...item.querySelectorAll('[data-parallax]')].map((el) => ({ item: el, value: +el.dataset.parallax }));
        return els.length ? els : null;
      })
      .filter(Boolean);
  }
  setupDragHandlers() {
    if (app.isMobile) return;
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.onTouchStart = (e) => {
      e.preventDefault();
      this.handleMouseDown(e.touches[0]);
    };
    this.onTouchMove = (e) => {
      e.preventDefault();
      this.handleMouseMove(e.touches[0]);
    };
    this.wrapper.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.wrapper.addEventListener('touchstart', this.onTouchStart);
    window.addEventListener('touchmove', this.onTouchMove);
    window.addEventListener('touchend', this.handleMouseUp);
  }
  handleMouseDown(e) {
    this.isDragging = true;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.dragStartTarget = this.target;
    this.wrapper.style.cursor = 'grabbing';
  }
  handleMouseMove(e) {
    if (!this.isDragging) return;
    const now = Date.now();
    if (now - this.lastMoveTime < this.moveThrottle) return;
    this.lastMoveTime = now;
    const dy = e.clientY - this.dragStart.y;
    this.speed += dy * 2e-4;
    this.target = this.dragStartTarget + dy * this.config.dragSensitivity;
  }
  handleMouseUp() {
    this.isDragging = false;
    this.wrapper.style.cursor = 'grab';
  }
  setupScroller() {
    this.scroller = new VirtualScroll({
      mouseMultiplier: this.config.mouseMultiplier,
      touchMultiplier: this.config.touchMultiplier,
      firefoxMultiplier: 30,
      keyStep: 120,
      preventTouch: true,
      unpreventTouchClass: 'vs-touchmove-allowed',
      passive: true,
      useKeyboard: false,
    });
    this.scroller.on((e) => {
      const now = Date.now();
      if (now - this.lastMoveTime < this.moveThrottle) return;
      this.lastMoveTime = now;
      if (this.isDragging) return;
      this.isScrolling = true;
      this.speed += e.deltaY * 5e-4;
      this.target += e.deltaY * this.config.scrollSpeed;
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => (this.isScrolling = false), 150);
    });
  }
  updatePositions(pos) {
    this.parallaxValues = this.items.map((item, i) => {
      const o = wrapAround(pos + i, this.items.length / 2);
      const y = (o - i) * this.vp.height + this.vp.marginHeight;
      item.style.transform = `translate3d(0, ${y}px, 0)`;
      if (this.isMoving) item.style.willChange = 'transform';
      else if (item.style.willChange) item.style.willChange = 'auto';
      if (!app.isMobile) {
        item.style.filter = `blur(${this.lspeed * 10}px)`;
        this.parallaxItems[i]?.forEach((p) => {
          p.item.style.transform = `translate3d(0, ${o * p.value * 10}%, 0)`;
          if (this.isMoving) p.item.style.willChange = 'transform';
          else if (p.item.style.willChange) p.item.style.willChange = 'auto';
        });
      }
      return o;
    });
  }
  update() {
    this.target = lerp(this.target, Math.round(this.target), 0.1);
    this.current = lerp(this.current, this.target, this.config.lerpFactor);
    this.updatePositions(this.current);
    this.updateMovingClass();
    if (this.settledIndex !== this.currentIndex) {
      this.currentIndex = this.settledIndex;
      this.onSlideChange?.(this.currentIndex);
    }
    this.updateParent?.();
  }
  updateMovingClass() {
    const moving = this.isDragging || this.isScrolling;
    if (moving === this.isMoving) return;
    this.isMoving = moving;
    document.body.classList.toggle('moving', moving);
  }
  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.vp.updateDimensions();
      this.updatePositions(this.current);
    }, 100);
  }
  destroy() {
    clearTimeout(this.resizeTimeout);
    clearTimeout(this.scrollTimeout);
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('keydown', this.keydownHandler);
    if (this.handleMouseDown) {
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('mouseup', this.handleMouseUp);
      window.removeEventListener('touchmove', this.onTouchMove);
      window.removeEventListener('touchend', this.handleMouseUp);
      this.wrapper.removeEventListener('mousedown', this.handleMouseDown);
      this.wrapper.removeEventListener('touchstart', this.onTouchStart);
    }
    document.body.classList.remove('moving');
    this.scroller.destroy();
  }
  goToNextSlide() {
    this.target -= 1;
  }
  goToPrevSlide() {
    this.target += 1;
  }
  goToIndex(index) {
    const n = this.items.length;
    const at = -Math.round(this.target) % n;
    let d = (index % n) - at;
    if (Math.abs(d) > n / 2) d = d > 0 ? d + n : d - n;
    this.target -= d;
  }
  handleKeydown(e) {
    const now = Date.now();
    if (e.code === 'Space') e.preventDefault();
    if (now - this.lastKeyTime < this.config.keyScrollCooldown) {
      e.preventDefault();
      return;
    }
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      this.goToPrevSlide();
      this.lastKeyTime = now;
    } else if (e.code === 'ArrowDown' || e.code === 'Space') {
      e.preventDefault();
      this.goToNextSlide();
      this.lastKeyTime = now;
    }
  }
}

// Wraps each review block (figure + quote + source) in a parallax layer; deeper ones move more.
function wrapReviews(els) {
  els.forEach((el) => {
    el.innerHTML = el.innerHTML
      .split(/(?=<figure)/)
      .map((part, i) => (part.includes('<figure') && part.includes('<p') && part.includes('<h3') ? `<div data-parallax="${15 + i * 8}">${part}</div>` : part))
      .join('');
  });
}

export class Roll extends VerticalLoop {
  y = 0;
  lspeed = 0;
  triggers = [...document.querySelectorAll('[data-roll="menuItem"]')];
  constructor(wrapper) {
    super(wrapper, "[data-roll='item']");
    this.onWebglLoaded = () => {
      if (state.PRELOADER_CLICKED === true) this.animateIn();
      else state.on('PRELOADER_CLICKED', this.animateIn);
    };
    // entrance: parked 60 slides back, then released so the lerp spins the whole reel in
    this.animateIn = () => {
      state.off('PRELOADER_CLICKED', this.animateIn);
      this.current = this.target = -60;
      setTimeout(() => {
        if (!app.isMobile) this.speed = this.lspeed = 10;
        this.current = 0;
      }, 200);
    };
    this.reviews = [...document.querySelectorAll("[data-roll='reviews']")];
    wrapReviews(this.reviews);
    this.current = this.target = -160;
    state.on('LOADED_WEBGL', this.onWebglLoaded);
    this.trimTriggers = this.triggers.slice(this.triggers.length / 2);
    this.init();
    this.clicks = this.triggers.map((t, i) => {
      const fn = () => this.goToIndex(i);
      t.addEventListener('click', fn);
      return () => t.removeEventListener('click', fn);
    });
  }
  updateParent() {
    this.speed *= 0.85;
    this.lspeed = lerp(this.lspeed, Math.abs(this.speed), 0.1);
    this.y = this.current;
  }
  onSlideChange(i) {
    state.SLIDER_SETTLED = this.currentIndex;
    this.trimTriggers.forEach((t, n) => t.classList.toggle('current', n === i));
  }
  destroyParent() {
    this.destroy();
    this.clicks.forEach((off) => off());
    state.off('LOADED_WEBGL', this.onWebglLoaded);
    state.off('PRELOADER_CLICKED', this.animateIn);
  }
}
