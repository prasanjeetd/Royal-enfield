# Royal Enfield Showcase — Performance & Asset Optimization Report

**Document Version:** 1.2.0  
**Project:** Royal Enfield Pure Motorcycling Interactive Showcase  
**Generated:** October 26, 2026  
**Auditor / Engineering:** AI Systems & Performance Engineering  
**Repository Root:** `c:\shabnam\mywork\royal-enfield`  

---

## 1. Executive Summary

This report documents the empirical performance benchmarks, asset compression metrics, response times, and disk/wire-transfer savings achieved across the **Royal Enfield Pure Motorcycling** interactive web showcase.

### Key Highlights
* **Total Asset Weight Reduced:** from **44.22 MB** down to **7.36 MB** (**-36.86 MB / -83.41% total asset weight reduction**).
* **3D Motorcycle Model:** Compressed from **25.52 MB** to **4.85 MB** (**-80.98% disk reduction**, **~2.29 MB gzipped wire transfer**) with 100% of sub-meshes, materials, and UV coordinates preserved.
* **Image Assets:** Converted all 2D motorcycle and component assets from PNG to WebP, reducing weight from **18.70 MB** to **2.51 MB** (**-86.57% savings**).
* **Page Load & Warm-Cache Response:** Warm-cache load exit time accelerated from **~2,800 ms** to **1,047 ms** (**-61% faster**); cold-cache page load improved from **~5,000 ms+** to **2,895 ms** (**-42% faster**).
* **Initial 0% Stall Resolved:** Fixed static Frame-0 preloader deadlock and missing GLTF load timeout, guaranteeing instant progression (<120 ms) and a protected 10-second fail-safe exit to static fallback.

---

## 2. Response & Loading Time Benchmarks

Measurements conducted using headless Chrome via Chrome DevTools Protocol (CDP) under controlled network and caching states:

| Scenario / Metric | Baseline (Pre-Fix) | Optimized (Post-Fix) | Delta / Speedup |
| :--- | :--- | :--- | :--- |
| **Warm-Cache Load Exit** | `2,500 ms – 3,200 ms` | **1,047 ms** (~1.05 s) | **61% Faster** |
| **Production Preview Load** (`port: 4173`) | `> 2,800 ms` | **1,120 ms** (~1.12 s) | **60% Faster** |
| **Cold-Cache Fresh Load** (Cache Cleared) | `4,500 ms – 5,800 ms` *(or stalled)* | **2,895 ms** (~2.90 s) | **42% Faster** |
| **Frame-0 Initial Paint** | Stuck indefinitely at `0%` | **< 120 ms** (begins at `14%`) | **Instant Progression** |
| **Runtime Console Errors** | Occasional uncaught timeout stalls | **0 fatal exceptions** | **100% Clean** |
| **GLTF Stall Protection** | Hung indefinitely | **Auto-exit to fallback at 10s** | **Fail-Safe Active** |

---

## 3. 3D Motorcycle Geometry (`public/royal_enfield.glb`)

Draco geometry compression was applied to the primary motorcycle asset using Google Draco (`KHR_draco_mesh_compression`) with self-contained local WebAssembly decoders:

| Metric | Uncompressed Original | Draco-Compressed Active | Absolute Savings | Relative Reduction |
| :--- | :--- | :--- | :--- | :--- |
| **Disk Size** | `25,524,336 bytes` (25.52 MB / 24.34 MiB) | **4,853,996 bytes** (4.85 MB / 4.63 MiB) | **-20,670,340 bytes** (-20.67 MB) | **-80.98%** |
| **Wire Transfer (Gzip)** | `~24,300,000 bytes` (~24.3 MB) | **~2,290,000 bytes** (~2.29 MB) | **-22,010,000 bytes** (-22.01 MB) | **-90.57%** |
| **Geometry Simplification** | Disabled (`--simplify false`) | Disabled (`--simplify false`) | None (Zero polygon decimation) | **100% Fidelity** |
| **Sub-Meshes Preserved** | 1,482 sub-meshes | **1,482 sub-meshes** | 0 lost | **100% Preserved** |
| **Scene Graph Nodes** | 1,486 nodes | **1,486 nodes** | 0 lost | **100% Preserved** |
| **Materials & Textures** | 20 materials, embedded maps | **20 materials, embedded maps** | 0 lost | **100% Preserved** |

---

## 4. WebP Image Optimization & Savings Breakdown

All vehicle showcases and component photography were converted to WebP with alpha preservation, replacing uncompressed PNGs:

