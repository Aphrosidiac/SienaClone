import { Mesh } from 'ogl';
import { gl } from './gl.js';
import { glBounds } from './rect.js';
import { resizeBus, renderBus } from './bus.js';

// A GL mesh tracking a DOM element: on resize it reads the element's GL bounds into `node`,
// every frame it forwards time to the program and calls render().
export class DomMesh extends Mesh {
  node = { x: 0, y: 0, sx: 0, sy: 0, ratio: [1, 1], px: 1 };
  constructor(el, opts, config = { handleResize: true }) {
    super(gl.gl, opts);
    this.config = config;
    this.el = el;
    this.offResize = resizeBus.subscribe(() => this.measure());
    this.offRender = renderBus.subscribe((t) => this.tick(t));
    this.measure();
  }
  measure() {
    if (!this.config.handleResize) return;
    const { width, height, centerx, centery } = glBounds(this.el);
    Object.assign(this.node, { x: centerx, y: centery, sx: width, sy: height, ratio: [width, height], px: height });
    this.resize?.();
  }
  tick(t) {
    this.program.time = t;
    if (this.render) this.render(t);
    else {
      this.position.y = this.node.y;
      this.position.x = this.node.x;
    }
  }
  dispose() {
    this.offResize();
    this.offRender();
  }
}
