import { Core } from '@unseenco/taxi';
import gsap from 'gsap';
import { app } from './core/app.js';
import { state } from './core/state.js';
import { sounds } from './sounds.js';

class Fade {
  constructor({ wrapper }) {
    this.wrapper = wrapper;
  }
  leave({ from, done }) {
    app.pages.transitionOut(from).then(done);
  }
  enter({ to, done }) {
    app.pages.transitionIn(to).then(done);
  }
}

// Client-side navigation (Taxi). Leaving: the view fades in 0.2 s while DOM behaviours are torn
// down and GL cards fade out; entering: scroll resets, behaviours rebuild, the view fades back in.
// Home and work wait for their GL textures before revealing.
export class Pages extends Core {
  constructor() {
    super({
      links: 'a:not([target]):not([href^=\\#]):not([data-taxi-ignore])',
      removeOldContent: true,
      allowInterruption: false,
      bypassCache: false,
      transitions: { default: Fade },
    });
    this.wrapper = document.querySelector('[data-taxi]');
    this.current = document.querySelector('[data-page]')?.dataset.page;
    this.checkLoadState = () => {
      setTimeout(() => {
        const needsGl = this.current === 'work' || this.current === 'home';
        if (state.PRELOADER_CLICKED === true && (!needsGl || state.LOADED_WEBGL === true)) this.animateIn();
      }, 0);
    };
    state.page = this.current;
    state.pageRef = document.querySelector('[data-page]').dataset;
    state.on('PRELOADER_CLICKED', this.checkLoadState);
    state.on('LOADED_WEBGL', this.checkLoadState);
    this.checkLoadState();
  }
  async animateIn() {
    state.off('PRELOADER_CLICKED', this.checkLoadState);
    state.off('LOADED_WEBGL', this.checkLoadState);
    const delay = { work: 1.4, home: 1.4, contact: 0, 404: 0 }[state.page] ?? 0.6;
    state.ANIMATE_IN = true;
    gsap.to(this.wrapper, { autoAlpha: 1, duration: 0.8, delay });
  }
  async transitionOut(from) {
    state.ANIMATE_IN = false;
    await Promise.allSettled([gsap.to(this.wrapper, { autoAlpha: 0, duration: 0.2 }), app.dom.transitionOut(from), app.gl.transitionOut(from)]);
  }
  async transitionIn(to) {
    app.scroll.scrollTo(0, { immediate: true });
    state.ANIMATE_IN = true;
    state.page = to.dataset.page;
    state.pageRef = document.querySelector('[data-page]').dataset;
    this.current = to.dataset.page;
    sounds.onPageChange();
    await Promise.allSettled([this.animateIn(), app.dom.transitionIn(to), app.gl.transitionIn(to)]);
  }
}
