import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Gauge,
  Zap,
  Flame,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { BIKES } from '../data/bikes';
import { Bike } from '../types/bike';
import BookingModal from './BookingModal';

gsap.registerPlugin(ScrollTrigger);

export default function ChooseYourRideSection() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bikeDisplayRef = useRef<HTMLDivElement>(null);
  const bikeImageRef = useRef<HTMLImageElement>(null);
  const bikeShadowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const specItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const ctaButtonRef = useRef<HTMLDivElement>(null);
  const navTabsRef = useRef<HTMLDivElement>(null);

  const prevIndexRef = useRef<number>(0);
  const activeBike = BIKES[activeIndex];


  // Entrance ScrollTrigger animation for the entire section
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header entrance
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          }
        );
      }

      // Initial bike stage entrance
      if (bikeDisplayRef.current) {
        gsap.fromTo(
          bikeDisplayRef.current,
          { opacity: 0, scale: 0.96 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.0,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 65%',
              toggleActions: 'play none none none'
            }
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // GSAP Transition when switching bikes
  const transitionToBike = useCallback(
    (nextIdx: number) => {
      if (nextIdx === activeIndex || isTransitioning) return;
      setIsTransitioning(true);

      const direction = nextIdx > activeIndex ? 1 : -1;
      const outgoingBike = bikeImageRef.current;
      const outgoingTitle = titleRef.current;
      const outgoingDesc = descRef.current;
      const outgoingSpecs = specItemsRef.current.filter(Boolean);

      const tl = gsap.timeline({
        onComplete: () => {
          prevIndexRef.current = activeIndex;
          setActiveIndex(nextIdx);

          // Animate new bike in
          requestAnimationFrame(() => {
            const enterTl = gsap.timeline({
              onComplete: () => {
                setIsTransitioning(false);
              }
            });

            if (bikeImageRef.current) {
              enterTl.fromTo(
                bikeImageRef.current,
                {
                  x: direction * 70,
                  opacity: 0,
                  scale: 0.92
                },
                {
                  x: 0,
                  opacity: 1,
                  scale: 1,
                  duration: 0.8,
                  ease: 'power3.out'
                },
                0
              );
            }

            if (bikeShadowRef.current) {
              enterTl.fromTo(
                bikeShadowRef.current,
                { opacity: 0, scaleX: 0.8 },
                { opacity: 1, scaleX: 1, duration: 0.7, ease: 'power2.out' },
                0
              );
            }

            if (titleRef.current) {
              enterTl.fromTo(
                titleRef.current,
                { y: 25, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
                0.1
              );
            }

            if (descRef.current) {
              enterTl.fromTo(
                descRef.current,
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
                0.15
              );
            }

            const validSpecs = specItemsRef.current.filter(Boolean);
            if (validSpecs.length > 0) {
              enterTl.fromTo(
                validSpecs,
                { y: 15, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.55,
                  stagger: 0.06,
                  ease: 'power2.out'
                },
                0.2
              );
            }
          });
        }
      });

      // Quick smooth exit
      if (outgoingBike) {
        tl.to(
          outgoingBike,
          {
            x: -direction * 50,
            opacity: 0,
            scale: 0.95,
            duration: 0.35,
            ease: 'power2.in'
          },
          0
        );
      }

      if (outgoingTitle) {
        tl.to(
          outgoingTitle,
          {
            y: -15,
            opacity: 0,
            duration: 0.25,
            ease: 'power2.in'
          },
          0
        );
      }

      if (outgoingDesc) {
        tl.to(
          outgoingDesc,
          {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in'
          },
          0
        );
      }

      if (outgoingSpecs.length > 0) {
        tl.to(
          outgoingSpecs,
          {
            opacity: 0,
            y: -10,
            duration: 0.2,
            stagger: 0.03,
            ease: 'power2.in'
          },
          0
        );
      }
    },
    [activeIndex, isTransitioning]
  );

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % BIKES.length;
    transitionToBike(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (activeIndex - 1 + BIKES.length) % BIKES.length;
    transitionToBike(prevIdx);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when modal is open or user is typing in form
      if (isModalOpen) return;
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, activeIndex, isTransitioning]);

  const progressPercentage = ((activeIndex + 1) / BIKES.length) * 100;

  return (
    <section
      ref={sectionRef}
      id="choose-your-ride"
      aria-label="Royal Enfield Bike Collection and Booking Experience"
      className="collection-section relative w-full bg-[#050A14] text-[#17283D] overflow-hidden select-none z-10"
      style={{
        background: 'radial-gradient(ellipse at 50% 35%, rgba(45, 78, 128, 0.16) 0%, rgba(15, 39, 71, 0.08) 50%, #050A14 90%)',
        backgroundColor: '#050A14',
        boxSizing: 'border-box'
      }}
    >
      {/* Anchor alias for #collection */}
      <div id="collection" className="absolute top-0 left-0" aria-hidden="true" />

      {/* Subtle Studio Steel-Blue Lighting Background Spotlight */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(45, 78, 128, 0.25) 0%, rgba(15, 39, 71, 0.08) 45%, transparent 70%)',
          zIndex: 1
        }}
        aria-hidden="true"
      />

      {/* Subtle Grid Ambient Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(to right, #7CA7E6 1px, transparent 1px), linear-gradient(to bottom, #7CA7E6 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
        aria-hidden="true"
      />

      {/* Centered Main Container: max-width 1440px, margin-inline auto, box-sizing border-box */}
      <div
        id="collection-container"
        className="collection-container relative z-10 w-full max-w-[1440px] flex flex-col"
        style={{
          width: '100%',
          maxWidth: '1440px',
          marginInline: 'auto',
          paddingInline: 'clamp(20px, 4vw, 64px)',
          boxSizing: 'border-box'
        }}
      >
        {/* ===================================================================
            SECTION HEADER: TWO-COLUMN CLEAN GRID
            =================================================================== */}
        <div ref={headerRef} className="collection-header mb-8 sm:mb-10 w-full">
          {/* Category Eyebrow */}
          <div className="flex items-center gap-3 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58A28] animate-pulse" />
            <span
              className="text-[14px] tracking-[0.25em] text-[#C58A28] uppercase font-semibold"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              ROYAL ENFIELD / COLLECTION
            </span>
          </div>

          {/* Heading (Left) & Introductory Description (Right) */}
          <div className="collection-header-grid w-full">
            <div className="collection-header-left">
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl uppercase tracking-[0.03em] leading-[0.92] m-0 heading-chiselled-hero"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  color: '#E30100',
                  background: 'linear-gradient(180deg, #FF7A6C 0%, #FF4A40 18%, #E30100 38%, #A80000 70%, #4A0000 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStroke: '1px #D49A00',
                  paintOrder: 'stroke fill',
                  filter: 'drop-shadow(0 2px 0px #593B00) drop-shadow(0 3px 1px #1F0202) drop-shadow(0 6px 16px rgba(0, 0, 0, 0.4))',
                }}
              >
                <span className="block">CHOOSE</span>
                <span className="block">YOUR RIDE.</span>
              </h2>
            </div>

            <div className="collection-header-right">
              <p
                className="text-[14px] text-[#536174] max-w-md font-normal leading-[1.65] m-0"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Explore the machines and find the one that fits your journey.
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================
            MINIMAL BIKE SELECTOR NAVIGATION & PROGRESS
            =================================================================== */}
        <div
          className="collection-nav-row w-full flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[rgba(23,40,61,0.1)] mb-2 sm:mb-3"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          {/* Horizontal Bike Tabs */}
          <div
            ref={navTabsRef}
            className="collection-nav-tabs flex items-center gap-3 sm:gap-3.5 overflow-x-auto py-1"
          >
            {BIKES.map((bike, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  id={`collection-tab-${idx}`}
                  key={bike.name}
                  type="button"
                  onClick={() => transitionToBike(idx)}
                  style={{
                    flexShrink: 0,
                    ...(isActive
                      ? {
                          backgroundColor: '#E30100',
                          color: '#ffffff',
                          borderColor: '#E30100',
                          boxShadow: '0 4px 14px rgba(227, 1, 0, 0.35)'
                        }
                      : {})
                  }}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-[14px] uppercase tracking-wider transition-all duration-300 flex items-center gap-3 whitespace-nowrap cursor-pointer font-semibold ${
                    isActive
                      ? 'text-white border border-[#E30100]'
                      : 'text-[#536174] hover:text-[#E30100] hover:bg-white/70 border border-transparent'
                  }`}
                  aria-label={`Select ${bike.name}`}
                >
                  <span
                    className="text-[14px] font-bold"
                    style={{ color: isActive ? '#FFF4BC' : '#C58A28' }}
                  >
                    0{idx + 1}
                  </span>
                  <span style={{ color: isActive ? '#ffffff' : undefined }}>{bike.name}</span>
                </button>
              );
            })}
          </div>

          {/* Counter, Progress Bar & Arrow Controls */}
          <div className="collection-nav-controls flex items-center justify-between sm:justify-end gap-5">
            {/* Progress indicator */}
            <div className="flex items-center gap-3 font-semibold">
              <span className="text-[14px] text-[#C58A28]">
                0{activeIndex + 1}
              </span>
              <div className="w-16 sm:w-24 h-[2px] bg-[rgba(23,40,61,0.14)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C58A28] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-[14px] text-[#78818D]">
                0{BIKES.length}
              </span>
            </div>

            {/* Prev / Next buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isTransitioning}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-[rgba(23,40,61,0.16)] hover:border-[#E30100] text-[#17283D] hover:text-[#E30100] flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                aria-label="Previous motorcycle"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={isTransitioning}
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-[rgba(23,40,61,0.16)] hover:border-[#E30100] text-[#17283D] hover:text-[#E30100] flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                aria-label="Next motorcycle"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================
            MAIN SHOWROOM STAGE: LARGE MOTORCYCLE PRESENTATION
            =================================================================== */}
        <div
          ref={bikeDisplayRef}
          className="collection-stage relative w-full flex flex-col items-center justify-center pt-0 pb-2"
        >
          {/* Top Label & Category */}
          <div ref={descRef} className="w-full text-center mb-3">
            <span
              className="inline-block px-4 py-1 rounded-full bg-white/90 border text-[14px] tracking-[0.2em] uppercase font-semibold shadow-sm"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                color: '#E30100',
                borderColor: 'rgba(227, 1, 0, 0.25)'
              }}
            >
              {activeBike.categoryBadge || 'ROYAL ENFIELD MOTORCYCLE'}
            </span>
          </div>

          {/* Model Name Typography */}
          <div
            ref={titleRef}
            className="w-full text-center mb-1 sm:mb-2"
          >
            <h3
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase leading-none m-0 heading-chiselled-hero"
              style={{
                fontFamily: "'Bebas Neue', 'Anton', sans-serif",
                letterSpacing: '0.04em',
                color: '#E30100',
                background: 'linear-gradient(180deg, #FF7A6C 0%, #FF4A40 18%, #E30100 38%, #A80000 70%, #4A0000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                WebkitTextStroke: '1.2px #D49A00',
                paintOrder: 'stroke fill',
                filter: 'drop-shadow(0 2px 0px #593B00) drop-shadow(0 3px 1px #1F0202) drop-shadow(0 6px 16px rgba(0, 0, 0, 0.4))',
              }}
            >
              {activeBike.name}
            </h3>
            {activeBike.tagline && (
              <p
                className="text-[14px] tracking-[0.22em] uppercase text-[#C58A28] mt-3 font-semibold"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                {activeBike.tagline}
              </p>
            )}
          </div>

          {/* LARGE MOTORCYCLE IMAGE (Studio Presentation, No Box Card) */}
          <div className="collection-bike-showcase relative w-full max-w-[840px] flex items-center justify-center my-1 sm:my-1.5">
            {/* Ambient Radial Spotlight Behind Motorcycle */}
            <div
              className="absolute inset-0 m-auto w-4/5 h-4/5 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(45, 78, 128, 0.25) 0%, rgba(15, 39, 71, 0.08) 45%, transparent 70%)',
                filter: 'blur(28px)'
              }}
              aria-hidden="true"
            />

            {/* Motorcycle Image */}
            <div className="relative z-10 w-full flex items-center justify-center px-4 sm:px-6">
              <img
                ref={bikeImageRef}
                src={activeBike.src}
                alt={`Royal Enfield ${activeBike.name}`}
                className="collection-bike-image w-full max-w-[740px] h-auto max-h-[220px] sm:max-h-[260px] md:max-h-[290px] object-contain select-none pointer-events-none"
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Studio Floor Contact Shadow */}
            <div
              ref={bikeShadowRef}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 max-w-[680px] h-6 sm:h-8 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(23, 40, 61, 0.35) 0%, rgba(23, 40, 61, 0.15) 45%, transparent 75%)',
                filter: 'blur(8px)',
                zIndex: 5
              }}
              aria-hidden="true"
            />
          </div>

          {/* Short Description */}
          {activeBike.description && (
            <p
              className="text-[14px] text-[#536174] max-w-xl text-center font-normal leading-[1.6] px-4 my-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {activeBike.description}
            </p>
          )}

          {/* ===================================================================
              3–4 KEY SPECIFICATIONS GRID
              =================================================================== */}
          <div className="w-full max-w-2xl my-2 sm:my-2.5 px-4" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
              {(activeBike.specs && activeBike.specs.length > 0
                ? activeBike.specs
                : [
                    { label: 'DISPLACEMENT', value: '349 CC' },
                    { label: 'MAX POWER', value: activeBike.power?.split('@')[0]?.trim() || '20.2 BHP' },
                    { label: 'PEAK TORQUE', value: activeBike.torque?.split('@')[0]?.trim() || '27 NM' },
                    { label: 'TRANSMISSION', value: '5-SPEED' }
                  ]
              ).map((spec, sIdx) => (
                <div
                  key={spec.label}
                  ref={(el) => {
                    specItemsRef.current[sIdx] = el;
                  }}
                  className="p-[15px] rounded-xl bg-[#FBF8F2] border border-[rgba(23,40,61,0.14)] hover:border-[#315F9C]/50 transition-colors text-center flex flex-col items-center justify-center shadow-[0_4px_16px_rgba(23,40,61,0.06)]"
                >
                  <span className="text-[14px] tracking-[0.18em] text-[#78818D] uppercase font-semibold block mb-3">
                    {spec.label}
                  </span>
                  <span className="text-[14px] font-bold uppercase tracking-wider text-[#17283D]">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ===================================================================
              MAIN BOOKING CTA BUTTON
              =================================================================== */}
          <div ref={ctaButtonRef} className="mt-3 sm:mt-4 flex flex-col items-center gap-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            <button
              id="btn-book-test-ride"
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #C58A28 0%, #D89F3A 50%, #B67C1D 100%)',
                color: '#FFFFFF',
              }}
              className="px-8 sm:px-10 py-3 rounded-full font-bold text-[14px] uppercase tracking-[0.18em] shadow-[0_4px_25px_rgba(197,138,40,0.35)] hover:shadow-[0_8px_35px_rgba(197,138,40,0.55)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 flex items-center gap-3 cursor-pointer group"
            >
              <span>BOOK A TEST RIDE</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 text-white" />
            </button>

            <span className="text-[14px] tracking-wider text-[#78818D] uppercase font-semibold">
              COMPLIMENTARY RIDE AT AUTHORIZED SHOWROOMS
            </span>
          </div>
        </div>

        {/* ===================================================================
            SECTION END LINE
            =================================================================== */}
        <div className="mt-12 sm:mt-16 pt-8 pb-3 text-center border-t border-[rgba(23,40,61,0.1)] w-full">
          <p
            className="text-[14px] tracking-[0.3em] uppercase text-[#C58A28] font-semibold m-0"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            FIND THE ONE THAT FEELS RIGHT.
          </p>
        </div>
      </div>

      {/* ===================================================================
          BOOKING MODAL DIALOG
          =================================================================== */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedBike={activeBike}
        allBikes={BIKES}
        onBikeChange={(bike) => {
          const idx = BIKES.findIndex((b) => b.name === bike.name);
          if (idx !== -1) {
            setActiveIndex(idx);
          }
        }}
      />
    </section>
  );
}
