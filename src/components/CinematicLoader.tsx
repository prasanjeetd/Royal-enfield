import React, { useState, useEffect, useRef } from 'react';

interface CinematicLoaderProps {
  onLoaded?: () => void;
}

/**
 * Essential above-the-fold critical assets required for immediate initial hero view
 */
const PRIMARY_CRITICAL_ASSETS = [
  '/logo.webp',
  '/bikes/classic-350.webp',
];

/**
 * Secondary carousel assets that preload in parallel without holding the initial loading screen hostage
 */
const SECONDARY_HERO_ASSETS = [
  '/bikes/bullet-350.webp',
  '/bikes/hunter-350.webp',
  '/bikes/meteor-350.webp',
  '/bikes/re-450.png',
  '/bikes/0493b03c-c92c-4449-b4d2-93b88ee2eec7.webp',
];

/**
 * Premium Cinematic Loading Screen for Royal Enfield
 * Matches deep navy/black brand aesthetic, golden ambient glow, and Rajdhani typography.
 * Smoothly counts from 0% to 100% with real asset synchronization, never hanging or freezing.
 */
export default function CinematicLoader({ onLoaded }: CinematicLoaderProps) {
  const [isRendered, setIsRendered] = useState<boolean>(true);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // Seamless hand-off from Frame-0 preloader: start from wherever Frame-0 reached
  const initialPercent = typeof window !== 'undefined' && (window as any).__initialProgress
    ? Math.max(14, Math.min(92, Math.round((window as any).__initialProgress)))
    : 14;

  const [percent, setPercent] = useState<number>(initialPercent);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let isMounted = true;
    const startTime = performance.now();

    let criticalAssetsReady = false;
    let completed = false;
    let rafId: number | null = null;
    let heartbeatId: any = null;

    // Track handled URLs in a Set to guarantee zero double-counting on cached assets
    const resolvedAssets = new Set<string>();
    let primaryResolvedCount = 0;
    let secondaryResolvedCount = 0;
    let cachedCount = 0;

    // Direct DOM updater for fluid 60fps animation
    const updateProgress = (val: number) => {
      const clamped = Math.min(100, Math.max(initialPercent, val));
      const rounded = Math.round(clamped);

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${clamped.toFixed(1)}%`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.textContent = `${rounded}%`;
      }
    };

    // Initialize DOM display immediately from Frame-0 hand-off value
    updateProgress(initialPercent);

    const handleAssetResolved = (url: string, isPrimary: boolean, success: boolean, wasCached: boolean) => {
      if (!isMounted || resolvedAssets.has(url)) return;
      resolvedAssets.add(url);

      if (wasCached) {
        cachedCount++;
      }

      if (!success) {
        console.warn(`[CinematicLoader] Asset warning: failed to preload "${url}", continuing gracefully.`);
      }

      if (isPrimary) {
        primaryResolvedCount++;
        if (primaryResolvedCount >= PRIMARY_CRITICAL_ASSETS.length) {
          criticalAssetsReady = true;
        }
      } else {
        secondaryResolvedCount++;
      }
    };

    const preloadAsset = (url: string, isPrimary: boolean) => {
      const img = new Image();
      let settled = false;

      const finish = (ok: boolean, fromCache: boolean) => {
        if (settled) return;
        settled = true;
        handleAssetResolved(url, isPrimary, ok, fromCache);
      };

      img.onload = () => finish(true, false);
      img.onerror = () => finish(false, false);
      img.src = url;

      if (img.complete) {
        finish(true, true);
      }
    };

    // Preload primary critical assets (blocking threshold)
    PRIMARY_CRITICAL_ASSETS.forEach((url) => preloadAsset(url, true));

    // Preload secondary carousel assets in parallel (non-blocking contribution)
    SECONDARY_HERO_ASSETS.forEach((url) => preloadAsset(url, false));

    // Check font readiness
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(() => {})
        .catch(() => {});
    }

    // Dynamic duration: instant exit when all assets are pre-cached, smooth ramp otherwise
    const isWarm = cachedCount >= PRIMARY_CRITICAL_ASSETS.length;
    const minDisplayDuration = isWarm ? 280 : 650;
    const maxSafetyDuration = 1800; // Fail-safe: never block user longer than 1.8s

    const safetyTimer = setTimeout(() => {
      criticalAssetsReady = true;
    }, maxSafetyDuration);

    // Core progress tick computation
    const tick = (currentTime: number) => {
      if (!isMounted || completed) return;

      const elapsed = currentTime - startTime;

      // Real asset weight factors
      const primaryFactor = primaryResolvedCount / PRIMARY_CRITICAL_ASSETS.length;
      const secondaryFactor = secondaryResolvedCount / SECONDARY_HERO_ASSETS.length;
      // Combined asset readiness: 75% primary, 25% secondary
      const assetFactor = primaryFactor * 0.75 + secondaryFactor * 0.25;

      let target = initialPercent;

      if (!criticalAssetsReady || elapsed < minDisplayDuration) {
        const timeFactor = Math.min(1, elapsed / minDisplayDuration);
        const progressFactor = Math.max(timeFactor * 0.45, assetFactor);
        const eased = 1 - Math.pow(1 - progressFactor, 2.0);
        // Progress naturally ascends toward 92% based on real loading
        target = initialPercent + eased * (92 - initialPercent);
      } else {
        // Critical assets are ready: glide smoothly to 100%
        const finishElapsed = elapsed - minDisplayDuration;
        const finishFactor = Math.min(1, finishElapsed / 200);
        target = 92 + finishFactor * 8;
      }

      updateProgress(target);

      if (target >= 99.8) {
        updateProgress(100);
        setPercent(100);

        if (!completed) {
          completed = true;
          if (heartbeatId) clearInterval(heartbeatId);

          // Brief pause at 100% for visual satisfaction, then cinematic fade
          setTimeout(() => {
            if (!isMounted) return;
            setIsFadingOut(true);
            if (onLoaded) onLoaded();

            // After fade out completes, remove from DOM
            setTimeout(() => {
              if (isMounted) {
                setIsRendered(false);
              }
            }, 450);
          }, 120);

          return;
        }
      }

      if (!completed) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    // Heartbeat fallback: keeps progress alive even if rAF is throttled in background tab
    heartbeatId = setInterval(() => {
      if (!completed && isMounted) {
        tick(performance.now());
      }
    }, 60);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      if (heartbeatId) clearInterval(heartbeatId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [initialPercent, onLoaded]);

  if (!isRendered) {
    return null;
  }

  return (
    <div
      id="royal-enfield-cinematic-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading Royal Enfield experience"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        backgroundColor: '#050A14',
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(45, 78, 128, 0.22) 0%, rgba(15, 39, 71, 0.12) 50%, rgba(5, 10, 20, 0.98) 100%)',
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'auto',
        transition: 'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity',
      }}
    >
      {/* Subtle Cinematic Film-Grain Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          opacity: 0.3,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
        }}
        aria-hidden="true"
      />

      {/* Subtle Warm Golden Ambient Glow behind Logo */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ zIndex: 2 }}
        aria-hidden="true"
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(640px, 85vw)',
            height: 'min(320px, 45vh)',
            background:
              'radial-gradient(ellipse at center, rgba(197, 138, 40, 0.14) 0%, rgba(158, 114, 44, 0.04) 40%, transparent 70%)',
            filter: 'blur(28px)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Central Branding & Loader Controls */}
      <div
        className="relative flex flex-col items-center justify-center px-6 text-center"
        style={{ zIndex: 10 }}
      >
        {/* Royal Enfield Official Brand Logo */}
        <div className="relative flex items-center justify-center">
          <img
            src="/logo.webp"
            alt="Royal Enfield"
            className="h-9 sm:h-11 md:h-12 w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)]"
            draggable={false}
          />
        </div>

        {/* Brand Tagline with Flanking Gold Rules */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-5 sm:mt-6 opacity-95">
          <span className="w-8 sm:w-16 h-[1px] shrink-0 bg-gradient-to-r from-transparent to-[#9E722C]/80" />
          <span
            className="text-[10px] sm:text-[11px] md:text-[12px] font-bold uppercase tracking-[0.38em] text-[#C58A28] leading-none select-none whitespace-nowrap"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            PURE MOTORCYCLING
          </span>
          <span className="w-8 sm:w-16 h-[1px] shrink-0 bg-gradient-to-l from-transparent to-[#9E722C]/80" />
        </div>

        {/* Minimal Golden Progress Line & Counter */}
        <div className="mt-8 sm:mt-10 flex flex-col items-center">
          {/* Thin Horizontal Progress Line */}
          <div
            className="w-48 sm:w-64 h-[2px] bg-white/[0.08] rounded-full overflow-hidden relative"
            style={{
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            <div
              ref={progressBarRef}
              className="h-full rounded-full"
              style={{
                width: `${percent}%`,
                background: 'linear-gradient(90deg, #9E722C 0%, #D4A862 50%, #FCCA02 100%)',
                boxShadow: '0 0 10px rgba(252, 202, 2, 0.45), 0 0 2px rgba(255, 244, 188, 0.8)',
                willChange: 'width',
              }}
            />
          </div>

          {/* Percentage Indicator */}
          <div className="mt-3 flex items-center justify-center">
            <span
              ref={progressTextRef}
              className="text-[11px] sm:text-[12px] font-bold tracking-[0.25em] text-[#A0AEC0] tabular-nums select-none"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              {percent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
