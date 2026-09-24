import gsap from 'gsap';
import { state } from './core/state.js';

const COOKIE = 'preloader_shown';
const TTL = 60 * 60 * 1000;

const getCookie = (name) => {
  for (const part of document.cookie.split(';')) {
    const [k, v] = part.split('=').map((s) => s.trim());
    if (k === name) return v;
  }
  return null;
};

// Entry screen: the intro film plays, the ENTER button appears at 3.5 s, clicking it removes the
// screen and releases every PRELOADER_CLICKED listener. Skipped for an hour after it was passed.
export class Preloader {
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.video = wrapper.querySelector('video');
    this.btn = wrapper.querySelector('[data-preloader="btn"]');
    this.video.muted = true;
    this.video.autoplay = true;
    gsap.set(this.video, { opacity: 0 });
    if (this.shouldShow()) {
      gsap.to(this.video, { opacity: 1, duration: 0.1 });
      setTimeout(() => this.showButton(), 3500);
    } else {
      this.close();
    }
  }
  shouldShow() {
    const t = getCookie(COOKIE);
    return t ? Date.now() - parseInt(t, 10) > TTL : true;
  }
  showButton() {
    this.btn.onclick = () => this.close();
    gsap.to(this.btn, { autoAlpha: 1 });
  }
  close() {
    document.cookie = `${COOKIE}=${Date.now()}; expires=${new Date(Date.now() + TTL).toUTCString()}; path=/`;
    gsap.to(this.wrapper, {
      autoAlpha: 0,
      duration: 0.3,
      onComplete: () => {
        this.wrapper.remove();
        state.PRELOADER_CLICKED = true;
      },
    });
  }
}
