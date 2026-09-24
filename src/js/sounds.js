import { Howl } from 'howler';
import { app } from './core/app.js';

// UI sounds. Loaded on the first click (autoplay policy). [data-sound-hover="0"] plays the CTA
// tick on hover; [data-sound-hover="1"] plays the menu-open sound on every other click.
const LIB = ['/assets/media/cta_in.mp3', '/assets/media/cta_out.mp3', '/assets/media/menu_IN.mp3', '/assets/media/menu_OUT.mp3'];

export const sounds = {
  hasContext: false,
  sounds: [],
  items: [],
  load() {
    this.sounds = LIB.map((src) => new Howl({ src, volume: 0.5 }));
  },
  onPageChange() {
    if (!this.hasContext) return;
    this.items.forEach((el) => (el.onmouseenter = null));
    this.items = [];
    let open = false;
    document.querySelectorAll('[data-sound-hover]').forEach((el) => {
      const kind = +el.dataset.soundHover;
      if (kind === 0) el.onmouseenter = () => !app.isMobile && this.sounds[0].play();
      else if (kind === 1) {
        el.onclick = () => {
          if (app.isMobile) return;
          if (open) open = false;
          else {
            this.sounds[2].play();
            open = true;
          }
        };
      }
      this.items.push(el);
    });
  },
};

const first = () => {
  document.removeEventListener('click', first);
  sounds.hasContext = true;
  sounds.load();
  sounds.onPageChange();
};
document.addEventListener('click', first);
