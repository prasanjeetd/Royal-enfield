import React, { useState, useEffect, useRef } from 'react';

interface CinematicLoaderProps {
  onLoaded?: () => void;
}

/**
 * Essential hero assets to preload and track
 */
const CRITICAL_HERO_ASSETS = [
  '/logo.webp',
  '/bikes/classic-350.webp',
  '/bikes/bullet-350.webp',
  '/bikes/hunter-350.webp',
  '/bikes/meteor-350.webp',
  '/bikes/himalayan-450.webp',
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
  const [percent, setPercent] = useState<number>(14);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let isMounted = true;
    const startTime = performance.now();

    let realAssetsReady = false;
    let completed = false;
    let rafId: number | null = null;
    let heartbeatId: any = null;

    // Direct DOM updater for fluid 60fps animation
    const updateProgress = (val: number) => {
      const clamped = Math.min(100, Math.max(14, val));
      const rounded = Math.round(clamped);

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${clamped.toFixed(1)}%`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.textContent = `${rounded}%`;
      }
    };

    // Initialize DOM display immediately on mount
    updateProgress(14);

    // Preload critical assets in parallel using Image & font readiness
    let loadedCount = 0;
    let cachedCount = 0;
    const totalAssets = CRITICAL_HERO_ASSETS.length;

    const checkAllDone = () => {
      if (!isMounted) return;
      loadedCount++;
      if (loadedCount >= totalAssets) {
        realAssetsReady = true;
      }
    };

    CRITICAL_HERO_ASSETS.forEach((url) => {
      const img = new Image();
      img.onload = checkAllDone;
      img.onerror = checkAllDone;
      img.src = url;
      if (img.complete) {
        cachedCount++;
        checkAllDone();
      }
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {}).catch(() => {});
    }

    // Adapt display duration: warm cache exits swiftly (350ms); fresh loads take 750ms max
    const isWarm = cachedCount >= totalAssets;
    const minDisplayDuration = isWarm ? 350 : 750;
    const maxSafetyDuration = 1800; // Never block the user longer than 1.8s

    // Safety timeout: If network is slow or offline, mark assets as ready
    const safetyTimer = setTimeout(() => {
      realAssetsReady = true;
    }, maxSafetyDuration);

    // Core progress tick computation
    const tick = (currentTime: number) => {
      if (!isMounted || completed) return;

      const elapsed = currentTime - startTime;

      // Real asset weight: ratio of loaded critical assets
      const assetProgressFactor = Math.min(1, loadedCount / totalAssets);

      let target = 14;

      if (!realAssetsReady || elapsed < minDisplayDuration) {
        const timeFactor = Math.min(1, elapsed / minDisplayDuration);
        // Combined blend of real assets ready + smooth ease-out curve
        const progressFactor = Math.max(timeFactor, assetProgressFactor);
        const eased = 1 - Math.pow(1 - progressFactor, 2.0);
        target = 14 + eased * (88 - 14);
      } else {
        // Assets are ready: glide swiftly from current value to 100%
        const finishElapsed = elapsed - minDisplayDuration;
        const finishFactor = Math.min(1, finishElapsed / 220);
        target = 88 + finishFactor * 12;
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
  }, [onLoaded]);

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
