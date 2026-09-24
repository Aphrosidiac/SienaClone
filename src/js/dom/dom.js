import { Menu } from './menu.js';
import { Roll } from './roll.js';
import { Slider } from './slider.js';
import { Cursor } from './cursor.js';
import { Reviews } from './reviews.js';
import { VideoPlayer } from './videoplayer.js';
import { CaseHero, CaseFootage, ParallaxImage, NextFilm, CaseTitle, LogoColor } from './case.js';
import { AboutText, AboutGrid, TallArch, AboutHero } from './about.js';
import { RevealGroup } from './reveal.js';
import { HomeTitle, Rollover, Rollover2 } from './text.js';
import { Tutorial, SvgResizer, Marquee, NavIntro } from './misc.js';

// Selector -> behaviour. Everything present in the current page view gets instantiated; the
// whole set is destroyed and rebuilt on every page transition.
const REGISTRY = [
  ['[data-cursor="home"]', Cursor],
  ['[data-reviews="wrapper"]', Reviews],
  ['[data-videoplayer="wrapper"]', VideoPlayer],
  ['[data-page="case"]', CaseHero],
  ['[data-a="parallaxImg"]', ParallaxImage],
  ['[data-nextCMS="w"]', NextFilm],
  ['[data-a="abouttext"]', AboutText],
  ['[data-a="aboutgrid"]', AboutGrid],
  ['[data-a="group"]', RevealGroup],
  ['h2.roll-cont-he', HomeTitle],
  ['.tall-arch-ratio', TallArch],
  ["[data-cs='title']", CaseTitle],
  ["[data-tutorial='w']", Tutorial],
  ["[data-an='rollover']", Rollover],
  ["[data-an='rollover2']", Rollover2],
  ["[data-track='abouthero']", AboutHero],
  ["[data-svg='resizer']", SvgResizer],
  ['[data-marquee="vertical"]', Marquee],
  ['.nav-w', NavIntro],
  ["[data-page='case']", LogoColor],
];

export class Dom {
  children = [];
  constructor() {
    this.create();
  }
  create() {
    this.menu = new Menu();
    const rollEl = document.querySelector("[data-roll='wrapper']");
    this.roll = rollEl ? new Roll(rollEl) : null;
    const sliderEl = document.querySelector("[data-slider='wrapper']");
    this.slider = sliderEl ? new Slider(sliderEl, '[data-slider="item"]') : null;
    const footageEl = document.querySelector("[data-footage='w']");
    this.caseFootage = footageEl ? new CaseFootage(footageEl) : null;
    this.children = REGISTRY.flatMap(([sel, Cls]) => [...document.querySelectorAll(sel)].map((el) => new Cls(el)));
  }
  render() {
    this.children.forEach((c) => c.render?.());
    this.roll?.update();
    this.slider?.update();
    this.caseFootage?.update();
  }
  resize() {}
  destroy() {
    this.roll?.destroyParent();
    this.slider?.destroyParent();
    this.caseFootage?.destroy();
    this.menu?.destroy();
    this.children.forEach((c) => c.destroy?.());
    this.roll = this.slider = this.caseFootage = null;
  }
  async transitionOut() {
    this.destroy();
  }
  async transitionIn() {
    this.create();
  }
}
