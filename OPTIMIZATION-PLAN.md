# Royal Enfield 3D — Performance Optimization Plan

Performance optimization tracking for the **Royal Enfield Pure Motorcycling** interactive showcase.

---

## Audit & Baseline Metrics

* **Stack:** Vite 6 + React 18 + Three.js (r186) + GSAP + Lenis + Tailwind CSS v4.
* **Active 3D Model:** `/public/royal_enfield.glb`, loaded via `GLTFLoader` in `Bike3DExperience.tsx`.
* **Scene Graph:** 1,486 nodes, 1,482 individual meshes, 20 materials, 1 embedded texture.
* **Original Asset Weight:** **25.52 MB (24.34 MiB / 25,524,336 bytes)** — primarily uncompressed geometry buffer streams.

---

## Phased Plan & Status

### ✅ Phase 1 — Asset Compression (COMPLETED)
* **Status:** **Completed & Verified**
* **Compression Format:** **Draco (`KHR_draco_mesh_compression`)**
* **Original Model Size:** **25.52 MB** (24.34 MiB)
* **Compressed Model Size:** **4.63 MB** (4,853,996 bytes)
* **Size Reduction:** **81% reduction on disk** (`2.29 MB` gzipped network wire transfer)
* **Fidelity Constraints:**
  * Geometry simplification / decimation explicitly **disabled** (`--simplify false`).
  * 100% of meshes (1,482), nodes (1,486), materials (20), UV coordinates, and normals preserved.
* **Loader Integration:**
  * Configured `DRACOLoader` with self-contained local decoders in `/public/draco/`.
  * Also enabled `MeshoptDecoder` on `GLTFLoader` for dual-format support.
* **Production Build:** **Passed** (`npm run build` in 16.57s with 0 errors).
* **Interactive 3D Verification:** **7/7 checks passed**:
  1. HTTP 200 model fetch and client-side WASM decompression with 0 console errors.
  2. Canvas and WebGL initialization with ACES Filmic tone mapping.
  3. Hotspot 01 (Engine) anchor & specification card verification.
  4. Hotspot 04 (Teardrop Tank) camera fly-to and coachline rendering.
  5. Interactive mouse-drag 3D rotation and inertia damping.
  6. Focus / Zoom mode controls and framing.
  7. Material reflections, chrome highlights, and shadow fidelity.

---

### ⏳ Phase 2 — Local HDRI & Environment Lighting (INDEPENDENTLY VERIFIED)
* **Status:** Verified complete in existing implementation.
* **Implementation:** Scene utilizes local Three.js procedural lighting (`DirectionalLight`, `HemisphereLight`, `AmbientLight`) and an offscreen canvas procedural contact shadow disc, eliminating external CDN HDRI requests.

---

### ✅ Phase 3 — Mobile Quality Tiering & Shadow Optimization (COMPLETED)
* **Status:** **Completed & Verified**
* **Mobile DPR Tiering:** Dynamic detection capping renderer pixel ratio to `1.0` on viewports `< 768px`, while preserving desktop cap at `Math.min(devicePixelRatio, 1.5)`. Responsive to dynamic viewport resize events.
* **Shadow Map Resolution:** Responsive shadow map resolution (`512 x 512` on mobile `< 768px`, `1024 x 1024` on desktop) with automatic WebGL shadow buffer reallocation on resize.
* **Selective Shadow Casting:** Evaluates sub-mesh names to exclude ~1,044 non-structural microscopic components (stitches, screws, bolts, washers, chain pins, dial ticks, bulb filaments, lens glass) from the directional light shadow map pass. Preserves 100% of major structural casting shadows (fuel tank, frame, wheels, tyres, mudguards, exhaust system, engine block, and saddle). All meshes retain ambient shading and shadow reception (`receiveShadow = true`).
* **Production Build:** Passed (`npm run build` in 41.89s with 0 errors).
* **Verification Results:** 10/10 checks passed:
  1. Desktop 3D WebGL canvas initialization and ACES Filmic tone mapping.
  2. Desktop DPR capping at 1.5 max.
  3. Hotspot 01 (Engine) default card rendering and spec verification.
  4. Hotspot 02 (Exhaust) click navigation and spec update.
  5. Hotspot 03 (Headlight) click navigation and spec update.
  6. Hotspot 04 (Tank) click navigation and spec update.
  7. Hotspot 05 (Seat) click navigation and spec update.
  8. Full View / Reset camera overview button.
  9. Zoom In / Zoom Out and pointer drag rotation with inertia.
  10. Mobile viewport emulation (390x844, DPR 3): measured DPR strictly clamped to `1.0` with `356x338` buffer width matching client width.

