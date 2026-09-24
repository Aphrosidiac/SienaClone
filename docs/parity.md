# Parity ledger

**37/40 complete** — 29 done, 1 deferred, 2 omitted, 8 improved

## 404

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| 404-01 | 404 page with rollover digits | done | Production server returns 404 + page; visual matches reference at 390 and 1440 |  |

## a11y

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| A11Y-01 | Keyboard / reduced-motion pass | deferred | Not run | Reference has no reduced-motion handling; pending |

## about

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| ABT-01 | Statement scrub timeline, arch portraits, 3D image grid | done | settled diff 2026-09-24 (tools/capture.mjs+diff.py, GPU): about 0.4–1.9; height 5646 = reference |  |
| ABT-02 | Founders, services, our films sections | done | About captures match |  |

## brand

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| BRD-01 | Logo, seal, favicon, OG, titles, meta, emails, socials, legal name | improved | grep of dist: 0 wrong disclaimers, no siena.film links; seal swapped on 4 pages | FF identity |
| BRD-02 | Disclaimer names Siena Film Foundation everywhere | improved | dist: 28 short + 25 long, 0 wrong owner | Our addition |

## contact

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| CON-01 | Contact block with letter rollovers | done | settled diff 2026-09-24 (tools/capture.mjs+diff.py, GPU): contact 0.51 |  |

## film

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| CASE-01 | Hero title split + line/alpha reveals + scroll drift | done | settled diff 2026-09-24 (tools/capture.mjs+diff.py, GPU): Savoy/Kafka/Taboo 0.4–2.3 |  |
| CASE-02 | Trailer player (scale-in, controls, scrub, sound, Esc) | improved | Panels pass: trailer opens and autoplays (3.5 s, total 01:14 on both), Escape pauses+closes; Escape again re-opens the dialog class on reference only | Spec deviation 3 (Esc bug fixed) |
| CASE-03 | Stills strips driven by scroll (two directions) | done | Film captures match at settled scroll positions |  |
| CASE-04 | Reviews carousel (drag, prev/next, progress) | done | Panels pass: next → progress translateX 83.33% on both; frames match |  |
| CASE-05 | Next-film footer, credits marquee, logo colour over white | done | Film captures match to 1.9 (brand residue) |  |
| CASE-06 | By Any Means trailer | improved | YouTube page URL in <video> is dead on reference (ORB); ours src="" like Outsider Freud | Spec deviation 4 |

## global

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| NAV-01 | Logo + menu entrance (1.6 s home/work, 0.6 s else) | done | Nav frames match in nav/interaction passes |  |
| NAV-02 | Nav film card follows settled slide (800 ms queue) | done | Work: filmIndex→4 after entrance (debug probe); home arrow/drag passes show same film card as reference |  |
| NAV-03 | Menu panels (film picker, menu, footage panel, case panel) | done | Panels pass 2026-09-24 (flow.mjs, both sites): menu panel, film picker switch, close trigger — frames match (docs/qa/shots/panels-*) |  |
| NAV-04 | Custom SCROLL cursor, prev/next hitboxes | done | Hover-top shot matches reference (interaction pass h3) |  |
| SND-01 | UI sounds (hover tick, menu open) after first click | done | Sound probe on both: 4 mp3 load after first click; hover + menu click = 2 plays on both |  |
| TRN-01 | Taxi page transitions (fade 0.2/0.8 s, GL alpha) | done | Nav pass 2026-09-24: home→film→home on both sites, frames match; 8 GL meshes after round trip |  |
| TRN-02 | GL mesh cleanup across transitions | improved | Scene holds 8 meshes after round trip (reference leaks subscribers) | Deviation 1 in spec |

## home

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| HOME-01 | WebGL vertical film roll (masks, dodge corners, parallax) | done | settled diff 2026-09-24 (tools/capture.mjs+diff.py, GPU): home 5.3–7.9 vs reference self-noise 5.7 |  |
| HOME-02 | Reel spin-in entrance + post speed blur | done | Entry flow sheets match; both settle on My Project X |  |
| HOME-03 | Wheel / drag / arrow-key navigation with snap | done | Interaction pass: ↓↓ and drag land on same films as reference |  |
| HOME-04 | Title letter flicker on settle, repeats every 6 s | done | Visible mid-roll in both sites’ frames; timer logic ported 1:1 |  |
| HOME-05 | Title line splits (ch-sized, SplitText) | improved | All 8 titles equal reference width + line count on production build | Waits for fonts; reference races (spec deviation 7) |
| HOME-06 | Tutorial player (48 h cookie, 5 captions, 4.8 s steps) | done | Timed on both sites: rise 2.5–3.1 s, steps ±0.5 s, exit 26.5–28 s |  |

## infra

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| ANL-01 | Google Analytics | omitted | — | Not shipped in a demo |
| DBG-01 | lil-gui tuning panel | omitted | — | Debug tool; defaults shipped as constants |
| NET-01 | No requests leave our origin | done | check.mjs on 15 production routes: 0 external |  |
| NET-02 | Static build fits Cloudflare Pages limits | done | dist 143 MB, largest file 18.4 MB (<25 MiB) |  |

## legal

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| POL-01 | Cookies / privacy / terms | done | settled diff 2026-09-24 (tools/capture.mjs+diff.py, GPU): terms 1.3–3.4, cookies 1.3–1.9; heights equal |  |

## preloader

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| PRE-01 | Intro film (stripes → mark → subtitle), desktop + mobile | improved | Re-rendered FF films matched to measured timing (stripes 0.15–2.35 s smoothstep, subtitle 2.4–2.9 s); frame sheets compared | FF mark replaces baked Siena wordmark (brand swap) |
| PRE-02 | ENTER appears at 3.5 s, closes in 0.3 s, 1 h skip cookie | done | Code port of reference timings; flow.mjs entry runs on both sites; cookie skip used by every capture |  |
| PRE-03 | Demo disclaimer on entry screen | improved | Measured at 320/390/768/1440: 20 px clear of ENTER, no overflow (qa-log) | Our addition |

## responsive

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| RSP-01 | Phone layout 390 (roll, slider, film, about, contact) | done | 390 captures: 0.7–8.2; footer +25 px from disclaimer (deliberate) |  |
| RSP-02 | Rotate-device layer, 768 tablet | done | 768×1024 captures on both: about/film 0.06–3.4, work 6.36 (grain floor), home 8.7–9.2 (grain + title flicker mid-roll) | Rotate-device layer not exercised |

## work

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| WORK-01 | WebGL horizontal slider (centre sharp, sides blurred) | done | settled diff 2026-09-24 (tools/capture.mjs+diff.py, GPU): work 6.05–6.07, at grain floor |  |
| WORK-02 | Arrow/drag navigation, drag-direction mark | done | Interaction pass →→ lands Outsider Freud on both |  |
| WORK-03 | Footage mode: card morph, lightbox strips, Flip title | done | Interaction pass w2/w3/w4 match reference |  |
| WORK-04 | Explore link follows settled film | done | Code port (handleSettled sets href); nav pass EXPLORE opened correct film |  |

