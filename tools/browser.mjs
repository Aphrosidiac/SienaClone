// Shared Playwright launcher for the capture/probe tools. WebGL runs on the real GPU through
// ANGLE/Metal; SwiftShader (software) made the reference's blur shaders crawl on this machine.
import { chromium } from 'playwright';
export async function launch() {
  return chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  });
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
