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

### Measured visual pass: settled captures, GPU instrument (`tools/capture.mjs` + `tools/diff.py`)

- **Method:** 9 routes × 6 settled frames at 1440 on both sites. Measure: mean absolute difference, 0–255 greyscale.
- **Noise floor:**
  - Both sites run a post pass with animated grain, re-randomised every frame.
  - The reference against itself (two settled frames of the same state) gives **5.68** on work and **5.73** on home.
  - The same self-diff on a DOM-only page (about) gives **0.00**.
- **Results, production build:**
  - **work:** every frame at 6.05–6.07, which is the grain floor.
  - **home:** 5.3–7.9, which is grain plus the title-flicker phase. The flicker is timer-driven with random letter order, so it can't be pinned.
  - **about, contact, legal and film pages:** 0.4–2.3. The whole residue is the brand swap (logo, seal, footer disclaimer).
- **Document heights at 1440:** equal to the pixel on about (5646), Savoy (6096), Kafka (5309), Taboo (5046), terms (3004) and cookies (2302).
- **Evidence:**
  - reference shots in `docs/reference/2026-09-24/shots/cap/`
  - our shots in `docs/qa/shots/cap/` (dev) and `docs/qa/shots/cap-dist/` (production)

### Interaction pass (`tools/flow.mjs`, same script on both sites)

- **Checked on both sites:**
  - home: ↓↓, drag, and top-hitbox hover
  - work: →→, footage mode on, drag inside footage, footage mode off
- **Result:** same films land, and the same stills strips, poster-mode toggle and Flip title move appear.
- **Tutorial player:** both rise at 2.5–3.1 s after ENTER, step captions at the same moments (±0.5 s) and leave at 26.5–28 s. One reference frame without the player was its 18 MB clip still loading from the CDN.
- **Evidence:** `docs/qa/shots/interact-{ref,ours}/`

### Defects found and fixed in this pass

1. **Client-side navigation was broken.** Taxi calls `transition.leave()` and expects a Promise; our transition defined the hooks under the wrong names. It now extends Taxi's `Transition` with `onLeave`/`onEnter`.
   - Retested: home → My Project X (via EXPLORE) → home by logo.
   - The GL scene holds 8 meshes after the round trip, so nothing leaked. The reference's subscriber lists would have kept the old meshes.
2. **Titles split with the fallback font.** On the bundled build, "MY PROJECT X" and "MOON IN THE 12TH HOUSE" wrapped wrong (330 px / 3 lines vs 390 px / 2 lines).
   - Cause: SplitText freezes line breaks when it runs, and the titles are sized in `ch`. The module ran before the webfonts loaded.
   - Fix: DOM behaviours are now built after `document.fonts.ready`.
   - Result: all 8 home titles match the reference exactly in width and line count.
   - **The reference has the same race.** One of its own first loads split "MY / PROJECT / X" into three lines (`docs/qa/shots/nav-ref/n0-home.png`).
3. **The footer and meta disclaimers named the wrong owner.** They read "Demo recreation of FF Dev Studio", because a later brand-swap rule rewrote the owner's name inside the disclaimer. Disclaimers are now inserted as placeholders and expanded after all swaps. `dist` now holds 28 short and 25 long disclaimers, all naming Siena Film Foundation, and 0 wrong.
4. **The dashed seal still carried the Siena wordmark.** It is an inline SVG in the footer of about, film and legal pages and on the about hero, so the text swaps missed it. The wordmark (53.8×20.8 at 17,53) is replaced by the FF mark on the same footprint.
5. **The work entrance started late (dev only).** On the dev server it began about 4 s late, because unbundled modules and raw images load slowly. On the production build it starts at 6.48 s against the reference's 6.07 s, which cleared the 35-point work-00 outlier (now 6.05).

### Phone width, 390×844 with a mobile user agent

- **Diffs:**
  - home: 7.8–8.2
  - work: 6.45
  - about, contact, film: 0.7–1.9
- **Page heights are 25–26 px taller than the reference** on the film and about pages. The cause is the footer disclaimer: it wraps to 3 lines (38 px) where "@siena. All Rights Reserved" takes 1 (13 px). This is deliberate, because the disclaimer has to name the owner. It is recorded, not fixed.
- The last-frame diffs of about 21 on those pages come entirely from that 25 px offset.

### Panels, player, reviews and sounds (flow.mjs + probes, both sites)

- **Nav:** the menu panel, the switch to the film picker and the close trigger match frame for frame.
- **Trailer:** opens and autoplays on both, 3.5 s in, with a total of 01:14. Escape pauses and closes it.
  - **Reference bug reproduced:** pressing Escape again with the player closed sets the dialog's `open` class back on. Ours stays closed.
- **Reviews:** "next" moves the progress mark to translateX 83.33% on both.
- **UI sounds:** all four mp3s load after the first click on both sites. A hover on `[data-sound-hover=0]` plus a click on `[data-sound-hover=1]` gives exactly 2 plays on both.

### Entry screen

- **Defect:** the disclaimer overlapped the ENTER button.
- **Fix:** it now sits at `bottom: calc(var(--gy) + 44px + 1.25rem)`.
- **Measured** at 320, 390, 768 and 1440:
  - 20 px clear of the button
  - no horizontal overflow
  - clear of the mark in the intro film

### Tablet, 768×1024

| Page | Diff |
|---|---|
| about | 0.06–0.76 |
| film | 0.4–3.4 |
| work | 6.36 (the grain floor) |
| home | 8.7–9.2 (grain, with both sites caught mid title-flicker) |

- Layout matches.
