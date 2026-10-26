import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Custom Vite plugin to enforce caching headers on `npm run preview`.
 * - Versioned build assets (/assets/*) contain content hashes -> immutable long-lived cache (1 year).
 * - Versioned assets via explicit query string (e.g. ?v=... or ?version=...) -> immutable long-lived cache (1 year).
 * - Entry point HTML documents (/, /index.html) -> must-revalidate (max-age=0) to prevent serving stale application code.
 * - Unversioned static assets (/royal_enfield.glb, images, etc.) -> must-revalidate (max-age=0) with conditional ETag validation,
 *   preventing stale assets when updated without a URL change.
 */
function previewCacheHeadersPlugin() {
  return {
    name: 'preview-cache-headers',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;
        const isVersioned = urlObj.searchParams.has('v') || urlObj.searchParams.has('version');

        // Intercept res.setHeader so that internal static middleware does not overwrite our policy
        const originalSetHeader = res.setHeader.bind(res);
        res.setHeader = function (key, val) {
          if (key.toLowerCase() === 'cache-control') {
            return;
          }
          return originalSetHeader(key, val);
        };

        if (pathname.startsWith('/assets/')) {
          // Versioned build chunks and assets (hashed filenames)
          originalSetHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (pathname === '/' || pathname === '/index.html' || pathname.endsWith('.html')) {
          // Entry point HTML must never be cached immutably
          originalSetHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (isVersioned) {
          // Versioned via query parameter (e.g. ?v=1)
          originalSetHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          // Unversioned static assets that may change without a URL change
          originalSetHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), previewCacheHeadersPlugin()],
  preview: {
    port: 4173,
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ['**/chrome-temp*/**', '**/screenshots/**', '**/*.log'],
    },
  },
  esbuild: {
    // Drop console logs and debugger statements in production builds
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lenis')) {
            return 'vendor-lenis';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
}));
