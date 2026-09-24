// Shared Playwright launcher for the capture/probe tools.
import { chromium } from 'playwright';
export async function launch() {
  return chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
