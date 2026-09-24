import gsap from 'gsap';
import { app } from '../core/app.js';
import { Track } from './track.js';

const mmss = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

// Film page: the trailer block. The poster scales up as it scrolls into view; clicking opens a
// full player (centres the block, locks scroll, fades the UI rows in), Escape or the darkened
// backdrop closes it.
export class VideoPlayer {
  isOpen = false;
  a = { scale: 0 };
  constructor(el) {
    const q = (s) => document.querySelector(s);
    this.trigger = q("[data-videoplayer='trigger']");
    this.close = q("[data-videoplayer='close']");
    this.dialog = q("[data-videoplayer='dialog']");
    this.img = q("[data-videoplayer='image']");
    this.ui = q("[data-videoplayer='ui']").children;
    this.video = q("[data-videoplayer='video']");
    this.darken = q("[data-videoplayer='darken']");
    this.scrub = q("[data-videoplayer='scrub']");
    this.controls = {
      total: q("[data-vid='total']"),
      curr: q("[data-vid='curr']"),
      play: q("[data-vid='play']"),
      sound: q("[data-vid='sound']"),
      progress: q("[data-vid='progress']"),
    };
    this.dialog.classList.remove('open');
    this.trigger.onclick = () => this.toggleState();
    this.close.onclick = (e) => {
      if (this.isOpening) return;
      e.preventDefault();
      e.stopPropagation();
      this.toggleState();
    };
    gsap.set(this.darken, { autoAlpha: 0 });
    this.subImg = this.img.querySelector('img');
    gsap.set(this.dialog, { autoAlpha: 0 });
    gsap.set(this.video, { autoAlpha: 0 });
    gsap.to(this.ui, { autoAlpha: 0, yPercent: 150 });
    this.el = el;
    this.track = new Track({ element: el });
    this.onKey = (e) => e.key === 'Escape' && this.closeModal();
    document.addEventListener('keydown', this.onKey);
    if (this.video.getAttribute('src')) {
      if (this.video.readyState === 4) this.setupVideo();
      else this.video.oncanplay = () => this.setupVideo();
    }
  }
  setupVideo() {
    this.video.oncanplay = null;
    this.controls.total.textContent = mmss(this.video.duration);
    this.controls.curr.textContent = '0:00';
    const toggle = () => {
      if (this.video.paused) {
        this.video.play();
        this.controls.play.classList.add('pause');
      } else {
        this.video.pause();
        this.controls.play.classList.remove('pause');
      }
    };
    this.controls.play.onclick = toggle;
    this.dialog.onclick = toggle;
    this.darken.onclick = () => this.toggleState();
    let scrubbing = false;
    const seek = (e) => {
      const r = this.scrub.getBoundingClientRect();
      const p = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      this.video.currentTime = p * this.video.duration;
      return p;
    };
    this.scrub.onmousedown = (e) => {
      scrubbing = true;
      seek(e);
    };
    this.scrub.onmousemove = (e) => {
      if (scrubbing) this.controls.progress.style.width = `${seek(e) * 100}%`;
    };
    document.onmouseup = () => (scrubbing = false);
    this.controls.sound.onclick = () => {
      this.video.muted = !this.video.muted;
      this.controls.sound.classList.toggle('muted');
      this.controls.sound.textContent = this.video.muted ? 'SOUND OFF' : 'SOUND ON';
    };
    this.video.ontimeupdate = () => {
      const t = this.video.currentTime;
      this.controls.curr.textContent = Number.isNaN(t) ? '00:00' : mmss(t);
      this.controls.progress.style.width = `${(t / this.video.duration) * 100}%`;
    };
  }
  toggleState() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.openModal();
      gsap.to(app.dom.menu.element, { autoAlpha: 0, duration: 0.6 });
    } else {
      this.closeModal();
      gsap.to(app.dom.menu.element, { autoAlpha: 1 });
    }
  }
  async openModal() {
    this.isOpening = true;
    const y = this.el.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2 - this.el.clientHeight / 2);
    app.scroll.to(y);
    setTimeout(() => app.scroll.stop(), 500);
    gsap.to(this.trigger, { autoAlpha: 0, duration: 0.2 });
    gsap.to(this.dialog, { autoAlpha: 1 });
    gsap.to(this.video, { autoAlpha: 1, delay: 0.6 });
    gsap.to(this.ui, { autoAlpha: 1, yPercent: 0, stagger: 0.12, duration: 0.5, delay: 0.4 });
    gsap.to(this.a, { scale: 1 });
    if (this.video.getAttribute('src')) {
      this.video.play();
      this.controls.play.classList.add('pause');
    }
    this.dialog.classList.toggle('open');
    await gsap.to(this.darken, { autoAlpha: 0.9, delay: 0.2 });
    this.isOpening = false;
  }
  async closeModal() {
    if (this.isOpening || !this.dialog.classList.contains('open')) return;
    this.isOpen = false;
    app.scroll.start();
    this.video.pause();
    gsap.to(this.video, { autoAlpha: 0 });
    gsap.to(this.trigger, { autoAlpha: 1 });
    gsap.to(this.ui, { autoAlpha: 0, yPercent: 150, duration: 0.4, delay: 0 });
    gsap.to(this.a, { scale: 0 });
    gsap.to(this.darken, { autoAlpha: 0, duration: 0 });
    await gsap.to(this.dialog, { autoAlpha: 0, duration: 0.02 });
    this.dialog.classList.toggle('open');
  }
  render() {
    let e = 1 - this.track.value;
    e = e * (1 - this.a.scale) + this.a.scale;
    if (app.isMobile) {
      this.img.style.transform = `scale(${e * 5 + 95}%)`;
      this.subImg.style.transform = `scale(${100 - e * 5 + 5}%)`;
    } else {
      this.img.style.transform = `scale(${e * 20 + 80}%)`;
      this.subImg.style.transform = `scale(${100 - e * 20 + 30}%)`;
    }
  }
  destroy() {
    document.removeEventListener('keydown', this.onKey);
    document.onmouseup = null;
    this.track.destroy();
    this.video.pause();
  }
}
