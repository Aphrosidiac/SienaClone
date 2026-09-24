import Lenis from 'lenis';

const expoOut = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

// Page scroll: Lenis with a 1 s expo-out wheel, plus a subscriber list that scroll-tracked
// modules (Track) read y/speed/percent from.
export class Scroll extends Lenis {
  constructor() {
    super({ duration: 1, smoothWheel: true, easing: expoOut, orientation: 'vertical', smoothTouch: false, touchMultiplier: 2 });
    this.isActive = true;
    this.callbacks = [];
    this.y = window.scrollY;
    this.max = window.innerHeight;
    this.speed = 0;
    this.percent = this.y / (document.body.scrollHeight - window.innerHeight);
    this.on('scroll', ({ scroll, limit, velocity, progress }) => {
      this.y = scroll || 0;
      this.max = limit || window.innerHeight;
      this.speed = velocity || 0;
      this.percent = progress || 0;
      this.callbacks.forEach((c) => c.callback(this.y, this.speed, this.percent));
    });
  }
  to(y) {
    this.scrollTo(y, { offset: 0, duration: 0.8, easing: expoOut, immediate: false });
  }
  render(time) {
    if (this.isActive) this.raf(time);
  }
  subscribe(callback, id = Symbol()) {
    this.callbacks.push({ id, callback });
    return () => this.unsubscribe(id);
  }
  unsubscribe(id) {
    this.callbacks = this.callbacks.filter((c) => c.id !== id);
  }
}
