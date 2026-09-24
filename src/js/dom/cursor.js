import { app } from '../core/app.js';
import { mouse } from '../core/mouse.js';

// Home: the round "SCROLL" cursor. Grows arrows over the top/bottom hitboxes (click = prev/next),
// hides over [data-cursor=hide] and when the pointer leaves the window.
export class Cursor {
  isDown = false;
  explore = document.querySelector('[data-btn="explore"]');
  constructor(el) {
    this.el = el;
    this.wrapper = el.parentElement.parentElement;
    this.word = el.querySelector("[data-cursor='text']");
    this.onMouseDown = () => {
      this.isDown = true;
      this.el.classList.add('pressed');
      this.explore?.classList.add('pressed');
    };
    this.onMouseUp = () => {
      this.isDown = false;
      this.el.classList.remove('pressed');
      this.explore?.classList.remove('pressed');
    };
    this.hides = document.querySelectorAll("[data-cursor='hide']");
    this.hitboxes = [...this.wrapper.querySelectorAll('[data-hitbox]')];
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    this.hitboxes.forEach((box, i) => {
      box.onclick = () => this.onHitbox(i);
      box.onmouseover = () => {
        this.el.classList.add('prevnext');
        this.el.classList.add(i === 0 ? 'top' : 'bottom');
      };
      box.onmouseout = () => this.el.classList.remove('prevnext', 'top', 'bottom');
    });
    this.hides.forEach((h) => {
      h.onmouseover = () => this.el.classList.add('hide');
      h.onmouseout = () => this.el.classList.remove('hide');
    });
    document.onmouseleave = () => this.el.classList.add('hide');
    document.onmouseenter = () => this.el.classList.remove('hide');
    this.word.textContent = 'SCROLL';
  }
  onHitbox(i) {
    const { roll, slider } = app.dom;
    if (i) {
      roll?.goToNextSlide();
      slider?.goToNextSlide();
    } else {
      roll?.goToPrevSlide();
      slider?.goToPrevSlide();
    }
  }
  render() {
    this.el.style.transform = `translate3d(${mouse.cex}px, ${mouse.cey}px, 0)`;
  }
  destroy() {
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    this.hitboxes.forEach((b) => (b.onclick = b.onmouseover = b.onmouseout = null));
    this.hides.forEach((h) => (h.onmouseover = h.onmouseout = null));
    document.onmouseleave = null;
    document.onmouseenter = null;
  }
}
