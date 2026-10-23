# Royal Enfield — TestSprite Frontend Test Suite

This directory contains the official TestSprite-compatible frontend test plan definitions for the Royal Enfield web application.

- **Project ID**: `9de8b4ba-b7bf-4e9f-8816-3d3d01f2c109`
- **Type**: `frontend`
- **Target URL**: `http://localhost:5173/` (Local Origin Mode)
- **Engine**: TestSprite CLI v0.14+

---

## Test Plans Directory Index

| File | Target Feature | Priority | Summary |
|---|---|:---:|---|
| [`01-homepage-load.json`](./01-homepage-load.json) | **1. Homepage Load** | `p0` | Verifies initial root hydration, title, logo, and core hero elements. |
| [`02-navbar-navigation.json`](./02-navbar-navigation.json) | **2. Navbar Navigation** | `p1` | Verifies smooth scrolling to `#hero`, `#bike-3d`, `#parts-archive`, `#choose-your-ride`, and `#contact`. |
| [`03-hero-carousel-names.json`](./03-hero-carousel-names.json) | **3. Motorcycle Names** | `p1` | Verifies active headline matches current model and pill dock reflects real bike models. |
| [`04-hero-carousel-controls.json`](./04-hero-carousel-controls.json) | **4. Carousel Prev/Next Controls** | `p1` | Verifies arrow controls rotate turntable showcase and update titles/badges. |
| [`05-hero-carousel-autorotation.json`](./05-hero-carousel-autorotation.json) | **5. Carousel Auto-Rotation** | `p2` | Verifies periodic rotation without user interaction. |
| [`06-3d-model-experience.json`](./06-3d-model-experience.json) | **6. 3D Motorcycle Model** | `p0` | Verifies Three.js GLTF canvas loads without errors and hotspot buttons update specs. |
| [`07-parts-archive-showcase.json`](./07-parts-archive-showcase.json) | **7. Parts Archive Cards & Images** | `p1` | Verifies cards for all 5 components, stat lines, transparent images, and detail modal. |
| [`08-collection-display.json`](./08-collection-display.json) | **8. Collection Section Display** | `p1` | Verifies bike tabs (01 to 06), motorcycle presentation stage, and specs grid. |
| [`09-booking-interface.json`](./09-booking-interface.json) | **9. Booking Interface** | `p0` | Verifies test ride modal dialog, input validation, submission, and confirmation summary. |
| [`10-contact-form-validation.json`](./10-contact-form-validation.json) | **10. Contact Form Validation** | `p1` | Verifies required fields validation and message submission success state. |
| [`11-responsive-layouts.json`](./11-responsive-layouts.json) | **11. Responsive Layouts** | `p1` | Verifies layout adaptability across desktop, tablet, and mobile viewports. |
| [`12-browser-console-errors.json`](./12-browser-console-errors.json) | **12. Browser Console Errors** | `p0` | Verifies that scrolling and interacting produces 0 unhandled runtime errors. |

---

## How to Register & Run Test Plans

### 1. Verify Dev Server is Running
Ensure the Vite development server is running locally on port 5173:
```bash
npm run dev
```

### 2. Batch-Create All Tests in TestSprite
Register all 12 test plans in TestSprite without executing them:
```bash
testsprite test create-batch --plan-from-dir ./testsprite-plans
```

### 3. List Registered Tests
Confirm the tests are registered in the project:
```bash
testsprite test list --project 9de8b4ba-b7bf-4e9f-8816-3d3d01f2c109
```

### 4. Run a Smoke Test
Run a single test locally through the tunnel (e.g., Homepage Load):
```bash
testsprite test run <testId> --local 5173
```

### 5. Run the Full Suite
To execute the complete test suite locally:
```bash
testsprite test run --all --project 9de8b4ba-b7bf-4e9f-8816-3d3d01f2c109 --local 5173
```
