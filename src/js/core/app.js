// The app singleton the modules share (the reference's static `App`): device flag, scroll,
// router, DOM and GL layers. Populated by src/main.js.
import { isPhoneOrTablet } from './device.js';

export const app = {
  isMobile: isPhoneOrTablet(),
  scroll: null,
  pages: null,
  dom: null,
  gl: null,
};
