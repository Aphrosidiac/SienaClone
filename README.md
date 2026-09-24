# FF Siena

An FF Dev Studio portfolio demo: [siena.film](https://siena.film) (Siena Film Foundation) recreated 1:1, every animation included, under the FF mark.

**Demo recreation of Siena Film Foundation. Every film, still, video and word about the films belongs to Siena Film Foundation and its filmmakers. Not affiliated. Not a live site.**

- Live: https://ff-siena.pages.dev
- Stack: Vite static multi-page · OGL (WebGL film roll, slider, lightbox, post pass) · GSAP (SplitText, Flip, DrawSVG) · Lenis · Taxi · Howler
- `npm run dev` → :3164 · `npm run build` · `npm run deploy` (Cloudflare Pages direct upload)
- Pages are generated from the reference snapshot by `tools/convert_pages.py`; behaviour lives in `src/js/`, one module per reference behaviour.
- Docs: `docs/brief.md`, `docs/reference-spec.md` (measured spec + deviations), `docs/qa-log.md`, `docs/parity.md`
