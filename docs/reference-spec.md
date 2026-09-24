# Reference spec: siena.film

Provenance markers: `[measured]` means the value was extracted from the page, bundle or response body. `[observed]` means the behaviour was seen but not measured. `[inferred]` means it was reasoned from the surface and may be wrong.

## 1. Snapshot

- The reference is https://siena.film, crawled on 2026-09-24. `[measured]`
  - The HTML comment gives the last publish as 2025-03-09.
  - The site is served by Webflow through Cloudflare.
- The site loads one custom bundle, `siena-film-foundation.vercel.app/app.js` (429 KB), plus `main.css` and `out.css`. `[measured]`
- The raw material is saved in `docs/reference/2026-09-24/`:
  - raw HTML for 16 routes
  - the bundle and a prettified copy (`bundle/app.pretty.js`)
  - the app-only code regions (`bundle/app-only.js`)
  - the stylesheets
  - the asset manifest
- No A/B variant was seen. Every fetch returned a Cloudflare cache HIT with the same surrogate key. `[observed]`

## 2. Sitemap `[measured]`

The sitemap.xml lists only 7 URLs. The films are reachable from the nav and the work slider.

| Route | `data-page` | Template |
|---|---|---|
| `/` | home | WebGL film roll (vertical), 8 films |
| `/work` | work | WebGL film slider (horizontal) + footage mode (lightbox strips) |
| `/films/{slug}` ×8 | case | film page: hero, trailer player, credits, stills strips, reviews, festivals, next film |
| `/about` | about | statement, arched portraits, 3D image grid, founders, services |
| `/contact` | contact | contact block with letter rollovers |
| `/cookies`, `/privacy`, `/terms` | policy | legal text |
| 404 | 404 | rollover headline |

The 8 film slugs are:
- `savoy`
- `moon-in-the-12th-house`
- `taboo`
- `kafkas-last-trial`
- `my-project-x`
- `ana-maxim`
- `outsider-freud`
- `by-any-means`

## 3. Architecture of the reference `[measured]`

The Webflow markup and CSS carry no Webflow interactions (0 `data-w-id`). All behaviour is in the one custom bundle.

**Libraries in the bundle:**

| Library | Version |
|---|---|
| OGL | vendored |
| GSAP | 3.12.5, with SplitText, Flip and DrawSVG |
| Lenis | 1.1.16 |
| virtual-scroll | 2.x |
| Taxi | 1.x |
| Howler | 2.2.4 |
| lil-gui | 0.20, debug only, hidden |

**App structure:**
- One static `App` object ties the modules together:
  - Lenis for page scroll
  - Taxi as the router
  - a DOM layer: a selector→class registry, rebuilt per page
  - a GL layer: one OGL renderer and a post pass
- A global proxy state bus emits an event of the same name whenever a property is written. The events are:
  - `PRELOADER_CLICKED`
  - `LOADED_WEBGL`
  - `SLIDER_SETTLED`
  - `ON_QUEUE`
  - `FOOTAGE`, emitted through the nested `work` object
  - `ANIMATE_IN`
  - `page`
- Everything is driven from `gsap.ticker`, in this order each frame:
  1. mouse lerp (0.2)
  2. Lenis raf
  3. DOM renders
  4. GL render

## 4. Preloader `[measured]`

- **Intro films:** `logo_intro_desktop.mp4` (2160×1440, 60 fps, 4.05 s) and `intro_mobile.mp4` (1080×1920, 3.18 s).
- **Film content**, measured frame by frame:
  - background: cream `#FCF5EE`
  - desktop stripes: 32 vertical black stripes at a 67 px pitch, filling from 0.15 s to 2.35 s along a smoothstep curve (the fit is within ±2 px at every sample)
  - mobile stripes: 21 stripes at a 52 px pitch, 0.2 s to 2.0 s
  - the wordmark is drawn in difference mode across the stripes, 498×192 at (855, 623)
  - the subtitle blurs in from 2.4 s to 2.9 s
- **ENTER button:** appears at 3.5 s. Clicking it fades the screen out over 0.3 s and releases `PRELOADER_CLICKED`.
- **Cookie:** `preloader_shown` skips the intro for 1 h.

## 5. Page transitions `[measured]`

- **Leave:**
  - the view fades out over 0.2 s
  - DOM behaviours are torn down
  - GL page alpha tweens to 0
- **Enter:**
  - scroll jumps to 0
  - behaviours are rebuilt
  - the view fades in over 0.8 s, after a delay that depends on the page:

| Page | Delay before fade-in |
|---|---|
| home, work | 1.4 s |
| contact, 404 | 0 s |
| everything else | 0.6 s |

- **Nav:**
  - the logo fades in after 1.6 s on home and work, 0.6 s elsewhere
  - the menu card drops in from −200% over 1.2 s

## 6. Motion spec `[measured]`

**GSAP defaults:** `{duration: 1, ease: 'expo.out'}`

**Easing variables in the CSS:**
- `--easeOut: cubic-bezier(.77,0,.175,1)`
- `--customEase: cubic-bezier(.19,1,.22,1)`
- `--panels-duration: .9s`

**Home roll (vertical loop):**

