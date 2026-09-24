import { Mesh, Program, Triangle, RenderTarget } from 'ogl';
import { app } from '../core/app.js';
import { state } from '../core/state.js';
import { gl } from './gl.js';
import { tweaks } from './tweaks.js';
import { postFragment, postVertex } from './shaders.js';

// Home blurs vertically (the roll moves vertically), everything else horizontally.
const blurDirection = (page) => (page === 'home' ? [0, 1] : [1, 0]);
const blurPower = (page) => (page === 'home' ? 3 : 2);

class PostProgram extends Program {
  constructor(g) {
    super(g, {
      vertex: postVertex,
      fragment: postFragment,
      transparent: null,
      cullFace: null,
      uniforms: {
        u_time: { value: 0 },
        u_texture: { value: null },
        u_BULGE_RADIUS: { value: tweaks.post.bulge_radius },
        u_BULGE_STRENGTH: { value: tweaks.post.bulge_strength },
        u_NOISE_AMOUNT: { value: tweaks.post.noise_amount },
        u_FILM_POWER: { value: tweaks.post.film_power },
        u_a_blur_direction: { value: blurDirection(state.page) },
        u_a_blur_power: { value: blurPower(state.page) },
        u_a_speed: { value: 0 },
      },
    });
    state.on('page', (p) => {
      this.uniforms.u_a_blur_direction.value = blurDirection(p);
      this.uniforms.u_a_blur_power.value = blurPower(p);
    });
  }
  set time(t) {
    this.uniforms.u_time.value = t;
    this.uniforms.u_a_speed.value = (app.dom?.slider?.lspeed || 0) + (app.dom?.roll?.lspeed || 0);
  }
  set texture(t) {
    this.uniforms.u_texture.value = t;
  }
}

const target = () => new RenderTarget(gl.gl, { width: gl.vp.w * gl.vp.dpr(), height: gl.vp.h * gl.vp.dpr() });

export class Post {
  isActive = true;
  constructor() {
    this.rt = target();
    this.quad = new Mesh(gl.gl, { geometry: new Triangle(gl.gl), program: new PostProgram(gl.gl) });
    this.quad.program.texture = this.rt.texture;
  }
  resize() {
    this.rt = target();
  }
  render(t) {
    if (!this.isActive) {
      gl.renderer.render({ scene: gl.scene, camera: gl.camera });
      return;
    }
    gl.renderer.render({ scene: gl.scene, camera: gl.camera, target: this.rt });
    this.quad.program.texture = this.rt.texture;
    this.quad.program.time = t;
    gl.renderer.render({ scene: this.quad, camera: gl.camera });
  }
}
