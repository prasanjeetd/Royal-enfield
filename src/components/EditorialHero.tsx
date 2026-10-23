import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BIKES } from '../data/bikes';

gsap.registerPlugin(ScrollTrigger);

export default function EditorialHero() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [displayedBikeName, setDisplayedBikeName] = useState<string>(BIKES[0].name);
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1200;
  });

  const heroRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const topNavRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const navButtonsRef = useRef<HTMLDivElement>(null);
  const bikesLayerRef = useRef<HTMLDivElement>(null);
  const turntableFloorRef = useRef<HTMLDivElement>(null);

  // References for 4 bike DOM elements
  const bikeCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Continuous physics & rotation angle tracking
  const currentAngleRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const autoRotateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMobile = windowWidth < 640;





  // Interactive drag state for smooth turntable dragging
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartAngleRef = useRef<number>(0);
  const lastDragXRef = useRef<number>(0);
  const dragVelocityRef = useRef<number>(0);
  const lastDragTimeRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);

  /**
   * Apply instantaneous 3D transforms to all 4 bikes based on given angle
   */
  const renderBikesAtAngle = useCallback((angle: number) => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const mobile = width < 640;

    // Turntable radius and depth - expanded for comfortable spacing
    const rx = mobile ? Math.min(width * 0.44, 280) : Math.min(width * 0.35, 520);

    // Rotate turntable floor ring
    if (turntableFloorRef.current) {
      turntableFloorRef.current.style.transform = `translateX(-50%) rotateX(74deg) rotateZ(${angle.toFixed(2)}deg)`;
    }

    BIKES.forEach((_, index) => {
      const el = bikeCardRefs.current[index];
      if (!el) return;

      // Base angle for this bike in turntable (clockwise arrangement)
      const step = 360 / BIKES.length;
      const baseAngle = -index * step;
      const bikeAngle = baseAngle + angle;

      // Normalize angle to [-180, 180] degrees relative to front viewer
      const normalizedAngle = (((bikeAngle % 360) + 540) % 360) - 180;
      const rad = (normalizedAngle * Math.PI) / 180;

      const s = Math.sin(rad);
      const c = Math.cos(rad);

      // Depth factor d in [0, 1]: 1 = closest front, 0.5 = sides, 0 = far back
      const d = (1 + c) / 2;
      const isFront = d > 0.92;

      // Orbital X and Y coordinates
      const posX = s * rx;
      const posY = (1 - d) * -42; // subtle elevation as bike moves to back horizon

      // Scale: 1.0 at front, ~0.76 at sides, ~0.30 at back
      const scale = mobile
        ? 0.28 + 0.72 * Math.pow(d, 1.25)
        : 0.30 + 0.70 * Math.pow(d, 1.25);

      // 3D Perspective Yaw angle (facing towards center / viewer)
      const rotateY = -s * 22;

      // Slight banking tilt
      const rotateZ = -s * 1.5;

      // Active bike reaches 1.0 at front; surrounding side bikes softly stay secondary at ~0.50-0.60
      const opacity = parseFloat((0.22 + 0.78 * Math.pow(d, 1.5)).toFixed(3));

      // Continuous, smooth layering
      const zIndex = Math.round(10 + 25 * d);

      // Active motorcycle stays razor sharp at focal point; subtle optical blur for side/rear bikes
      const blurAmount = Math.max(0, (1 - d) * 1.5);
      const filter = blurAmount > 0.12
        ? `drop-shadow(0 15px 30px rgba(5,10,20,0.9)) blur(${blurAmount.toFixed(2)}px)`
        : 'drop-shadow(0 15px 30px rgba(5,10,20,0.9))';

      el.style.transform = `translate3d(calc(-50% + ${posX.toFixed(2)}px), ${posY.toFixed(2)}px, 0) scale(${scale.toFixed(4)}) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg)`;
      el.style.opacity = `${opacity}`;
      el.style.zIndex = `${zIndex}`;
      el.style.filter = filter;
      el.style.cursor = d > 0.85 ? 'grab' : 'pointer';
    });
  }, []);

  // Update windowWidth & re-render on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      renderBikesAtAngle(currentAngleRef.current);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [renderBikesAtAngle]);

  const activeIndexRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextBikeRef = useRef<() => void>(() => {});

  const stopAutoplay = useCallback(() => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
  }, []);

  const scheduleNextAutoplay = useCallback(
    (delayMs: number = 2400) => {
      stopAutoplay();
      autoplayTimeoutRef.current = setTimeout(() => {
        nextBikeRef.current();
      }, delayMs);
    },
    [stopAutoplay]
  );

  /**
   * Smoothly tween turntable rotation angle to target with cinematic easing
   */
  const animateToAngle = useCallback(
    (newTargetAngle: number, customDuration: number = 1.35, onDone?: () => void) => {
      targetAngleRef.current = newTargetAngle;
      isAnimatingRef.current = true;

      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }

      const startAngle = currentAngleRef.current;
      const diff = newTargetAngle - startAngle;

      // Calculate nearest active bike index (0..BIKES.length-1)
      const stepAngle = 360 / BIKES.length;
      const count = BIKES.length;
      const normalizedTarget = (((newTargetAngle / stepAngle) % count) + count) % count;
      const nextIndex = Math.round(normalizedTarget) % count;

      // Coordinated Title & Pill indicator transition synced with bike rotation
      if (nextIndex !== activeIndexRef.current) {
        activeIndexRef.current = nextIndex;

        const direction = diff > 0 ? 'next' : 'prev';
        const xExit = direction === 'next' ? -24 : 24;
        const xEnter = direction === 'next' ? 24 : -24;

        if (titleRef.current) {
          gsap.timeline()
            .to(titleRef.current, {
              x: xExit,
              opacity: 0,
              duration: 0.32,
              ease: 'power2.in',
              onComplete: () => {
                setActiveIndex(nextIndex);
                setDisplayedBikeName(BIKES[nextIndex].name);
              }
            })
            .fromTo(
              titleRef.current,
              { x: xEnter, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.52, ease: 'power2.out' },
              '+=0.04'
            );
        } else {
          setActiveIndex(nextIndex);
          setDisplayedBikeName(BIKES[nextIndex].name);
        }

        if (subtitleRef.current) {
          gsap.fromTo(
            subtitleRef.current,
            { opacity: 0.2, y: 4 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.32 }
          );
        }
      }

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = prefersReducedMotion ? 0.2 : customDuration;

      const state = { angle: startAngle };
      tweenRef.current = gsap.to(state, {
        angle: newTargetAngle,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          currentAngleRef.current = state.angle;
          renderBikesAtAngle(state.angle);
        },
        onComplete: () => {
          currentAngleRef.current = newTargetAngle;
          renderBikesAtAngle(newTargetAngle);
          tweenRef.current = null;
          isAnimatingRef.current = false;
          scheduleNextAutoplay(2400);
          if (onDone) onDone();
        }
      });
    },
    [renderBikesAtAngle, scheduleNextAutoplay]
  );

  /**
   * Core Bike Transitions (Next / Prev / Direct)
   * Guaranteed 1.35s cinematic transitions with animation locking
   */
  const nextBike = useCallback(() => {
    if (isAnimatingRef.current || isDraggingRef.current) return;
    const step = 360 / BIKES.length;
    const nextAngle = targetAngleRef.current + step;
    animateToAngle(nextAngle, 1.35);
  }, [animateToAngle]);

  const prevBike = useCallback(() => {
    if (isAnimatingRef.current || isDraggingRef.current) return;
    const step = 360 / BIKES.length;
    const nextAngle = targetAngleRef.current - step;
    animateToAngle(nextAngle, 1.35);
  }, [animateToAngle]);

  const rotateToBike = useCallback(
    (index: number) => {
      if (isAnimatingRef.current || isDraggingRef.current) return;
      const step = 360 / BIKES.length;
      const count = BIKES.length;
      const currentRot = targetAngleRef.current;
      const currentActive = (((Math.round(currentRot / step) % count) + count) % count);

      let diff = (index - currentActive) % count;
      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;
      if (diff === 0) return;

      const newTarget = currentRot + diff * step;
      animateToAngle(newTarget, 1.35);
    },
    [animateToAngle]
  );

  nextBikeRef.current = nextBike;

  // Autoplay starts playing like a showroom showcase after initial page mount settles, paused when offscreen or tab hidden
  useEffect(() => {
    let heroVisible = true;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoplay();
      } else if (heroVisible) {
        scheduleNextAutoplay(1500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting;
        if (heroVisible && !document.hidden) {
          scheduleNextAutoplay(1500);
        } else {
          stopAutoplay();
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    scheduleNextAutoplay(1800);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
      stopAutoplay();
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
    };
  }, [scheduleNextAutoplay, stopAutoplay]);

  /**
   * Pointer Drag Handlers (Direct interactive touch/mouse turntable spin)
   */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (isAnimatingRef.current) return;
    if (tweenRef.current) {
      tweenRef.current.kill();
      tweenRef.current = null;
    }
    stopAutoplay();

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartAngleRef.current = currentAngleRef.current;
    lastDragXRef.current = e.clientX;
    lastDragTimeRef.current = performance.now();
    dragVelocityRef.current = 0;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }, [stopAutoplay]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastDragTimeRef.current);
    const deltaX = e.clientX - lastDragXRef.current;

    if (Math.abs(e.clientX - dragStartXRef.current) > 5) {
      hasDraggedRef.current = true;
    }

    dragVelocityRef.current = deltaX / dt;
    lastDragXRef.current = e.clientX;
    lastDragTimeRef.current = now;

    // Convert horizontal pixel drag to turntable angle (1px = ~0.32 degrees)
    const totalDeltaX = e.clientX - dragStartXRef.current;
    const angleDelta = totalDeltaX * 0.32;
    const newAngle = dragStartAngleRef.current + angleDelta;

    currentAngleRef.current = newAngle;
    renderBikesAtAngle(newAngle);
  }, [renderBikesAtAngle]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const step = 360 / BIKES.length;
    const currentAngle = currentAngleRef.current;

    // Add velocity boost for flick/swipe gesture
    const flickAngle = dragVelocityRef.current * 140;
    const projectedAngle = currentAngle + flickAngle;

    // Snap to nearest bike angle
    const targetBikeStep = Math.round(projectedAngle / step);
    const snapAngle = targetBikeStep * step;

    animateToAngle(snapAngle, 1.25);
  }, [animateToAngle]);

  /**
   * Manual Navigation Handlers (Left, Right, Dot, Bike Card)
   * Safely switches bike and resumes continuous autoplay
   */
  const handleManualPrev = useCallback(() => {
    if (isAnimatingRef.current) return;
    stopAutoplay();
    prevBike();
  }, [prevBike, stopAutoplay]);

  const handleManualNext = useCallback(() => {
    if (isAnimatingRef.current) return;
    stopAutoplay();
    nextBike();
  }, [nextBike, stopAutoplay]);

  const handleManualDot = useCallback(
    (idx: number) => {
      if (isAnimatingRef.current) return;
      if (idx === activeIndexRef.current) return;
      stopAutoplay();
      rotateToBike(idx);
    },
    [rotateToBike, stopAutoplay]
  );

  // Initial render of bikes position
  useEffect(() => {
    renderBikesAtAngle(0);
  }, [renderBikesAtAngle]);

  // Subtle entrance enhancement without hiding elements into a blank screen
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (giantTextRef.current) {
        gsap.from(giantTextRef.current, {
          opacity: 0.85,
          y: -8,
          duration: 0.6,
          ease: 'power2.out'
        });
      }
      if (topNavRef.current) {
        gsap.from(topNavRef.current, {
          opacity: 0.85,
          y: -8,
          duration: 0.5,
          ease: 'power2.out'
        });
      }
      if (titleRef.current) {
        gsap.from(titleRef.current, {
          y: 8,
          opacity: 0.85,
          duration: 0.5,
          ease: 'power2.out'
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // GSAP ScrollTrigger subtle scroll parallax
  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        }
      });

      if (bikesLayerRef.current) {
        scrollTl.to(bikesLayerRef.current, {
          scale: 1.03,
          y: -25,
          ease: 'none'
        }, 0);
      }

      if (giantTextRef.current) {
        scrollTl.to(giantTextRef.current, {
          y: -50,
          ease: 'none'
        }, 0);
      }

      if (titleRef.current && navButtonsRef.current) {
        scrollTl.to([navButtonsRef.current, titleRef.current], {
          y: -20,
          opacity: 0.3,
          ease: 'none'
        }, 0);
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const currentBike = BIKES[activeIndex];

  return (
    <section
      ref={heroRef}
      id="hero"
      aria-label="Royal Enfield Showcase Hero"
      className="relative w-full h-screen overflow-hidden select-none"
      style={{
        height: '100vh',
        minHeight: '100vh',
        maxHeight: '100vh',
        backgroundColor: '#050A14',
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(45, 78, 128, 0.22) 0%, rgba(15, 39, 71, 0.12) 50%, rgba(5, 10, 20, 0.95) 100%)',
        transition: 'background-color 950ms cubic-bezier(0.22, 1, 0.36, 1)',
        touchAction: 'pan-y'
      }}
    >
      {/* Anchor alias for #overview navigation */}
      <div id="overview" className="absolute top-0 left-0" aria-hidden="true" />
      {/* Subtle Cinematic Film-Grain Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 50,
          opacity: 0.35,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat'
        }}
        aria-hidden="true"
      />

      {/* Soft Ambient Studio Lighting Wash behind Upper Typography */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ zIndex: 4 }}
        aria-hidden="true"
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: isMobile ? '118px' : 'clamp(100px, 16vh, 160px)',
            transform: 'translate(-50%, -50%)',
            width: 'min(820px, 75vw)',
            height: 'min(260px, 30vh)',
            background: 'radial-gradient(ellipse at center, rgba(45, 78, 128, 0.22) 0%, rgba(15, 39, 71, 0.10) 40%, rgba(5, 10, 20, 0) 70%)',
            pointerEvents: 'none',
            filter: 'blur(12px)'
          }}
        />
      </div>

      {/* Soft, subtle warm golden glow behind central motorcycle showroom stage */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ zIndex: 6 }}
        aria-hidden="true"
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: isMobile ? '56%' : '52%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '85vw' : 'min(900px, 68vw)',
            height: isMobile ? '35vh' : 'min(420px, 45vh)',
            background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(45, 78, 128, 0.25) 0%, rgba(15, 39, 71, 0.12) 40%, rgba(5, 10, 20, 0) 70%)',
            pointerEvents: 'none',
            filter: 'blur(24px)'
          }}
        />
      </div>

      {/* Hidden SVG Filter for Subtle Distressed Letter Edges */}
      <svg className="absolute w-0 h-0 pointer-events-none select-none" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="distressed-edges" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045 0.08" numOctaves="3" result="roughNoise" />
            <feDisplacementMap in="SourceGraphic" in2="roughNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Layer A: Heading & Supporting Text Container */}
      <div
        ref={giantTextRef}
        id="hero-heading-container"
        className="hero-heading-container absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none select-none px-4"
        style={{
          top: isMobile ? '78px' : 'clamp(74px, 9.2vh, 88px)',
          zIndex: 10,
          textAlign: 'center',
          opacity: 0.98
        }}
      >
        {/* Top Tagline with Gold Line Accents: PURE MOTORCYCLING */}
        <div className="w-full flex items-center justify-center gap-3 sm:gap-3.5 mb-3 sm:mb-3.5 opacity-95">
          <span className="w-10 sm:w-20 md:w-24 h-[1px] shrink-0 bg-gradient-to-r from-transparent to-[#9E722C]/80" />
          <span
            className="text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.38em] text-[#9E722C] leading-none m-0 select-none whitespace-nowrap"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            PURE MOTORCYCLING
          </span>
          <span className="w-10 sm:w-20 md:w-24 h-[1px] shrink-0 bg-gradient-to-l from-transparent to-[#9E722C]/80" />
        </div>

        {/* Main Hero Title: ROYAL ENFIELD (3D Chiselled Heritage Font - Enlarged & Positioned Down) */}
        <h1
          id="hero-main-title"
          className="flex items-center justify-center my-0 w-full"
          aria-label="ROYAL ENFIELD"
        >
          <span className="sr-only">ROYAL ENFIELD</span>
          <svg
            viewBox="0 0 1500 135"
            className="w-full h-auto overflow-visible"
            style={{
              maxWidth: isMobile ? '98vw' : 'clamp(760px, 90vw, 1380px)',
              filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.28))'
            }}
          >
            <defs>
              {/* Rich 3D Metallic Ruby/Crimson Body Gradient */}
              <linearGradient id="re-logo-red" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF7A6C" />
                <stop offset="18%" stopColor="#FF4A40" />
                <stop offset="38%" stopColor="#E30100" />
                <stop offset="70%" stopColor="#A80000" />
                <stop offset="100%" stopColor="#4A0000" />
              </linearGradient>

              {/* Polished Gold Bevel / Trim Gradient */}
              <linearGradient id="re-logo-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF4BC" />
                <stop offset="35%" stopColor="#FCCA02" />
                <stop offset="70%" stopColor="#D49A00" />
                <stop offset="100%" stopColor="#7A5200" />
              </linearGradient>

              {/* Specular Upper Edge Sheen */}
              <linearGradient id="re-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="48%" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="52%" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </linearGradient>
            </defs>

            {/* 3D Extrusion Shadow Layer (gives tangible sculpted metal relief) */}
            <text
              x="50%"
              y="99"
              textAnchor="middle"
              fontFamily="'Cinzel', 'Playfair Display', serif"
              fontSize="92"
              fontWeight="900"
              letterSpacing="8"
              fill="#1F0202"
              stroke="#593B00"
              strokeWidth="3.2"
              paintOrder="stroke fill"
              opacity="0.9"
            >
              <tspan>ROYAL</tspan>
              <tspan dx="45">ENFIELD</tspan>
            </text>

            {/* Main Chiselled Front Face Layer */}
            <text
              x="50%"
              y="95"
              textAnchor="middle"
              fontFamily="'Cinzel', 'Playfair Display', serif"
              fontSize="92"
              fontWeight="900"
              letterSpacing="8"
              fill="url(#re-logo-red)"
              stroke="url(#re-logo-gold)"
              strokeWidth="2.4"
              paintOrder="stroke fill"
            >
              <tspan>ROYAL</tspan>
              <tspan dx="45">ENFIELD</tspan>
            </text>
          </svg>
        </h1>

        {/* Bottom Tagline with Gold Line Accents: BUILT LIKE A GUN */}
        <div className="w-full flex items-center justify-center gap-3 sm:gap-3.5 mt-3 sm:mt-3.5 opacity-95">
          <span className="w-10 sm:w-20 md:w-24 h-[1px] shrink-0 bg-gradient-to-r from-transparent to-[#9E722C]/80" />
          <span
            className="text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.38em] text-[#9E722C] leading-none m-0 select-none whitespace-nowrap"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            BUILT LIKE A GUN
          </span>
          <span className="w-10 sm:w-20 md:w-24 h-[1px] shrink-0 bg-gradient-to-l from-transparent to-[#9E722C]/80" />
        </div>
      </div>

      {/* Top Header Navigation */}
      <header
        ref={topNavRef}
        className="absolute top-0 inset-x-0 z-40 h-20 flex items-center justify-between px-6 sm:px-10 lg:px-16"
        style={{
          fontFamily: "'Rajdhani', sans-serif"
        }}
      >
        {/* Top-Left: Brand Header Logo */}
        <a
          href="#hero"
          className="flex items-center transition-opacity hover:opacity-85 cursor-pointer"
          aria-label="Royal Enfield Home"
          onClick={(e) => {
            e.preventDefault();
            if ((window as any).__lenis) {
              (window as any).__lenis.scrollTo(0, { duration: 1.2 });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <img
            src="/logo.webp"
            alt="Royal Enfield"
            className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            style={{
              maxHeight: '38px',
              maxWidth: '135px',
            }}
          />
        </a>

        {/* Top-Right: Section Anchors */}
        <nav
          className="hidden md:flex items-center gap-3.5 lg:gap-4"
          aria-label="Hero navigation"
        >
          {['OVERVIEW', '3D EXPERIENCE', 'PARTS ARCHIVE', 'COLLECTION', 'CONTACT'].map((item, idx) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className={`relative text-[14px] font-bold uppercase tracking-[0.18em] transition-all duration-200 py-1 ${
                idx === 0
                  ? 'text-[#F5F7FA] border-b-2 border-[#D4A862]'
                  : 'text-[#8FAAC6] hover:text-[#FFFFFF]'
              }`}
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              {item}
            </a>
          ))}
        </nav>
      </header>

      {/* ===================================================================
          2. LOGICAL CONTAINER: MOTORCYCLE CAROUSEL
          Contains Turntable floor stage, 3D bike carousel, and navigation arrows
          =================================================================== */}
      <div
        id="hero-showcase-stage"
        className="hero-showcase-stage absolute inset-0 pointer-events-none"
        aria-label="Motorcycle 3D carousel showcase"
      >
        {/* 3D Turntable Showroom Stage Floor & Reflection Ring */}
        <div
          ref={turntableFloorRef}
          id="hero-turntable-container"
          className="hero-turntable-container absolute pointer-events-none"
          style={{
            left: '50%',
            bottom: isMobile ? '24px' : 'clamp(26px, 3.8vh, 38px)',
            width: isMobile ? '96vw' : '88vw',
            maxWidth: '1280px',
            height: isMobile ? '200px' : '260px',
            zIndex: 5,
            borderRadius: '50%',
            transformOrigin: 'center center',
            background: `
              radial-gradient(ellipse 65% 35% at 50% 50%, rgba(255, 255, 255, 0.55) 0%, rgba(232, 236, 241, 0.35) 45%, transparent 72%)
            `,
            boxShadow: 'none',
            border: '1px solid rgba(180, 170, 155, 0.28)',
            willChange: 'transform'
          }}
          aria-hidden="true"
        >
          {/* Subtle decorative radial tick marks on the turntable ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: `repeating-conic-gradient(from 0deg, rgba(160, 145, 125, 0.22) 0deg 1.5deg, transparent 1.5deg 30deg)`,
              maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 68%, black 72%, transparent 92%)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 68%, black 72%, transparent 92%)',
              opacity: 0.75
            }}
          />

          {/* Center contact spotlight shadow */}
          <div
            className="absolute rounded-full"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '64%',
              height: '48%',
              background: 'radial-gradient(ellipse at 50% 50%, rgba(40, 35, 28, 0.55) 0%, rgba(70, 60, 50, 0.25) 50%, transparent 78%)'
            }}
          />
        </div>

        {/* 3D Perspective Motorcycle Carousel Layer */}
        <div
          ref={bikesLayerRef}
          id="hero-showcase-container"
          className="hero-showcase-container absolute inset-0 select-none"
          style={{
            zIndex: 20,
            perspective: '1400px',
            perspectiveOrigin: '50% 68%',
            cursor: 'grab',
            touchAction: 'pan-y'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {BIKES.map((bike, index) => {
            return (
              <div
                key={bike.name}
                ref={(el) => { bikeCardRefs.current[index] = el; }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasDraggedRef.current) return;
                  handleManualDot(index);
                }}
                className="absolute select-none group"
                style={{
                  left: '50%',
                  bottom: isMobile ? '94px' : 'clamp(100px, 12.5vh, 126px)',
                  width: 'auto',
                  height: isMobile ? '38vh' : '48vh',
                  maxHeight: isMobile ? '340px' : '460px',
                  maxWidth: isMobile ? '94vw' : '82vw',
                  aspectRatio: '1.77 / 1',
                  transformOrigin: 'center bottom',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
                }}
                aria-hidden="true"
              >
                <img
                  src={bike.src}
                  alt={`Royal Enfield ${bike.name}`}
                  className="w-full h-full select-none pointer-events-none group-hover:brightness-105"
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'center bottom',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    filter: 'drop-shadow(0 15px 30px rgba(5,10,20,0.9))'
                  }}
                  loading="eager"
                  decoding={index === 0 ? 'sync' : 'async'}
                  // @ts-ignore
                  fetchpriority={index === 0 ? 'high' : 'auto'}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Arrows (Side controls) */}
        <div
          id="hero-nav-arrows-container"
          className="hero-nav-arrows-container pointer-events-none"
          aria-label="Carousel navigation controls"
        >
          {/* Floating Side Arrow Navigation: Previous (Desktop) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleManualPrev();
            }}
            className="hidden md:flex pointer-events-auto absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full items-center justify-center bg-white/80 hover:bg-white border border-black/10 hover:border-[#2E5D99]/40 text-[#0F2747] hover:text-[#050A14] transition-all duration-200 cursor-pointer backdrop-blur-sm group shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
            aria-label="Previous motorcycle"
          >
            <ChevronLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5 text-[#0F2747] group-hover:text-black" strokeWidth={2.2} />
          </button>

          {/* Floating Side Arrow Navigation: Next (Desktop) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleManualNext();
            }}
            className="hidden md:flex pointer-events-auto absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full items-center justify-center bg-white/80 hover:bg-white border border-black/10 hover:border-[#2E5D99]/40 text-[#0F2747] hover:text-[#050A14] transition-all duration-200 cursor-pointer backdrop-blur-sm group shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
            aria-label="Next motorcycle"
          >
            <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5 text-[#0F2747] group-hover:text-black" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* ===================================================================
          3. LOGICAL CONTAINER: ACTIVE BIKE INFORMATION AND SELECTOR
          Contains Active model name, accent line, subtitle, and bottom selector pills
          Centered beneath motorcycle with fixed spacing to prevent vertical layout shifts
          =================================================================== */}
      <div
        id="hero-active-bike-container"
        className="hero-active-bike-container absolute inset-x-0 flex flex-col items-center pointer-events-none select-none px-4"
        style={{
          bottom: isMobile ? '14px' : 'clamp(16px, 2.4vh, 24px)',
          zIndex: 40,
          textAlign: 'center',
          whiteSpace: 'nowrap'
        }}
      >
        {/* Active Motorcycle Information (Centered beneath the active bike) */}
        <div
          ref={titleRef}
          id="hero-active-bike-info"
          className="flex flex-col items-center justify-center mb-3 pointer-events-none"
        >
          {/* Dominant Active Model Name with fixed min-height to prevent vertical shift */}
          <h2
            id="hero-active-bike-title"
            className="bike-name-active uppercase m-0 leading-none flex items-center justify-center text-center"
            style={{
              fontSize: isMobile ? 'clamp(30px, 7vw, 42px)' : 'clamp(34px, 3.6vw, 50px)',
              lineHeight: 1,
              minHeight: isMobile ? '42px' : '50px'
            }}
          >
            {displayedBikeName}
          </h2>

          {/* Elegant Accent Underline */}
          <div className="w-14 sm:w-20 h-[2px] bg-gradient-to-r from-transparent via-[#E30100] to-transparent mt-1 sm:mt-1.5 mb-1.5 rounded-full shadow-[0_0_8px_rgba(227,1,0,0.5)]" />

          {/* Subtitle / Technical Tagline with fixed height to prevent vertical shift */}
          <p
            ref={subtitleRef}
            className="flex items-center justify-center text-[14px] font-bold tracking-[0.24em] uppercase text-[#B8CBDD] m-0 text-center leading-normal"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              height: '20px',
              lineHeight: '20px',
              paddingBottom: '2px'
            }}
          >
            {currentBike.tagline || 'SUPREME HIGHWAY CRUISER & STANCE'}
          </p>
        </div>

        {/* Motorcycle Selector & Indicators Container */}
        <div
          ref={navButtonsRef}
          id="hero-selector-container"
          className="hero-selector-container pointer-events-auto flex items-center justify-center"
        >
          <div
            className="flex items-center gap-3 sm:gap-3.5 px-4 py-2 rounded-full backdrop-blur-md transition-colors"
            style={{
              backgroundColor: 'rgba(11, 21, 36, 0.82)',
              border: '1px solid rgba(49, 95, 156, 0.38)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.55), 0 0 15px rgba(49, 95, 156, 0.15)'
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleManualPrev();
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#8FAAC6] hover:text-[#FFFFFF] hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
              aria-label="Previous motorcycle"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2.2} />
            </button>

            <div className="flex items-center gap-3 sm:gap-3.5 px-1">
              {BIKES.map((bike, idx) => {
                const isCurrent = idx === activeIndex;
                return (
                  <button
                    key={bike.name}
                    id={`hero-pill-${bike.name.toLowerCase().replace(/\s+/g, '-')}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualDot(idx);
                    }}
                    className={`transition-all duration-300 rounded-full cursor-pointer flex items-center gap-3 px-2.5 py-0.5 ${
                      isCurrent
                        ? 'bg-[#153259]/60 border border-[#4B85C8]/45 shadow-[0_1px_10px_rgba(46,93,153,0.3)]'
                        : 'border border-transparent hover:border-white/10 hover:bg-white/5'
                    }`}
                    aria-label={`View ${bike.name}`}
                    aria-pressed={isCurrent ? 'true' : 'false'}
                  >
                    {/* Preserved Active-Bike Indicator Dot / Pill */}
                    <span
                      className={`transition-all duration-500 rounded-full inline-block ${
                        isCurrent
                          ? 'w-5 h-1.5 bg-[#D4A862] shadow-[0_0_8px_rgba(212,168,98,0.85)]'
                          : 'w-2 h-1.5 bg-white/30 hover:bg-white/50'
                      }`}
                    />
                    {/* Motorcycle Name with Active vs Inactive Gradient */}
                    <span
                      className={`hidden sm:inline-block text-[14px] font-bold uppercase tracking-[0.08em] transition-all duration-300 whitespace-nowrap ${
                        isCurrent ? 'bike-name-active' : 'bike-name-inactive'
                      }`}
                    >
                      {bike.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleManualNext();
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#8FAAC6] hover:text-[#FFFFFF] hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
              aria-label="Next motorcycle"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
