import gsap from 'gsap';
import { state } from '../core/state.js';

const QUEUE_DELAY = 800;

// One film row in the nav's film switcher: only the current film's row (and its footage entry) shows.
class MenuFilm {
  constructor(item, i, { footage }) {
    this.i = i;
    this.item = item;
    this.footage = footage;
    if (state.page === 'case') {
      if (state.pageRef.case !== item.dataset.id) this.animateOut();
      else this.animateIn();
    }
  }
  animateOut() {
    this.alphaAnimation?.kill();
    gsap.set(this.footage, { autoAlpha: 0 });
    this.alphaAnimation = gsap.to(this.item, { autoAlpha: 0, duration: 0.4 });
  }
  animateIn() {
    gsap.set(this.footage, { autoAlpha: 1 });
    this.alphaAnimation = gsap.to(this.item, { autoAlpha: 1, duration: 0.4 });
  }
}

// The top-right nav card: a set of radio-like panels (film picker, menu), a footage panel on
// work, a case panel on film pages. Panels close on scroll and whenever the slider moves.
export class Menu {
  element = document.querySelector("[data-menu='w']");
  wrapper = document.querySelector('.nav-w');
  closeDiv = document.querySelector('.menu-close-trig');
  current = null;
  isOpen = false;
  filmIndex = 0;
  slideChangeQueue = [];
  slideChangeQueueTimer = null;

  constructor() {
    if (!this.element) return;
    this.setup();
    this.onSlideChange = (i) => this.queueSlide(i);
    this.onFootage = () => this.handleFootageView();
    state.on('SLIDER_SETTLED', this.onSlideChange);
    state.on('FOOTAGE', this.onFootage);

    let scrollLock;
    this.onScroll = () => {
      if (scrollLock) return;
      this.inputs?.forEach((input) => {
        input.checked = false;
        this.current = null;
        this.casePanel.classList.remove('open');
      });
      scrollLock = setTimeout(() => (scrollLock = null), 2000);
    };
    document.addEventListener('scroll', this.onScroll);

    const closeAll = () =>
      this.inputs.forEach((input) => {
        input.checked = false;
        this.current = null;
      });
    const currentLink = this.element.querySelector('.w--current');
    if (currentLink) currentLink.onclick = closeAll;
    this.observer = new MutationObserver((records) => {
      records.forEach((r) => {
        if (r.attributeName === 'class' && document.body.classList.contains('moving') && this.current !== null) {
          this.inputs[this.current].checked = false;
          this.current = null;
        }
      });
    });
    this.observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    this.closeDiv.onclick = closeAll;
  }
  animateIn() {
    gsap.to(this.element, { yPercent: 0, duration: 0.4 });
  }
  setup() {
    this.wrapper.classList.toggle('on-dark', state.page === 'contact');
    this.element.querySelectorAll('[data-animation-delay="stagger"]').forEach((el, i) => el.style.setProperty('--delay', `${i * 0.02}s`));
    this.inputs = [...this.element.querySelectorAll('input')];
    this.filmsWrapper = this.element.querySelector("[data-menu='films']");
    this.footagesWrapper = this.element.querySelector("[data-menu='footages']");
    this.films = [...this.filmsWrapper.children].map((el, i) => new MenuFilm(el, i, { footage: this.footagesWrapper.children[i] }));
    this.footagePanel = this.element.querySelector("[data-menu='footagepanel']");
    this.footagePanel.classList.remove('open');
    this.casePanel = this.element.querySelector("[data-menu='casepanel']");
    if (this.casePanel.classList.contains('open')) this.footagePanel.classList.remove('open');

    this.inputs.forEach((input, t) => {
      input.style.pointerEvents = 'none';
      input.parentElement.onclick = state.page === 'case' ? () => this.clickCase(t) : () => this.clickDefault(t);
    });
  }
  // film page: panel 0 is the case panel (a class toggle), panel 1 the menu (a checkbox)
  clickCase(t) {
    if (this.current === null) {
      if (t === 1) {
        this.inputs[t].checked = true;
        this.current = t;
      }
      if (t === 0) this.casePanel.classList.add('open');
      this.current = t;
    } else if (this.current === t) {
      this.inputs[this.current].checked = false;
      this.casePanel.classList.remove('open');
      this.current = null;
    } else if (this.current === 0) {
      this.casePanel.classList.remove('open');
      this.current = t;
      setTimeout(() => {
        this.inputs[1].checked = true;
        this.current = 1;
      }, 350);
    } else if (this.current === 1) {
      this.inputs[1].checked = false;
      setTimeout(() => {
        this.casePanel.classList.add('open');
        this.current = 0;
      }, 550);
    }
  }
  clickDefault(t) {
    if (t === 0 && state.work.FOOTAGE !== false) {
      let delay = 0;
      if (this.current === 1) {
        this.inputs[this.current].checked = false;
        this.current = null;
        delay = 450;
      }
      if (this.footagePanel.classList.contains('open')) this.footagePanel.classList.remove('open');
      else setTimeout(() => this.footagePanel.classList.add('open'), delay);
    } else if (this.current === t) {
      this.inputs[t].checked = false;
      this.current = null;
    } else if (this.current !== null) {
      this.inputs[this.current].checked = false;
      this.footagePanel.classList.remove('open');
      setTimeout(() => {
        this.inputs[t].checked = true;
        this.current = t;
      }, 550);
    } else {
      const wasOpen = this.footagePanel.classList.contains('open');
      if (wasOpen) this.footagePanel.classList.remove('open');
      setTimeout(() => {
        this.inputs[t].checked = true;
        this.current = t;
      }, wasOpen ? 450 : 0);
    }
  }
  // the film shown in the nav follows the slider, debounced so fast scrolling does not flicker it
  queueSlide(i) {
    if (!this.films || !this.slideChangeQueue) return;
    this.slideChangeQueue.push(i);
    clearTimeout(this.slideChangeQueueTimer);
    this.slideChangeQueueTimer = setTimeout(() => this.processQueue(), QUEUE_DELAY);
  }
  processQueue() {
    if (!this.slideChangeQueue || !this.films) return;
    const next = this.slideChangeQueue[this.slideChangeQueue.length - 1];
    if (this.films[this.filmIndex] && this.films[next]) {
      this.films[this.filmIndex].animateOut();
      this.filmIndex = next;
      this.films[this.filmIndex].animateIn();
      state.ON_QUEUE = this.filmIndex;
    }
  }
  handleFootageView() {
    if (!this.inputs) return;
    this.inputs.forEach((input) => {
      input.checked = false;
      this.current = null;
    });
    this.footagePanel.classList.remove('open');
  }
  destroy() {
    if (!this.element) return;
    state.off('SLIDER_SETTLED', this.onSlideChange);
    state.off('FOOTAGE', this.onFootage);
    document.removeEventListener('scroll', this.onScroll);
    this.observer?.disconnect();
    clearTimeout(this.slideChangeQueueTimer);
    this.slideChangeQueue = null;
    this.inputs?.forEach((input) => (input.parentElement.onclick = null));
    if (this.closeDiv) this.closeDiv.onclick = null;
    this.films?.forEach((f) => f.alphaAnimation?.kill());
    this.films = null;
    this.element = null;
  }
}
