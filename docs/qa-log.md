# QA log — FF Siena

The instrument for all passes is headless Chromium (Playwright 1.63, SwiftShader WebGL) through `tools/*.mjs`. The same script runs on both sites. Headless rendering is used because the in-app pane and background tabs throttle rAF and timers, as noted in the skill.

Known limits of the instrument:
- **Frame rate.** SwiftShader renders at a low, variable frame rate, so lerped reels reach a given frame at different wall-clock times on each site. Comparisons therefore use settled frames: `tools/capture.mjs` waits until slide transforms and scroll position hold still (to the whole pixel) before each shot.
- **Load average.** The machine's load average was 80–220 during this session, from other sessions and apps. Anything timing-based is judged from settled states only.

## 2026-09-24

### Home: full entry flow (`tools/flow.mjs`)

- **Checked:** the full entry sequence: preloader, ENTER, reel spin-in, wheel steps, drag. Our build and the reference ran the same script.
- **Result:** the same sequence on both.
  - The intro film plays, ENTER appears, and the reel spins in with speed blur and the post-pass blow-out.
  - The nav film card follows the reel, and the title letters flicker on settle.
  - The tutorial player rises from the bottom.
  - Both reels come to rest on My Project X after the entrance.
- **Evidence:** `docs/qa/shots/enter-sheet.png` against `docs/reference/2026-09-24/shots/enter-sheet.png`.

### Network and console: 7 routes (`tools/check.mjs`)

- **Routes:** `/`, `/work`, `/about`, `/contact`, `/films/savoy`, `/terms`, `/nope`.
- **Found:** 8 × 404 for `/films/*` prefetches. Vite's MPA dev server does not map extensionless nested routes.
- **Fixed:** added a clean-URL dev middleware in `vite.config.js`. Cloudflare Pages maps these routes natively in production.
- **After the fix:**
  - no page errors and no console errors
  - **zero requests leave our origin** on any route
  - the only aborted request is the media range fetch the browser cancels by design
- **Not covered in dev:** `/nope` 404s without our 404 page, because Vite dev does not serve `404.html`. This has to be checked on a production build.

### Copy

- **Found:** the about hero read "FF DEV / FOUNDATION IS A". The swap replaced "SIENA FILM" but the second element holds "FOUNDATION IS A" with non-breaking spaces.
- **Fixed:** added a converter rule for that element. The page now reads "FF DEV / STUDIO IS A".

### Instrument corrections (same day)

1. **SwiftShader was too slow.** Software WebGL on this 8 GB machine (load average 80–220, 2.3 GB swap) managed about 2 shots/min, with screenshot timeouts on the reference's full-screen blur shaders. `tools/browser.mjs` now launches headless Chromium on the real GPU: ANGLE/Metal, confirmed as `ANGLE Metal Renderer: Apple A18 Pro`.
2. **Wheel steps were below the snap threshold.** 6 × 150 px moves the roll 0.45 of a slide, and both sites correctly snap back, so every step photographed the same film. Steps are now 10 × 250 px, which is 1.25 slides. The first "films stay the same" readout was the instrument, not the site.
3. **Settle check.** It compares transforms rounded to whole pixels. Unrounded, the sub-pixel lerp never read as settled, and every step waited out the full 25 s.

### Production build (`vite build` → `tools/serve-dist.mjs`, which serves like Cloudflare Pages)

- **Build fix:** the reference's `<link rel=prefetch|prerender href=/work>` hints broke the HTML bundler (EISDIR). The converter now marks them `vite-ignore`.
- **`dist`:** 143 MB. The largest file is 18.4 MB, under the Cloudflare Pages 25 MiB cap.
- **Route check:** 15 routes plus `/nope` through `tools/check.mjs`.
  - **Result:** clean. `/nope` returns 404 with our 404 page. No page or console errors.
  - **Reference defect found:** By Any Means sets its trailer `<video>` to a YouTube *page* URL, which a video element cannot play (Chromium blocks it: ERR_BLOCKED_BY_ORB). siena.film ships a dead trailer player there. We empty the src, so the page behaves like Outsider Freud, which ships `src=""`, and no request leaves our origin.
