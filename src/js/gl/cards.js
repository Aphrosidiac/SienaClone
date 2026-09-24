import { Program, Plane, Texture } from 'ogl';
import gsap from 'gsap';
import { app } from '../core/app.js';
import { state } from '../core/state.js';
import { wrapAround } from '../core/math.js';
import { gl } from './gl.js';
import { DomMesh } from './mesh.js';
import { glBounds } from './rect.js';
import { resizeBus } from './bus.js';
import { loadTexture } from './textures.js';
import { tweaks } from './tweaks.js';
import * as S from './shaders.js';

// Page-level alpha every card multiplies by: 0 until the preloader is dismissed, 0 during a page exit.
export const pageAlpha = { alpha: 0 };

class CardProgram extends Program {
  constructor(g, vertex, fragment, extra) {
    super(g, { vertex, fragment, transparent: true, cullFace: null });
    this.uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: [1, 1] },
      u_diff: { value: new Texture(g) },
      u_diff_aspect: { value: [1, 1] },
      u_mask: { value: new Texture(g) },
      u_scale: { value: [1, 1] },
      u_a_effect: { value: 0 },
      u_a_parallax: { value: 0 },
      ...extra,
    };
  }
}

// ---- Home roll card: one per film, stacked vertically, looping around the current index ------
class RollProgram extends CardProgram {
  constructor(g) {
    super(g, S.rollVertex, S.rollFragment, {
      u_a_TIME_INFLUENCE: { value: 0 },
      u_a_GRID_SIZE: { value: tweaks.roll.grid_size },
      u_a_STRIP_SIZE: { value: tweaks.roll.grid_strips_width },
      u_a_page_alpha: { value: pageAlpha.alpha },
      u_mobile: { value: 0 },
    });
  }
  set time(t) {
    const roll = app.dom?.roll;
    if (!roll) return;
    this.uniforms.u_time.value = t * 0.1;
    this.uniforms.u_a_effect.value = tweaks.roll.effect - roll.lspeed * 0.2;
  }
}

export class RollCard extends DomMesh {
  constructor(img, i) {
    super(img, { geometry: new Plane(gl.gl), program: new RollProgram(gl.gl) });
    this.frustumCulled = false;
    this.i = i;
    this.roll = app.dom.roll;
    this.el.style.opacity = 0; // the DOM image is only the layout proxy; GL draws it
  }
  resize() {
    this.program.uniforms.u_resolution.value = this.node.ratio;
    this.program.uniforms.u_scale.value = [this.node.sx, this.node.sy];
  }
  async load() {
    const t = await loadTexture(gl.gl, this.el.src);
    this.program.uniforms.u_diff_aspect.value = t.a;
    this.program.uniforms.u_diff.value = t;
  }
  render(t) {
    this.program.time = t;
    this.program.uniforms.u_a_parallax.value = this.roll.parallaxValues?.[this.i] ?? 0;
    this.program.uniforms.u_a_page_alpha.value = pageAlpha.alpha;
    const h = this.el.clientHeight * gl.vp.px;
    const margin = this.roll.vp.marginHeight * gl.vp.px;
    const step = h + margin / 2;
    const o = wrapAround(-this.i - this.roll.y, this.roll.items.length / 2);
    this.position.y = o * step;
  }
}

// ---- Work slider card: horizontal strip; morphs into the footage frame when its footage opens --
class SliderProgram extends CardProgram {
  constructor(g) {
    super(g, S.sliderVertex, S.sliderFragment, {
      u_x: { value: 0 },
      u_y: { value: 0 },
      u_a_speed: { value: 0 },
      u_a_footage: { value: 0 },
      u_a_footage_focus: { value: 0 },
      u_a_footage_img: { value: [0, 0, 1, 1] },
      u_a_TIME_INFLUENCE: { value: 0 },
      u_a_GRID_SIZE: { value: tweaks.roll.grid_size },
      u_a_STRIP_SIZE: { value: tweaks.roll.grid_strips_width },
      u_a_page_alpha: { value: pageAlpha.alpha },
    });
  }
  set time(t) {
    const slider = app.dom?.slider;
    if (!slider) return;
    this.uniforms.u_time.value = t * 0.1;
    this.uniforms.u_a_effect.value = tweaks.roll.effect - slider.lspeed;
    this.uniforms.u_a_speed.value = slider.lspeed;
  }
}

