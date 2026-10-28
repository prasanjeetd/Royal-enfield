# Repository arrangement plan

## Goal

Make the repository root easy to scan while preserving the current website, asset URLs, and test workflows. This is a file organization change; it does not redesign the app.

## Current layout

- `src/` contains the React app and is already grouped by components, data, and types.
- `public/` contains files served at fixed URLs, including the 3D model, bike images, and video.
- The root contains 47 `.cjs` QA scripts, `inspect-glb.js`, three optimization documents, six PNG reference images, one MP4 reference video, and `transition_frames/`.
- `testsprite-plans/` contains TestSprite plans. The plan README and installed TestSprite instructions refer to `./testsprite-plans`, so keep this directory at the root.
- `.testsprite/runs/` contains generated run evidence that is currently tracked by Git.
- `node_modules/` and `dist/` are generated and already ignored.

## Target layout

```text
Royal-enfield/
├── .agents/                         # Installed agent skills
├── .claude/                         # Installed Claude skills
├── docs/
│   ├── reference-media/             # Root-level PNG/MP4 references and frames
│   └── reports/                     # Optimization documents
├── plans/                            # Proposed work, including this plan
├── public/                           # Website assets; keep URLs stable
├── scripts/
│   ├── inspect-glb.js
│   └── optimize_assets.py
├── src/                              # React app; retain current layout
├── tests/
│   └── qa/
│       ├── capture/
│       ├── check/
│       ├── inspect/
│       ├── test/
│       └── verify/
├── testsprite-plans/                 # Keep current CLI path
├── .gitignore
├── README.md
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.js
```

## Move map

| Current location | Planned location | Notes |
| --- | --- | --- |
| Root `capture-*.cjs` (8) | `tests/qa/capture/` | Check screenshot and Chrome profile paths. |
| Root `check-*.cjs` (3) | `tests/qa/check/` | Check paths derived from `__dirname`. |
| Root `inspect-*.cjs` (5) | `tests/qa/inspect/` | Keep `inspect-glb.js` with maintenance scripts instead. |
| Root `test-*.cjs` (10) and `run-standalone-test.cjs` (1) | `tests/qa/test/` | Audit the standalone script's `/test-3d.html` target before documenting it as runnable. |
| Root `verify-*.cjs` (20) | `tests/qa/verify/` | Check screenshot destinations and local browser setup. |
| Root `inspect-glb.js` | `scripts/inspect-glb.js` | Its current model path names a file that does not exist; update it to the current model before relying on it. |
| Three root optimization `.md` files | `docs/reports/` | Repair relative links between reports and the plan. |
| Six root PNGs, one root MP4, `transition_frames/` | `docs/reference-media/` | No app source references to these root-level files were found. Preserve their names and contents. |
| `.testsprite/runs/` | Remain locally under `.testsprite/runs/` | Add to `.gitignore`; remove generated run files from the Git index only after checking no evidence needs to remain versioned. |

## Implementation order

1. Record `git status`, current build and type-check results, and the file inventory. Start from a clean working tree.
2. Create the target directories and move the documents and reference media with `git mv`. Update document links.
3. Move the QA scripts in groups. Search for `__dirname`, relative file paths, screenshot outputs, Chrome profile locations, and commands that assume scripts live at the root. Update paths and add documented root-based commands for the scripts that remain useful.
4. Move `inspect-glb.js`; repair its stale model path and verify that it can decode the compressed GLB before listing it as a supported command.
5. Add a root `README.md` with the project tree, `npm run dev`, `npm run build`, `npx tsc --noEmit`, and the TestSprite plan path.
6. Add `.testsprite/runs/` to `.gitignore`. If the run files are confirmed to be generated evidence, untrack them with `git rm --cached` so local copies remain available. Do not remove the TestSprite plan definitions.

## Verification and completion criteria

- `npm run build` and `npx tsc --noEmit` pass.
- The homepage, 3D model, bike images, and video still load from the same URLs.
- Representative moved capture and verify scripts run from the documented commands and write artifacts to intended ignored locations.
- A relevant TestSprite browser test reaches a terminal verdict after moving executable test code, following the repository's `testsprite-verify` instructions.
- No unintended files are deleted, `testsprite-plans/` still works at its existing path, and `git status` shows only the intended moves and documentation changes.
