# Royal Enfield Interactive Showcase

A single-page, scroll-driven showcase for Royal Enfield motorcycles: an editorial hero carousel, an interactive 3D Classic 350 (Three.js, Draco-compressed GLB), a parts archive, a bike collection with a test-ride booking form, and a contact section.

Built with React 18, Vite 6, Tailwind CSS v4, Three.js, GSAP (ScrollTrigger) and Lenis.

## Getting started

Requires Node.js 22 or newer (the QA scripts use Node's built-in `WebSocket`).

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload on port 5173 (also reachable on the LAN). |
| `npm run build` | Production build into `dist/`. Console calls are stripped. |
| `npm run preview` | Serves `dist/` on port 4173 with production-style cache headers. Run `build` first. |
| `npx tsc --noEmit` | Type-check `src/`. |

## Project layout

```text
Royal-enfield/
├── docs/
│   ├── reference-media/     # Design reference images, video and transition frames (not used by the app)
│   └── reports/             # Optimization plan and reports
├── plans/                   # Proposed work
├── public/                  # Files served at fixed URLs: 3D model, Draco decoder, bike/part images, video
├── scripts/                 # Maintenance scripts (asset optimization, GLB inspection)
├── src/
│   ├── components/          # Page sections (hero, 3D experience, parts, collection, booking, contact)
│   ├── data/                # Bike catalogue data
│   └── types/
├── tests/qa/                # Headless Chrome QA scripts, grouped by purpose
│   ├── capture/
│   ├── check/
│   ├── inspect/
│   ├── test/
│   └── verify/
├── testsprite-plans/        # TestSprite test plan definitions
├── index.html
└── vite.config.js
```

Everything in `public/` is referenced by URL (for example `/royal_enfield.glb`, `/bikes/classic-350.webp`), so keep those paths stable.

## QA scripts

The scripts in `tests/qa/` drive headless Chrome over the DevTools protocol against the running dev server. They are one-off checks and screenshot captures rather than a test suite with pass/fail reporting.

Prerequisites:

- `npm run dev` running on port 5173.
- Google Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- A `screenshots/` folder at the repo root. Several scripts write there without creating it, so run `mkdir screenshots` once.

Run them from the repository root:

```bash
node tests/qa/verify/verify-modal-submit.cjs
node tests/qa/capture/capture-parts.cjs
```

Screenshots go to `screenshots/` and temporary Chrome profiles to `chrome-temp-*/` at the repo root. Both are git-ignored.

Known exceptions:

- `tests/qa/capture/capture-contact-layout.cjs` targets port 5174 instead of 5173.
- `tests/qa/test/run-standalone-test.cjs` targets `/test-3d.html`, which no longer exists, so it cannot run as-is.

## Maintenance scripts

Run from the repository root:

| Command | Purpose |
| --- | --- |
| `node scripts/inspect-glb.js` | Decodes `public/royal_enfield.glb` (including Draco geometry) and prints mesh count, materials and bounding box. |
| `python scripts/optimize_assets.py` | Regenerates the `.webp` versions of the PNGs in `public/`. Requires Pillow. |

## TestSprite

Test plans live in [`testsprite-plans/`](./testsprite-plans/). See its [README](./testsprite-plans/README.md) for the project ID and the commands to register and run them. The TestSprite CLI is not an npm dependency of this project and must be installed separately.

Run evidence downloaded by the CLI is stored in `.testsprite/runs/`, which is git-ignored.