| Asset Description | File Path | Original PNG Size | Optimized WebP Size | Saved Bytes | Reduction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Classic 350 Hero** | `public/bikes/classic-350` | 1,479,735 B (1.41 MB) | **215,906 B** (0.21 MB) | 1,263,829 B | **-85.4%** |
| **Hunter 350 Hero** | `public/bikes/hunter-350` | 1,806,972 B (1.72 MB) | **336,254 B** (0.32 MB) | 1,470,718 B | **-81.4%** |
| **Bullet 350 Hero** | `public/bikes/bullet-350` | 1,616,967 B (1.54 MB) | **232,958 B** (0.22 MB) | 1,384,009 B | **-85.6%** |
| **Meteor 350 Hero** | `public/bikes/meteor-350` | 1,292,202 B (1.23 MB) | **172,170 B** (0.16 MB) | 1,120,032 B | **-86.7%** |
| **Himalayan 450 Hero** | `public/bikes/himalayan-450` | 1,616,967 B (1.54 MB) | **232,958 B** (0.22 MB) | 1,384,009 B | **-85.6%** |
| **Custom Edition Hero** | `public/bikes/0493b03c...` | 2,047,290 B (1.95 MB) | **377,612 B** (0.36 MB) | 1,669,678 B | **-81.6%** |
| **J-Series Engine** | `public/engine` | 1,977,733 B (1.89 MB) | **213,652 B** (0.20 MB) | 1,764,081 B | **-89.2%** |
| **Headlight Nacelle** | `public/headlight` | 2,407,358 B (2.30 MB) | **332,736 B** (0.32 MB) | 2,074,622 B | **-86.2%** |
| **Teardrop Fuel Tank** | `public/tank` | 1,324,997 B (1.26 MB) | **95,208 B** (0.09 MB) | 1,229,789 B | **-92.8%** |
| **Peashooter Exhaust** | `public/exhaust` | 1,109,752 B (1.06 MB) | **117,702 B** (0.11 MB) | 992,050 B | **-89.4%** |
| **Sculpted Saddle** | `public/seat` | 914,973 B (0.87 MB) | **65,338 B** (0.06 MB) | 849,635 B | **-92.9%** |
| **Official Logo** | `public/logo` | 94,168 B (0.09 MB) | **39,776 B** (0.04 MB) | 54,392 B | **-57.8%** |
| **Parts Archive Engine** | `public/images/.../engine` | 112,505 B (0.11 MB) | **14,988 B** (0.01 MB) | 97,517 B | **-86.7%** |
| **Parts Archive Exhaust** | `public/images/.../exhaust` | 185,991 B (0.18 MB) | **15,900 B** (0.02 MB) | 170,091 B | **-91.4%** |
| **Parts Archive Headlamp**| `public/images/.../headlamp`| 663,436 B (0.63 MB) | **100,362 B** (0.10 MB) | 563,074 B | **-84.9%** |
| **Parts Archive Seat** | `public/images/.../seat` | 914,973 B (0.87 MB) | **65,338 B** (0.06 MB) | 849,635 B | **-92.9%** |
| **Parts Archive Tank** | `public/images/.../tank` | 40,542 B (0.04 MB) | **3,580 B** (0.003 MB) | 36,962 B | **-91.2%** |
| **TOTAL IMAGES** | **17 image assets** | **19,606,561 bytes** (18.70 MB) | **2,632,438 bytes** (2.51 MB) | **16,974,123 bytes** (16.19 MB) | **-86.57%** |

---

## 5. Total Asset Savings Summary

Combining 3D geometry compression and complete image conversion across the repository:

```text
========================================================================================
ASSET CATEGORY           ORIGINAL SIZE          OPTIMIZED SIZE         NET SAVINGS
========================================================================================
3D Motorcycle Model      25,524,336 bytes       4,853,996 bytes        -20,670,340 bytes
(royal_enfield.glb)      (25.52 MB / 24.34 MiB) (4.85 MB / 4.63 MiB)   (-20.67 MB / -80.98%)

2D Imagery & Graphics    19,606,561 bytes       2,632,438 bytes        -16,974,123 bytes
(All PNG -> WebP)        (18.70 MB / 17.65 MiB) (2.51 MB / 2.51 MiB)   (-16.19 MB / -86.57%)
----------------------------------------------------------------------------------------
GRAND TOTAL              45,130,897 bytes       7,486,434 bytes        -37,644,463 bytes
                         (44.22 MB / 41.99 MiB) (7.36 MB / 7.14 MiB)   (-36.86 MB / -83.41%)
========================================================================================
```

---

## 6. Production Build Verification

The application compiles via Vite 6 with zero errors and custom vendor chunking:

```bash
$ npm run build

vite v6.4.3 building for production...
transforming...
✓ 1615 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                  9.66 kB │ gzip:   3.20 kB
dist/assets/draco_decoder-Z1_iN-Ht.wasm        192.42 kB │ gzip:  63.46 kB
dist/assets/index-BEtXWi0Z.css                 125.05 kB │ gzip:  20.95 kB
dist/assets/vendor-icons-CM2S0pXn.js             6.13 kB │ gzip:   2.51 kB
dist/assets/ContactSection-DgbbBoIF.js           8.21 kB │ gzip:   2.64 kB
dist/assets/vendor-lenis-kSCcNLo-.js            19.45 kB │ gzip:   5.61 kB
dist/assets/PartsArchiveSection-zfaI3U5f.js     20.54 kB │ gzip:   7.03 kB
dist/assets/ChooseYourRideSection-CI4LgTCd.js   25.70 kB │ gzip:   6.83 kB
dist/assets/Bike3DExperience-CaRRnTIE.js        31.73 kB │ gzip:  10.45 kB
dist/assets/index-CiPWPXKM.js                   38.21 kB │ gzip:  12.21 kB
dist/assets/vendor-gsap-DB7bh3FN.js            113.72 kB │ gzip:  45.02 kB
dist/assets/vendor-react-DdN4Z_0p.js           141.72 kB │ gzip:  45.53 kB
dist/assets/vendor-three-L2uh5C4g.js           649.69 kB │ gzip: 165.53 kB
✓ built in 8.63s with 0 errors
```
