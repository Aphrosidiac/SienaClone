import { Transform } from 'ogl';
import gsap from 'gsap';
import { state } from '../core/state.js';
import { glBounds } from './rect.js';
import { loadMasks } from './textures.js';
import { RollCard, SliderCard, Lightbox, pageAlpha } from './cards.js';

// Builds the page's GL content: the roll on home, the slider + footage lightboxes on work.
export class Scene extends Transform {
  constructor(g) {
    super();
    this.gl = g;
    this.animateIn = () => {
      state.off('PRELOADER_CLICKED', this.animateIn);
      gsap.to(pageAlpha, { alpha: 1, delay: 0.4 });
    };
    this.create();
  }
  async load() {
    this.assets ||= await loadMasks(this.gl);
    this.doms?.forEach((m) => (m.program.uniforms.u_mask.value = this.assets.mask_desk));
    this.lightboxes?.forEach((l) => l.images.forEach((m) => (m.program.uniforms.u_mask.value = this.assets.mask_desk)));
  }
  async create() {
    if (state.page === 'home') this.createHome();
    else if (state.page === 'work') this.createWork();
    this.load();
  }
  reveal() {
    state.LOADED_WEBGL = true;
    if (state.PRELOADER_CLICKED === true) gsap.to(pageAlpha, { alpha: 1, delay: 0.4 });
    else state.on('PRELOADER_CLICKED', this.animateIn);
  }
  async createHome() {
    this.doms = [...document.querySelectorAll('[data-roll="item"]')].map((item, i) => {
      const m = new RollCard(item.querySelector('img'), i);
      m.setParent(this);
      return m;
    });
    await Promise.all(this.doms.map((m) => m.load()));
    this.reveal();
  }
  async createWork() {
    this.footage = {
      item: document.querySelector("[data-footage='img']"),
      pos: [0, 0, 1, 1],
      resize: () => {
        const { centerx, centery, width, height } = glBounds(this.footage.item);
        this.footage.pos = [centerx, centery, width, height];
      },
    };
    this.footage.resize();
    const sets = [...document.querySelectorAll("[data-frames='lightbox']")].map((el) => JSON.parse(el.querySelector('script').textContent).items);
    this.lightboxes = sets.map((items, i) => new Lightbox(items, i));
    this.doms = [...document.querySelectorAll('[data-slider="item"]')].map((item, i) => {
      const m = new SliderCard(item.querySelector('img'), i);
      m.setParent(this);
      return m;
    });
    await Promise.all(this.doms.map((m) => m.load()));
    this.reveal();
  }
  async transitionOut() {
    state.LOADED_WEBGL = false;
    gsap.to(pageAlpha, { alpha: 0, delay: 0 });
    this.doms?.forEach((m) => {
      m.setParent(null);
      m.dispose();
    });
    this.lightboxes?.forEach((l) => l.destroy());
    this.doms = null;
    this.lightboxes = null;
    this.footage = null;
  }
  async transitionIn() {
    this.create();
  }
  render() {}
  resize(vp) {
    this.vp = vp;
    this.footage?.resize();
  }
}