---

### ✅ Phase 4 — On-Demand Frameloop & Demand-Based Rendering (COMPLETED)
* **Status:** **Completed & Verified**
* **Frameloop Architecture:** Transitioned from continuous 60 fps idle rendering to strict on-demand rendering with settle damping. The loop sleeps (`animFrameId = null`) at exact 0 fps during idle states, dropping idle GPU utilization and thermal draw to zero.
* **Reactive Interaction Wake-Up:** The rendering loop activates instantly with full 60 fps fluid motion during:
  * Pointer drag rotation and decaying inertia flywheel damping (`factor: 0.90`).
  * Hotspot selection and camera flight interpolation.
  * Reset / Full View camera transition.
  * Zoom in / Zoom out controls and mouse wheel zooming.
  * Keyboard arrow navigation.
  * Dynamic viewport resizing.
* **Settle Damping:** Renders 8 settling frames once all motion, inertia, and camera positions settle within sub-pixel convergence thresholds, ensuring sub-pixel visual sharpness before entering idle sleep.
* **Production Build:** Passed (`npm run build` in 8.91s with 0 errors).
* **Verification Results:** 7/7 demand rendering checks passed:
  1. Initial idle state: measured exactly **0 frames** rendered during 2s of inactivity.
  2. Hotspot 02 (Exhaust) selection: woke up loop, rendered 97 smooth transition frames, updated specifications card, and returned to **0 frames** idle.
  3. Drag + inertia damping: rendered 92 smooth frames with realistic deceleration, then settled to 0 frames idle.
  4. Full View / Reset camera: rendered 70 smooth frames and settled to 0 frames idle.
  5. Zoom In control: rendered 49 smooth frames and settled to 0 frames idle.
  6. Responsive resize: rendered 9 frames updating canvas aspect and buffer, then returned to 0 frames idle.
  7. Final idle state: measured exactly **0 frames** rendered during subsequent inactivity.

---

### ✅ Phase 5 — Hosting & Cache Configuration (LOCALLY VERIFIED & CONFIGURED)
* **Status:** **Locally Verified & Configured (Hosting-Agnostic)**
* **Local Implementation:** Configured safe, route-specific caching headers for `npm run preview` via a native Vite plugin hook (`configurePreviewServer`) in `vite.config.js` with zero external dependencies.
* **Cache Header Policy:**
  * **Versioned Build Chunks (`/assets/*`):** Content-hashed JS/CSS bundles and Three.js vendor chunks are served with `Cache-Control: public, max-age=31536000, immutable`.
  * **Versioned Static Assets (e.g. `?v=...`):** Explicitly versioned assets (such as version-tagged 3D models or Draco decoders) receive `Cache-Control: public, max-age=31536000, immutable`.
  * **Application Entry Points (`/`, `/index.html`):** Served with `Cache-Control: public, max-age=0, must-revalidate` to ensure clients never cache stale HTML and always receive new application revisions immediately.
  * **Unversioned Static Assets (`/royal_enfield.glb`, `/draco/*` without version parameter):** Served with `Cache-Control: public, max-age=0, must-revalidate` allowing HTTP 304 Not Modified validation via ETag/Last-Modified without risk of serving stale assets if the model is re-exported.
* **Production Hosting Status:** Production hosting platform configuration (`_headers`, `vercel.json`, `nginx.conf`, or `netlify.toml`) deferred until target hosting provider is confirmed by user.
* **Verification Results:** 9/9 automated HTTP response checks passed on local preview server:
  1. `GET /` → `200 OK`, `Cache-Control: public, max-age=0, must-revalidate` (non-immutable)
  2. `GET /index.html` → `200 OK`, `Cache-Control: public, max-age=0, must-revalidate` (non-immutable)
  3. `GET /assets/index-*.js` → `200 OK`, `Cache-Control: public, max-age=31536000, immutable`
  4. `GET /assets/index-*.css` → `200 OK`, `Cache-Control: public, max-age=31536000, immutable`
  5. `GET /assets/vendor-three-*.js` → `200 OK`, `Cache-Control: public, max-age=31536000, immutable`
  6. `GET /royal_enfield.glb` → `200 OK`, `Cache-Control: public, max-age=0, must-revalidate` (safe against stale model edits)
  7. `GET /royal_enfield.glb?v=4.63mb` → `200 OK`, `Cache-Control: public, max-age=31536000, immutable`
  8. `GET /draco/draco_decoder.wasm` → `200 OK`, `Cache-Control: public, max-age=0, must-revalidate`
  9. `GET /draco/draco_decoder.wasm?v=1.5.7` → `200 OK`, `Cache-Control: public, max-age=31536000, immutable`

