import { lerp, wrapHalf } from '../core/math.js';

// Film page: the draggable press-review carousel with prev/next and a progress mark.
export class Reviews {
  constructor(wrapper) {
    this.config = { dragSensitivity: 0.005, lerpFactor: 0.08 };
    this.wrapper = wrapper;
    this.items = [...document.querySelectorAll("[data-reviews='slide']")];
    this.current = 0;
    this.target = 0;
    this.isDragging = false;
    this.isVisible = false;
    this.prevNext = [...document.querySelector("[data-reviews='prevnext']").children];
    this.progressBar = document.querySelector("[data-reviews='progress']");
    this.setupViewport();
    this.observer = new IntersectionObserver((es) => es.forEach((e) => (this.isVisible = e.isIntersecting)), { root: null, rootMargin: '50px', threshold: 0 });
    this.observer.observe(this.wrapper);
    this.onDown = (e) => {
      this.isDragging = true;
      this.dragStart = e.clientX;
      this.dragStartTarget = this.target;
      this.wrapper.style.cursor = 'grabbing';
    };
    this.onMove = (e) => {
      if (this.isDragging) this.target = this.dragStartTarget + (e.clientX - this.dragStart) * this.config.dragSensitivity;
    };
    this.onUp = () => {
      this.isDragging = false;
      this.wrapper.style.cursor = 'grab';
    };
    this.onTouchStart = (e) => {
      e.preventDefault();
      this.onDown(e.touches[0]);
    };
    this.onTouchMove = (e) => {
      e.preventDefault();
      this.onMove(e.touches[0]);
    };
    this.onResize = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.setupViewport(), 100);
    };
    this.wrapper.addEventListener('mousedown', this.onDown);
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mouseup', this.onUp);
    this.wrapper.addEventListener('touchstart', this.onTouchStart);
    window.addEventListener('touchmove', this.onTouchMove);
    window.addEventListener('touchend', this.onUp);
    window.addEventListener('resize', this.onResize);
    this.wrapper.style.cursor = 'grab';
    this.prevNext.forEach((b, i) => b.addEventListener('click', () => (i === 0 ? this.goToPrev() : this.goToNext())));
    setTimeout(() => this.setupViewport(), 1000);
  }
  setupViewport() {
    this.viewport = {
      width: this.items[0].clientWidth,
      marginWidth: (this.wrapper.clientWidth - this.items[0].clientWidth) / 2,
    };
  }
  goToNext() {
    this.target = Math.round(this.target - 1);
  }
  goToPrev() {
    this.target = Math.round(this.target + 1);
  }
  get progress() {
    const n = this.items.length;
    return (Math.abs(this.current) % n) / n;
  }
  render() {
    if (this.isVisible) {
      this.current = lerp(this.current, this.target, this.config.lerpFactor);
      this.items.forEach((item, i) => {
        const x = (wrapHalf(this.current + i, this.items.length) - i) * this.viewport.width + this.viewport.marginWidth;
        item.style.transform = `translateX(${x}px)`;
      });
    }
    this.progressBar.style.transform = `translateX(${this.progress * 500}%)`;
  }
  destroy() {
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('mouseup', this.onUp);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onUp);
    window.removeEventListener('resize', this.onResize);
    this.wrapper.removeEventListener('mousedown', this.onDown);
    this.wrapper.removeEventListener('touchstart', this.onTouchStart);
    clearTimeout(this.resizeTimeout);
    this.observer.disconnect();
  }
}
