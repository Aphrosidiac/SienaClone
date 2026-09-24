// FF Dev Studio demo — siena.film recreated. Entry: wires the shared app (scroll, router, DOM
// behaviours, WebGL) and drives everything from one GSAP ticker.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { app } from './js/core/app.js';
import { state } from './js/core/state.js';
import { mouse } from './js/core/mouse.js';
import { Scroll } from './js/core/scroll.js';
import { Preloader } from './js/preloader.js';
import { Pages } from './js/pages.js';
import { gl } from './js/gl/gl.js';
import { Dom } from './js/dom/dom.js';

gsap.registerPlugin(SplitText, Flip, DrawSVGPlugin);
gsap.defaults({ duration: 1, ease: 'expo.out' });

history.scrollRestoration = 'manual';
document.documentElement.style.setProperty('--100vh', `${window.innerHeight}px`);
state.work = { FOOTAGE: false };

const pre = document.querySelector('[data-preloader="w"]');
if (pre) new Preloader(pre);
else state.PRELOADER_CLICKED = true;

state.IS_MOBILE = app.isMobile;
app.scroll = new Scroll();
app.pages = new Pages();
app.gl = gl;
window.app = app; // handy in devtools and for the capture tools

queueMicrotask(() => {
  app.dom = new Dom();
  queueMicrotask(() => gl.init());
  gsap.ticker.add((time) => {
    mouse.render();
    app.scroll.render(time * 1000);
    app.dom.render();
    gl.render();
  });
});