export class SliderCard extends DomMesh {
  constructor(img, i) {
    super(img, { geometry: new Plane(gl.gl), program: new SliderProgram(gl.gl), frustumCulled: false });
    this.i = i;
    this.roll = app.dom.slider;
    this.el.style.opacity = 0;
    this.sides = this.el.parentElement.clientWidth - this.el.clientWidth;
    this.onFootage = (v) => this.handleFootageView(v);
  }
  resize() {
    this.sides = this.el.parentElement.clientWidth - this.el.clientWidth;
    const u = this.program.uniforms;
    u.u_resolution.value = this.node.ratio;
    u.u_scale.value = [this.node.sx, this.node.sy];
    u.u_y.value = this.node.y;
    queueMicrotask(() => {
      u.u_a_footage_img.value = gl.scene.footage.pos;
    });
  }
  async load() {
    const t = await loadTexture(gl.gl, this.el.src);
    this.program.uniforms.u_diff_aspect.value = t.a;
    this.program.uniforms.u_diff.value = t;
    state.on('FOOTAGE', this.onFootage);
  }
  render(t) {
    if (!app.dom.slider) return;
    this.program.time = t;
    const u = this.program.uniforms;
    u.u_a_parallax.value = this.roll.parallaxValues?.[this.i] ?? 0;
    u.u_a_page_alpha.value = pageAlpha.alpha;
    const w = this.el.parentElement.clientWidth * gl.vp.px;
    const sides = this.sides * gl.vp.px;
    const o = wrapAround(this.i + this.roll.y, this.roll.items.length / 2);
    u.u_x.value = o * (w + sides / 2);
  }
  handleFootageView(v) {
    const u = this.program.uniforms;
    if (v !== false) {
      if (this.i === v) gsap.to(u.u_a_footage_focus, { value: 1, duration: 0.8 });
      else gsap.to(u.u_a_footage, { value: 1, duration: 0.8 });
    } else {
      gsap.to(u.u_a_footage_focus, { value: 0, duration: 0.8 });
      gsap.to(u.u_a_footage, { value: 0, duration: 0.8 });
    }
  }
  dispose() {
    super.dispose();
    state.off('FOOTAGE', this.onFootage);
  }
}

// ---- Work footage lightbox: the stills of one film in two counter-scrolling rows ---------------
class StripProgram extends CardProgram {
  constructor(g) {
    super(g, S.stripVertex, S.stripFragment, {
      u_index: { value: 0 },
      u_TOTAL: { value: 0 },
      u_x: { value: 0 },
      u_a_in: { value: 0 },
      u_a_speed: { value: 0 },
    });
  }
  set time(t) {
    this.uniforms.u_time.value = t * 0.1;
  }
}

class StripImage extends DomMesh {
  visible = false;
  constructor(el, i, url, lightbox) {
    super(el, { geometry: new Plane(gl.gl), program: new StripProgram(gl.gl) }, { handleResize: false });
    this.i = i;
    this.lightbox = lightbox;
    this.program.uniforms.u_index.value = i;
    this.roll = app.dom.slider;
    this.load(url);
  }
  resize({ width, height, centerx, centery }) {
    Object.assign(this.node, { x: centerx, y: centery, sx: width, sy: height, ratio: [width, height], px: height });
    this.program.uniforms.u_resolution.value = this.node.ratio;
    this.program.uniforms.u_scale.value = [this.node.sx, this.node.sy];
  }
  async load(url) {
    const t = await loadTexture(gl.gl, url);
    const u = this.program.uniforms;
    u.u_diff_aspect.value = t.a;
    u.u_diff.value = t;
    u.u_TOTAL.value = this.lightbox.arr.length;
    this.visible = true;
    if (!this.lightbox.destroyed) this.setParent(gl.scene);
  }
  render(t) {
    if (!this.lightbox.isActive) return;
    this.program.time = t;
    const u = this.program.uniforms;
    u.u_x.value = this.roll.footagey;
    u.u_a_in.value = this.lightbox.a.in;
    u.u_a_speed.value = app.dom.slider?.lspeed || 0;
  }
}

export class Lightbox {
  el = document.querySelector('[data-frames="lightbox"]');
  isActive = false;
  a = { in: 0 };
  constructor(arr, i) {
    this.arr = arr;
    this.i = i;
    this.images = arr.map((item, n) => new StripImage(this.el, n, item.url, this));
    this.offResize = resizeBus.subscribe(() => this.resize());
    this.resize();
    this.onFootage = (v) => this.handleFootageView(v);
    state.on('FOOTAGE', this.onFootage);
  }
  resize() {
    const b = glBounds(this.el);
    this.images.forEach((img) => img.resize(b));
  }
  async handleFootageView(v) {
    if (v !== false) {
      if (v === this.i) {
        this.isActive = true;
        gsap.to(this.a, { in: 1, duration: 1.2 });
      }
    } else if (this.isActive) {
      await gsap.to(this.a, { in: 0, duration: 0.8 });
      this.isActive = false;
    }
  }
  destroy() {
    this.destroyed = true;
    this.images.forEach((img) => {
      img.setParent(null);
      img.dispose();
    });
    this.offResize();
    state.off('FOOTAGE', this.onFootage);
  }
}