| Parameter | Value |
|---|---|
| lerp | 0.05 desktop, 0.09 mobile |
| snap | target is pulled to the nearest integer at 0.1 |
| wheel | 0.001 per delta |
| drag | 0.005 per px |
| keys | ↑, ↓ and Space, with a 200 ms cooldown |
| entrance | parked at −160, then −60, released to 0 with speed 10, so the reel spins in |
| blur while moving | 10 px × speed |

**Work slider (horizontal):**

| Parameter | Value |
|---|---|
| lerp | 0.04 desktop, 0.12 mobile; 0.08 for 700 ms after a key press |
| entrance | −100, released to 0 with speed 5 |
| drag-direction mark | translates up to ±500% |

**Footage mode:**
- the focused card morphs into the footage frame over 0.8 s
- the other cards fly out ×4.5
- the lightbox strips enter over 1.2 s and exit over 0.8 s
- the strips drift at −1e‑4 × GL time

**Home title flicker:**
- each letter rolls 8–14 times over 2 s (expo.out, random stagger 0.04)
- it plays 2 s after its slide settles, then every 6 s while the page is still

**Reveal groups `[data-a="group"]`:**
- lines scaleX 0→1, alphas fade, items rise from 200%
- all over 1.2 s, with a 0.03 s stagger
- reset when the group leaves view

## 7. WebGL `[measured]`

- **Camera:** perspective, fov 25, z = 5. World units come from DOM rects. DPR is capped at 2.
- **Card masks:** one atlas `all-masks.webp`. The left 71.68% is the roll card shape and the right 28.32% is the slider card shape.
- **Home cards:**
  - warm colour-dodge on the corners
  - vertical fade
  - parallax 0.3
- **Work cards:**
  - sharp in the centre, blurred and darker toward the sides (blur13 kernel)
  - spread apart with speed
- **Post pass:**
  - bulge 0.1
  - grain 0.07
  - directional blur scaled by speed: vertical on home (power 3), horizontal elsewhere (power 2); on work the bottom 15% stays sharp

## 8. Responsive `[measured]`

- **Mobile flag:** user-agent based, counting tablets as mobile.
- **On mobile:**
  - the roll uses no drag handlers and no blur/parallax transforms
  - the work toggle slides the title instead of using Flip
  - the video-player scale range is 95–100% (80–100% on desktop)
- **Webflow breakpoints:** 991, 767 and 479.
- **Portrait lock:** a "Rotate your device" layer (`.div-block-44`) shows on narrow landscape.

## 9. SEO

- The reference sets per-page titles (`Siena Film Foundation | X`), a single site-wide description, and a Webflow OG image. `[measured]`
- Our pages use `FF Dev Studio | X` titles, the disclaimer as the description, and our own OG image (`/assets/brand/og.jpg`).

## 10. Provenance

**Taken from the reference and shipped as theirs**, covered by the in-page disclaimer:
- all film stills, trailers and posters
- the four UI sounds and the tutorial clip
- the three webfonts: Neue Brucke, P22 Parrish Roman, NB International
- the card-mask atlas
- the page copy about the films and team

**Replaced with FF:**
- the logo, re-cut for the 131×63 slot from the brand-system glyphs
- the intro films, re-rendered by `tools/intro/`
- favicon and OG image
- titles and meta
- emails and social links
- the menu ticket stub
- the about hero line
- the company name and address in the legal text
- the footer copyright, which now carries the disclaimer

**Code:** none of the reference's code ships. The markup and CSS are carried verbatim because behaviour is keyed to them. Behaviour is re-written in `src/js/`, with one module per reference class.

## 11. Deliberate deviations: defects fixed

1. **GL subscriber leak.** The resize/render subscriber lists never unsubscribed, because the filter compared ids the functions did not carry. Every page change leaked every mesh, and the leaked meshes kept rendering. Ours unsubscribes on dispose.
2. **Nav menu built twice.** The menu was instantiated twice per page, which doubled its listeners.
3. **Escape toggles the trailer dialog.** With the dialog closed, Escape toggled its `open` class anyway. After an Escape close, `isOpen` stayed true, so the next click needed two presses.
4. **By Any Means trailer.** The `<video>` pointed at a YouTube page URL, which cannot play (the browser blocks it: ERR_BLOCKED_BY_ORB). Ours ships `src=""`, as Outsider Freud does on the reference.
5. **Debug panel.** The hidden lil-gui panel (key `g`) is dropped. Its default values ship as constants.
6. **Console logs.** Stray `console.log('out' | 'init' | 'destroy')` calls are removed.
7. **Font race in title splits.** SplitText freezes line breaks when it runs, and the titles are sized in `ch`. The reference sometimes splits before its webfonts arrive and shows "MY / PROJECT / X" on 3 lines. Ours waits for `document.fonts.ready` and always gets the intended 2 lines.
8. **GSAP version.** 3.15 instead of 3.12.5, because SplitText, Flip and DrawSVG are only on npm from 3.13. Differences, if any, go in the QA log.

**Deliberate, from our identity:**
- The footer line carries the short disclaimer. At 390 px it wraps to 3 lines where the reference's "@siena. All Rights Reserved" takes 1, so pages with that footer are 25–26 px taller on phones.

**Kept as shipped, although odd:**
- the film-page reverse stills row is blurred only when the strip sits exactly at 0. This is an operator-precedence slip in the original.
- the credits marquee appends its clone once (the original's five `appendChild` calls on one node amount to one)
