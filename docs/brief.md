# Build brief — FF Siena (FF Dev Studio demo)

## Identity

- **Product name:** FF Siena (package `ff-siena`), an FF Dev Studio portfolio demo.
- **Owner / brand:** FF Dev Studio. The `//FF` mark and `Dev Studio` glyphs come from `ffdevstudio/brand-system/assets/svg`.
- **Whose site is the reference?** A third party's: Siena Film Foundation (siena.film). Their studio built it on Webflow with a custom bundle.
- **Asset decision (Fakhrul, 2026-09-24):** "can copy all assets". The build ships the reference's film stills, trailers, masks, fonts, sounds and film copy, as the RemyClone/StanzzaClone/EthanClone demos did. The honesty goes in the page itself:
  - the ENTER screen carries the full disclaimer: *Demo recreation of Siena Film Foundation by FF Dev Studio · Every film, still, video and word about the films belongs to Siena Film Foundation and its filmmakers · Not affiliated · Not a live site*
  - the footer line on every page and the meta description carry the short version.
- **Brand swaps:** nav/footer logo → FF logo built for the same 131×63 slot; the intro films (Siena wordmark baked in) → re-rendered FF films with the same timing (`tools/intro/`); titles, meta, OG image, favicon, contact addresses (`hello@ffdev.studio`), social links, the menu's "SIENA / ADMIT ONE" ticket stub, the about hero, and the legal boilerplate's company name and address → FF Dev Studio / Kuala Lumpur.
- **Left as written:** film credits that list Siena Film Foundation as a funder, and the about page's team biographies and mission lines. They are facts about the films and people, and the disclaimer covers them.

## Reference

- **URL:** https://siena.film (Webflow, last published 2025-03-09 per its HTML comment)
- **Want:** the whole site, 1:1: every page, every animation, WebGL included.
- **Access:** public. There is no login surface.
- **Snapshot:** 2026-09-24 → `docs/reference/2026-09-24/` (raw HTML for 16 routes, the bundle and its prettified copy, CSS, screenshots)
- **Assets:** `public/assets/` (353 files, 133 MiB); provenance in `docs/reference/2026-09-24/assets-manifest.tsv`

## Mode

SITE. There are no accounts and no persistent state. Only two cookies are set, the preloader cookie (1 h) and the tutorial cookie (48 h).

## Scope line

- **In scope:** home (the WebGL film roll), work (the WebGL slider plus the footage lightbox), 8 film pages, about, contact, cookies, privacy, terms, 404; the preloader, page transitions, nav film picker, custom cursor, UI sounds, and the tutorial player.
- **Not building:**
  - the reference's hidden lil-gui tuning panel. It is a debug tool, toggled with `g`. We ship its default values.
  - Google Analytics.
  - Webflow's runtime and jQuery. Nothing on the site uses Webflow interactions (0 `data-w-id`).
  - the unused 4K `animated_logo_black.mp4`. It is referenced only as a `data-src` and never loaded.
- **Parity target:** 1:1 visual and behavioural parity. The reference's defects are fixed where they break something, and each fix is recorded in the spec.

## Technical

- **Repo:** `~/Desktop/dev/SienaClone`. Not pushed yet.
- **Stack:** Vite static MPA with the reference's own libraries from npm. Versions:

  | Library | Version |
  |---|---|
  | OGL | 1.0.11 |
  | GSAP (SplitText, Flip, DrawSVG) | 3.15 |
  | Lenis | 1.1.16 (pinned to the reference's) |
  | @unseenco/taxi | 1.9 |
  | Howler | 2.2.4 |
  | virtual-scroll | 2.2 |

  The reference's markup and CSS are carried verbatim. Behaviour is re-written in `src/js/`, one readable module per behaviour.
- **Dev:** `npm run dev` → :3164 (launch.json `ff-siena`)
- **Hosting:** Cloudflare Pages direct upload, like the other FF demos. **Not deployed; ask first.**

## Gates

- [x] Gate 1: spec and tokens, in `docs/reference-spec.md`. Fakhrul's standing instruction for these demos is no questions, so the spec is recorded rather than held for review.
- [x] Gate 2: home built first and checked against the reference.
- [ ] Gate 3–4: verification passes and parity ledger, in `docs/qa-log.md` and `docs/parity.md`.
