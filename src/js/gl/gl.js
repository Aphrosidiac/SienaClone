import { Renderer, Camera } from 'ogl';
import { state } from '../core/state.js';
import { resizeBus, renderBus } from './bus.js';

// Renderer, camera (fov 25 at z 5) and viewport maths. `init` builds the post pass and scene.
export const gl = {
  time: 0,
  vp: {
    container: document.querySelector('[data-gl="c"]'),
    w: window.innerWidth,
    h: window.innerHeight,
    aspect: () => gl.vp.w / gl.vp.h,
    dpr: () => Math.min(window.devicePixelRatio, 2),
  },
  async init() {
    const [{ Post }, { Scene }] = await Promise.all([import('./post.js'), import('./scene.js')]);
    this.resize();
    this.post = new Post();
    this.scene = new Scene(this.gl);
    this.time = 0;
    new ResizeObserver((e) => this.resize(e[0].contentRect)).observe(this.vp.container);
  },
  render() {
    this.time += 0.1;
    this.scene?.render(this.time);
    renderBus.call(this.time);
    this.post?.render(this.time);
  },
  resize({ width = window.innerWidth, height = window.innerHeight } = {}) {
    this.vp.w = width;
    this.vp.h = height;
    this.vp.viewSize = this.viewSize;
    this.vp.viewRatio = this.vp.viewSize.w / this.vp.w;
    this.vp.px = this.pixel;
    this.post?.resize(this.vp);
    state.windowWidth = window.innerWidth;
    resizeBus.call(this.vp);
    this.renderer.setSize(this.vp.w, this.vp.h);
    this.camera.perspective({ aspect: this.vp.aspect() });
    this.scene?.resize(this.vp);
  },
  get viewSize() {
    const fov = (this.camera.fov * Math.PI) / 180;
    const h = Math.abs(this.camera.position.z * Math.tan(fov / 2) * 2);
    return { w: h * (this.vp.w / this.vp.h), h };
  },
  // world units per CSS pixel
  get pixel() {
    const v = this.viewSize;
    return (v.w / this.vp.w + v.h / this.vp.h) / 2;
  },
  async transitionIn() {
    this.scene.transitionIn();
  },
  async transitionOut() {
    this.scene.transitionOut();
  },
};

gl.renderer = new Renderer({ dpr: gl.vp.dpr() });
gl.gl = gl.renderer.gl;
gl.gl.clearColor(0, 0, 0, 1);
gl.vp.container.appendChild(gl.gl.canvas);
gl.camera = new Camera(gl.gl, { fov: 25 });
gl.camera.position.set(0, 0, 5);