---

### ✅ Phase 6 — Low-End GPU & WebGL Poster Fallback (COMPLETED)
* **Status:** **Completed & Verified**
* **WebGL Capability Detection:** Integrated fail-safe `isWebGLAvailable()` pre-flight check testing WebGL 2.0 and WebGL 1.0 context initialization prior to Three.js scene startup. Wrapped renderer creation in defensive `try...catch` blocks to protect against driver blacklists or context creation crashes.
* **Context Loss & Restoration:** Attached `webglcontextlost` and `webglcontextrestored` event listeners on the canvas element. On graphics context loss, the frameloop is immediately stopped, memory is safely released, and the UI transitions seamlessly to the fallback state.
* **High-Fidelity Static Poster Showcase:**
  * Uses the official pre-optimized WebP asset `/bikes/classic-350.webp` (1672x941, 215 KB) for full motorcycle overview.
  * Dynamically swaps to existing high-res component WebP assets (`/engine.webp`, `/exhaust.webp`, `/headlight.webp`, `/tank.webp`, `/seat.webp`) as the user explores hotspots.
  * Styled with studio radial ambient glow, drop shadows, and soft ground contact shadow matching the 3D aesthetic.
  * Displays a non-intrusive status pill badge: `STATIC SHOWCASE • HARDWARE 3D ACCELERATION UNAVAILABLE`.
* **Interactivity & Usability Preservation:**
  * 100% of the specification panel, technical titles, body descriptions, and 4-tier specification cards remain interactive.
  * Bottom hotspot pill buttons (`01 ENGINE`, `02 EXHAUST`, etc.) and `FULL VIEW` / `RESET` remain fully functional.
  * Supported WebGL desktop and mobile devices retain 100% of the uncompromised 3D model, materials, ACES Filmic lighting, shadows, and interactive orbit controls.
* **Production Build:** Passed (`npm run build` in 9.11s with 0 errors).
* **Automated Verification:** 7/7 checks passed across normal WebGL and native `--disable-webgl` browser runs:
  1. Normal WebGL environment: 3D canvas successfully rendered (`876x478`), fallback inactive.
  2. WebGL-disabled environment (`--disable-webgl`): High-fidelity static poster image rendered, canvas safely omitted.
  3. Status badge: Graceful `STATIC SHOWCASE` indicator verified.
  4. Hotspot 02 (Exhaust) interaction: Swapped image to `/exhaust.webp` and updated specs to `PEASHOOTER SILENCER`.
  5. Hotspot 04 (Tank) interaction: Swapped image to `/tank.webp` and updated specs to `TEARDROP RESERVOIR`.
  6. Full View navigation: Restored full motorcycle poster (`/bikes/classic-350.webp`).
  7. Visual fidelity: Screenshot captured and verified (`screenshots/phase6_webgl_fallback.png`).

---

## Execution Log

| Date | Phase | Action / Result | Status |
| :--- | :---: | :--- | :---: |
| 2026-10-25 | Phase 1 | Draco compression applied to `royal_enfield.glb` (25.52 MB → 4.63 MB, -81%). Configured `DRACOLoader` and `MeshoptDecoder`. 7/7 verification checks passed. | **COMPLETED** |
| — | Phase 2 | Procedural studio lighting verified (zero CDN network dependency). | **VERIFIED** |
| 2026-10-25 | Phase 3 | Dynamic DPR tiering (1.0 mobile, 1.5 desktop), 512x512/1024x1024 shadow map tiering, selective shadow casting filtering ~1,044 fastener/stitch sub-meshes. 10/10 verification checks passed. | **COMPLETED** |
| 2026-10-25 | Phase 4 | Demand-based rendering architecture. Loop sleeps at 0 fps while idle, wakes up on interaction/resize with settle damping. 7/7 verification checks passed. | **COMPLETED** |
| 2026-10-25 | Phase 5 | Local preview cache headers configured via native Vite plugin (zero dependencies). Hashed assets immutable, HTML and unversioned assets revalidated. 9/9 verification checks passed. | **COMPLETED** |
| 2026-10-25 | Phase 6 | WebGL capability pre-flight, context loss handling, and high-fidelity static WebP poster fallback with interactive hotspot switching. 7/7 verification checks passed. | **COMPLETED** |
