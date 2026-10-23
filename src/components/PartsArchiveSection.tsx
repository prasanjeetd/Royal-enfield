import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ArrowUpRight, X, Shield, Cpu, Gauge, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export interface PartItem {
  id: string;
  num: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  statLine: string;
  specs: { label: string; value: string }[];
  technicalDetails: {
    engineering: string;
    materials: string;
    acousticThermal: string;
    serviceSpecs: string[];
  };
}

const PARTS_DATA: PartItem[] = [
  {
    id: 'engine',
    num: '01',
    category: '01 / POWERTRAIN',
    title: 'J-SERIES ENGINE',
    subtitle: 'THE HEART OF THE MACHINE',
    description:
      'Single-cylinder powerplant engineered for smooth low-end torque, refined primary balancer cadence, and effortless cruising composure.',
    image: '/engine.webp',
    statLine: '349 CC  •  20.2 BHP  •  27 NM',
    specs: [
      { label: 'DISPLACEMENT', value: '349 CC' },
      { label: 'MAX POWER', value: '20.2 BHP @ 6100 RPM' },
      { label: 'PEAK TORQUE', value: '27 NM @ 4000 RPM' },
    ],
    technicalDetails: {
      engineering:
        'Long-stroke architecture (72mm bore × 85.8mm stroke) delivering linear low-end tractability. Internal primary counter-balancer shaft eliminates secondary harmonics for silky cruising.',
      materials:
        'High-pressure die-cast aluminum crankcases with deep-ribbed heat dissipating cylinder cooling jacket and induction-hardened forged camshaft.',
      acousticThermal:
        'Air-oil cooling circuit driven by an internal high-flow trochoid pump, tuned for optimal thermal endurance and visceral mechanical baritone.',
      serviceSpecs: [
        'Valve Train: SOHC 2-Valve',
        'Compression Ratio: 9.5:1',
        'Lubrication: Forced Wet Sump',
        'Fueling: Keihin Closed-Loop EFI',
      ],
    },
  },
  {
    id: 'exhaust',
    num: '02',
    category: '02 / ACOUSTICS',
    title: 'TUNED PEASHOOTER',
    subtitle: 'THE VOICE OF THE MACHINE',
    description:
      'Hydroformed exhaust designed to deliver the unmistakable Royal Enfield character with deep, low-frequency pulse.',
    image: '/exhaust.webp',
    statLine: 'BS6  •  HYDROFORMED  •  CATALYTIC',
    specs: [
      { label: 'EMISSION', value: 'BS6 PHASE-2' },
      { label: 'FABRICATION', value: 'HYDROFORMED' },
      { label: 'CATALYTIC', value: 'INTEGRATED' },
    ],
    technicalDetails: {
      engineering:
        'Continuous hydroformed stainless steel header pipe minimizing exhaust turbulence, matched with a calibrated chamber baffle core for resonant acoustic character.',
      materials:
        'Multi-layer nickel-chromium triple-plated mirror exterior with ceramic-lined internal collector box for maximum corrosion and heat resistance.',
      acousticThermal:
        'Internal multi-stage sound absorption matrices designed to accentuate low-register firing pulses while suppressing harsh high-frequency noise.',
      serviceSpecs: [
        'Silencer Type: Peashooter Canister',
        'Oxygen Sensor: Pre-Cat Heated Lambda',
        'Mounting: Rubber-Isolated Sprung Hanger',
        'Finish: Mirror Chrome Plating',
      ],
    },
  },
  {
    id: 'headlight',
    num: '03',
    category: '03 / ILLUMINATION',
    title: 'SIGNATURE HEADLIGHT',
    subtitle: 'SEE THE ROAD DIFFERENTLY',
    description:
      'Classic round headlamp combining iconic design with functional illumination and signature twin LED tiger-eye pilot lamps.',
    image: '/headlight.webp',
    statLine: 'CHROME  •  PILOT LIGHT  •  CLASSIC ROUND',
    specs: [
      { label: 'HOUSING', value: 'CAST NACELLE' },
      { label: 'PILOT LAMPS', value: 'TWIN LED' },
      { label: 'POWER', value: '12V CONSTANT' },
    ],
    technicalDetails: {
      engineering:
        'Precision computer-optimized prismatic glass lens ensuring uniform spread pattern and wide-angle shoulder illumination during night touring.',
      materials:
        'Die-cast aluminium structural nacelle housing with heavy-gauge chrome-plated retaining bezel and weatherproof EPDM perimeter seals.',
      acousticThermal:
        'Integrated passive heatsink channels within the upper nacelle cowl keeping stator-regulated electronics at optimal operational temperature.',
      serviceSpecs: [
        'Reflector: Parabolic Aluminum Vapor',
        'Bulb: 60/55W H4 Halogen',
        'Pilot Units: Twin High-Lumen 12V LEDs',
        'Wiring: Fully Braided Weatherproof Harness',
      ],
    },
  },
  {
    id: 'tank',
    num: '04',
    category: '04 / RESERVOIR',
    title: 'SCULPTED TANK',
    subtitle: 'THE SILHOUETTE OF THE MACHINE',
    description:
      'A sculpted steel tank that defines the Classic 350’s unmistakable profile, hand-crafted with Madras dual gold coachlines.',
    image: '/tank.webp',
    statLine: 'STEEL  •  13 L  •  HAND-CRAFTED FORM',
    specs: [
      { label: 'CAPACITY', value: '13.0 LITRES' },
      { label: 'MATERIAL', value: 'STAMPED STEEL' },
      { label: 'PINSTRIPES', value: 'HAND-CRAFTED' },
    ],
    technicalDetails: {
      engineering:
        'Sculpted teardrop geometry designed to optimize rider knee ergonomics and aerodynamic flow over the triple-tree steering head assembly.',
      materials:
        'High-grade deep-drawn stamped sheet steel with anti-corrosion internal phosphate dip and multi-coat high-solid clear polyurethane gloss.',
      acousticThermal:
        'Dual rubber mount damping system isolating fuel mass harmonics and engine resonance from the main tubular spine chassis.',
      serviceSpecs: [
        'Fuel Pump: In-Tank Submersible High-Pressure',
        'Cap: Die-Cast Locking Chrome Filler',
        'Coachlines: Dual Hand-Painted Madras Gold',
        'Badging: Metal Die-Cast Heritage Crest',
      ],
    },
  },
  {
    id: 'seat',
    num: '05',
    category: '05 / ERGONOMICS',
    title: 'SCULPTED SADDLE',
    subtitle: 'CRAFTED FOR THE RIDE',
    description:
      'A carefully shaped seat designed around long-distance comfort, classic sprung subframe character, and commanding upright posture.',
    image: '/seat.webp',
    statLine: 'DUAL-DENSITY  •  PREMIUM RIBBING  •  ERGONOMIC FORM',
    specs: [
      { label: 'SEAT HEIGHT', value: '805 MM' },
      { label: 'SUBFRAME', value: 'SPRUNG STEEL' },
      { label: 'UPHOLSTERY', value: 'WEATHER-SHIELD' },
    ],
    technicalDetails: {
      engineering:
        'Ergonomic pressure-mapped contour designed to support pelvic alignment and minimize tailbone fatigue across multi-hour highway voyages.',
      materials:
        'Dual-density polyurethane molded foam core with heavy-duty weatherproof grain vinyl and UV-stabilized perimeter twin-needle contrast stitching.',
      acousticThermal:
        'Micro-perforated breathable center insert reducing heat buildup during intense direct-sun saddle exposure.',
      serviceSpecs: [
        'Seat Height: 805 mm Standard',
        'Mounting: Sprung Quick-Release Sub-Stay',
        'Foam: Memory-Assisted High Resilience',
        'Trim: Heritage Madras Weather-Shield Vinyl',
      ],
    },
  },
];

/**
 * PartsArchiveSection Component
 */
export default function PartsArchiveSection() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [modalPart, setModalPart] = useState<PartItem | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  /**
   * GSAP ScrollTrigger Setup
   */
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      // Intro Animation
      gsap.fromTo(
        introRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: introRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        const totalItems = PARTS_DATA.length;
        const scrollDistance = track.scrollWidth - window.innerWidth + 140;

        const tween = gsap.to(track, {
          x: () => -scrollDistance,
          ease: 'none',
          scrollTrigger: {
            id: 'partsTrackScroll',
            trigger: section,
            start: 'top top',
            end: () => `+=${scrollDistance * 1.3}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const prog = self.progress;
              const currentIdx = Math.min(
                Math.floor(prog * totalItems),
                totalItems - 1
              );
              setActiveIdx(currentIdx);

              if (progressBarRef.current) {
                progressBarRef.current.style.width = `${Math.max(15, ((currentIdx + 1) / totalItems) * 100)}%`;
              }
            },
          },
        });

        return () => {
          tween.kill();
        };
      });

      mm.add('(max-width: 767px)', () => {
        const cards = track.querySelectorAll('.part-item-mobile');
        cards.forEach((card) => {
          gsap.fromTo(
            card,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  /**
   * Modal Open / Close GSAP Animation
   */
  useEffect(() => {
    if (modalPart && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.94, y: 16 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, [modalPart]);

  const closeModal = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.94,
        y: 12,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: () => setModalPart(null),
      });
    } else {
      setModalPart(null);
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalPart) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalPart]);

  /**
   * Track Navigation Click Handler
   */
  const scrollToPart = (index: number) => {
    setActiveIdx(index);
    const st = ScrollTrigger.getById('partsTrackScroll');
    if (window.innerWidth >= 768 && st) {
      const targetScroll = st.start + (st.end - st.start) * (index / (PARTS_DATA.length - 0.2));
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    } else {
      const element = document.getElementById(`part-item-${PARTS_DATA[index].id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  /**
   * Parallax Cursor Tracking
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 16;
    const y = (clientY / window.innerHeight - 0.5) * 16;
    setMousePos({ x, y });
  };

  return (
    <section
      ref={sectionRef}
      id="parts-archive"
      aria-label="Parts Archive — Premium Motorcycle Components Showcase"
      onMouseMove={handleMouseMove}
      className="parts-archive-section"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(45, 78, 128, 0.18) 0%, rgba(15, 39, 71, 0.1) 45%, #050A14 85%)',
        backgroundColor: '#050A14',
      }}
    >
      {/* Subtle Ambient Radial Lighting Highlights */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(45, 78, 128, 0.22) 0%, rgba(15, 39, 71, 0.08) 50%, transparent 75%)',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* Subtle Grain Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* ============================================================== */}
      {/* 1. SECTION INTRO (COMPACT EDITORIAL MASTHEAD & COMPONENT NAV) */}
      {/* ============================================================== */}
      <div
        ref={introRef}
        className="parts-archive-header"
      >
        {/* Row 1: Left = Category Label + Main Heading; Right = Descriptive Paragraph */}
        <div className="parts-archive-header-row1">
          <div className="flex flex-col">
            {/* Small Category Label */}
            <div className="flex items-center gap-3 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C58A28] animate-pulse" />
              <span
                className="text-[14px] tracking-[0.28em] text-[#C58A28] uppercase font-semibold"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                ENGINEERED IN EVERY DETAIL
              </span>
            </div>

            {/* Main Heading */}
            <h2
              className="text-4xl sm:text-5xl lg:text-[54px] uppercase tracking-[0.03em] leading-none m-0 heading-chiselled-hero"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: '0.04em',
                color: '#E30100',
                background: 'linear-gradient(180deg, #FF7A6C 0%, #FF4A40 18%, #E30100 38%, #A80000 70%, #4A0000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                WebkitTextStroke: '1px #D49A00',
                paintOrder: 'stroke fill',
                filter: 'drop-shadow(0 2px 0px #593B00) drop-shadow(0 3px 1px #1F0202) drop-shadow(0 6px 16px rgba(0, 0, 0, 0.4))',
              }}
            >
              EVERY PART HAS A PURPOSE.
            </h2>
          </div>

          {/* Supporting Description Text (Desktop/Tablet on the right) */}
          <div className="max-w-md md:text-right">
            <p
              className="text-[14px] text-[#536174] leading-[1.6] m-0 font-normal"
              style={{ fontFamily: 'Inter, Helvetica, Arial, sans-serif' }}
            >
              From power and sound to light and comfort, every component is designed to shape the character of the machine.
            </p>
          </div>
        </div>

        {/* Row 2: Clearly Defined Component Navigation Row & Progress Bar */}
        <div className="parts-archive-nav-row">
          {/* Component Navigation Tabs */}
          <div
            className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            {PARTS_DATA.map((part, idx) => {
              const isActive = activeIdx === idx;
              return (
                <button
                  id={`nav-part-btn-${part.id}`}
                  key={part.id}
                  type="button"
                  onClick={() => scrollToPart(idx)}
                  className={`flex items-center gap-3 px-3.5 py-1 rounded-full text-[14px] tracking-wider transition-all duration-300 cursor-pointer font-semibold shrink-0 ${
                    isActive
                      ? 'bg-[#315F9C] text-white border border-[#315F9C] shadow-[0_2px_12px_rgba(49,95,156,0.35)]'
                      : 'bg-white/80 text-[#536174] hover:text-[#17283D] hover:bg-white border border-[rgba(23,40,61,0.14)] shadow-sm'
                  }`}
                >
                  <span className={isActive ? 'text-[#C58A28]' : 'text-[#315F9C]'}>
                    {part.num}
                  </span>
                  <span>{part.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div
            className="flex items-center gap-3 text-[14px] tracking-widest text-[#C58A28] font-semibold shrink-0"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            <span className="font-bold">0{activeIdx + 1}</span>
            <div className="w-20 sm:w-24 h-1 rounded-full bg-[rgba(23,40,61,0.14)] overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-[#C58A28] transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(15, ((activeIdx + 1) / PARTS_DATA.length) * 100)}%` }}
              />
            </div>
            <span className="text-[#78818D]">05</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MOVING PARTS SHOWCASE TRACK */}
      {/* ============================================================== */}
      <div className="parts-archive-track-container">
        <div
          ref={trackRef}
          className="parts-archive-track"
        >
          {PARTS_DATA.map((part, idx) => {
            const isActive = activeIdx === idx;
            return (
              <div
                key={part.id}
                id={`part-item-${part.id}`}
                className="part-item-mobile parts-card group"
              >
                {/* 1. Component Heading Block (Label -> Heading -> Subtitle) */}
                <div className="text-center w-full mb-1">
                  <div className="flex items-center justify-center gap-3 mb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C58A28]" />
                    <span
                      className="text-[11px] tracking-[0.25em] text-[#315F9C] uppercase font-semibold"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      {part.category}
                    </span>
                  </div>
                  <h3
                    className="text-4xl sm:text-5xl lg:text-[52px] uppercase tracking-[0.03em] leading-none my-1 heading-chiselled-card"
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      letterSpacing: '0.04em',
                      color: '#E30100',
                      background: 'linear-gradient(180deg, #FF7A6C 0%, #FF4A40 18%, #E30100 38%, #A80000 70%, #4A0000 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      WebkitTextStroke: '0.85px #D49A00',
                      paintOrder: 'stroke fill',
                      filter: 'drop-shadow(0 1.5px 0px #593B00) drop-shadow(0 2px 1px #1F0202) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35))',
                    }}
                  >
                    {part.title}
                  </h3>
                  <p
                    className="text-[12px] tracking-[0.2em] text-[#C58A28] uppercase mt-1 mb-0 font-medium"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {part.subtitle}
                  </p>
                </div>

                {/* 2. Centered Floating Image Stage */}
                <div className="relative w-full h-36 sm:h-40 md:h-44 lg:h-48 flex items-center justify-center my-0.5">
                  {/* Subtle Studio Radial Glow */}
                  <div
                    className="absolute w-40 h-40 md:w-52 md:h-52 rounded-full pointer-events-none transition-opacity duration-700 opacity-40 group-hover:opacity-70"
                    style={{
                      background: 'radial-gradient(circle, rgba(120, 169, 232, 0.22) 0%, rgba(232, 236, 241, 0.4) 50%, rgba(244, 240, 232, 0) 70%)',
                      filter: 'blur(24px)',
                    }}
                  />

                  {/* Soft Floor Shadow */}
                  <div
                    className="absolute bottom-2 w-40 sm:w-52 md:w-60 h-6 rounded-full pointer-events-none opacity-80"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(23, 40, 61, 0.28) 0%, rgba(23, 40, 61, 0) 70%)',
                      filter: 'blur(8px)',
                    }}
                  />

                  {/* Floating Transparent Image */}
                  <img
                    src={part.image}
                    alt={part.title}
                    loading="lazy"
                    className="relative z-10 max-w-[85%] max-h-[85%] object-contain drop-shadow-[0_12px_24px_rgba(23,40,61,0.22)] transition-transform duration-500 ease-out group-hover:scale-105"
                    style={{
                      transform: `translate3d(${mousePos.x * 0.35}px, ${mousePos.y * 0.35}px, 0)`,
                    }}
                  />
                </div>

                {/* 3. Description */}
                <div className="text-center w-full max-w-md my-1">
                  <p
                    className="text-[14px] text-[#536174] leading-[1.6] m-0 font-normal"
                    style={{ fontFamily: 'Inter, Helvetica, Arial, sans-serif' }}
                  >
                    {part.description}
                  </p>
                </div>

                {/* 4. Technical Metadata & View Detail Action Together */}
                <div
                  className="w-full flex flex-col items-center gap-3"
                  style={{ marginTop: '14px' }}
                >
                  {/* Stat Line */}
                  <div
                    className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/90 border border-[rgba(23,40,61,0.14)] text-[14px] font-semibold text-[#17283D] tracking-wider shadow-sm"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    <span>{part.statLine}</span>
                  </div>

                  {/* View Detail Button */}
                  <button
                    id={`btn-detail-${part.id}`}
                    type="button"
                    onClick={() => setModalPart(part)}
                    className="parts-detail-btn group/btn"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    <span>VIEW DETAIL</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* ============================================================ */}
          {/* 3. CLOSING SECTION CARD (BUILT FROM THE DETAILS) */}
          {/* ============================================================ */}
          <div className="flex-shrink-0 w-full md:w-[380px] lg:w-[420px] p-6 sm:p-8 rounded-3xl border border-[rgba(23,40,61,0.14)] bg-[#F5F1E8] flex flex-col justify-between items-start my-auto shadow-[0_16px_36px_rgba(23,40,61,0.07)]">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-4 h-4 text-[#C58A28]" />
                <span
                  className="text-[14px] tracking-[0.25em] text-[#315F9C] uppercase font-semibold"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  INTEGRATED ENGINEERING
                </span>
              </div>
              <h3
                className="text-4xl sm:text-5xl uppercase tracking-[0.03em] leading-tight mb-3 heading-chiselled-hero"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '0.04em',
                  color: '#E30100',
                  background: 'linear-gradient(180deg, #FF7A6C 0%, #FF4A40 18%, #E30100 38%, #A80000 70%, #4A0000 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStroke: '1px #D49A00',
                  paintOrder: 'stroke fill',
                  filter: 'drop-shadow(0 2px 0px #593B00) drop-shadow(0 3px 1px #1F0202) drop-shadow(0 6px 16px rgba(0, 0, 0, 0.4))',
                }}
              >
                BUILT FROM<br />
                THE DETAILS.
              </h3>
              <p
                className="text-[14px] text-[#536174] leading-[1.6] mb-3.5 font-normal"
                style={{ fontFamily: 'Inter, Helvetica, Arial, sans-serif' }}
              >
                Every component contributes to the character, cadence, and legacy of the complete Royal Enfield Classic 350.
              </p>
            </div>

            {/* Link back to 3D Motorcycle Section */}
            <a
              href="#bike-3d"
              className="inline-flex items-center justify-between w-full px-5 py-2.5 rounded-xl bg-[#C58A28] hover:bg-[#b07820] text-white font-bold text-[14px] tracking-wider uppercase transition-all duration-300 shadow-[0_4px_16px_rgba(197,138,40,0.35)] cursor-pointer group/back"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('bike-3d');
                if (el) {
                  if ((window as any).__lenis) {
                    (window as any).__lenis.scrollTo(el, { offset: -70 });
                  } else {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
            >
              <span>EXPLORE THE COMPLETE MACHINE</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/back:translate-x-1.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. EXPANDED TECHNICAL DETAIL OVERLAY MODAL */}
      {/* ============================================================== */}
      {modalPart && (
        <div
          id="parts-spec-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parts-modal-title"
          className="parts-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            ref={modalRef}
            className="parts-modal-card"
          >
            {/* Top Accent Line */}
            <div className="parts-modal-top-accent" />

            {/* Modal Header: Category label + Close button */}
            <div className="parts-modal-header" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C58A28] shrink-0" />
                <span className="text-[11px] sm:text-xs tracking-[0.25em] text-[#315F9C] uppercase font-bold truncate">
                  {modalPart.category} • TECHNICAL ARCHIVE
                </span>
              </div>

              {/* Close Button */}
              <button
                id="btn-close-parts-modal"
                type="button"
                onClick={closeModal}
                className="parts-modal-close-btn"
                aria-label="Close specifications modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Component Title & Technical Badge */}
            <div className="parts-modal-title-row">
              <h3
                id="parts-modal-title"
                className="text-3xl sm:text-4xl uppercase tracking-wide m-0 leading-none heading-chiselled-card"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: '0.04em',
                  color: '#E30100',
                  background: 'linear-gradient(180deg, #FF7A6C 0%, #FF4A40 18%, #E30100 38%, #A80000 70%, #4A0000 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStroke: '0.85px #D49A00',
                  paintOrder: 'stroke fill',
                  filter: 'drop-shadow(0 1.5px 0px #593B00) drop-shadow(0 2px 1px #1F0202) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35))',
                }}
              >
                {modalPart.title}
              </h3>

              <div
                className="px-4 py-1.5 rounded-full bg-white border border-[rgba(23,40,61,0.14)] text-[14px] font-semibold text-[#17283D] shadow-sm shrink-0"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                {modalPart.statLine}
              </div>
            </div>

            {/* Subtitle with comfortable spacing */}
            <p
              className="text-[14px] tracking-wider text-[#C58A28] uppercase mt-0 mb-3 sm:mb-3.5 font-semibold shrink-0"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              {modalPart.subtitle}
            </p>

            {/* Detailed Spec Sections - Scrollable Area */}
            <div className="parts-modal-body">
              {/* Architecture & Metallurgy */}
              <div className="parts-modal-section-card">
                <div className="parts-modal-section-title">
                  <Cpu className="w-4 h-4 text-[#315F9C] shrink-0" />
                  <span>Architecture & Metallurgy</span>
                </div>
                <p className="parts-modal-section-desc">
                  {modalPart.technicalDetails.engineering}
                </p>
              </div>

              {/* Finishes & Treatment */}
              <div className="parts-modal-section-card">
                <div className="parts-modal-section-title">
                  <Shield className="w-4 h-4 text-[#315F9C] shrink-0" />
                  <span>Finishes & Treatment</span>
                </div>
                <p className="parts-modal-section-desc">
                  {modalPart.technicalDetails.materials}
                </p>
              </div>

              {/* Factory Benchmarks */}
              <div className="parts-modal-section-card">
                <div className="parts-modal-section-title">
                  <Gauge className="w-4 h-4 text-[#315F9C] shrink-0" />
                  <span>Factory Benchmarks</span>
                </div>
                <div className="parts-modal-benchmarks-grid">
                  {modalPart.technicalDetails.serviceSpecs.map((item, i) => (
                    <div key={i} className="parts-modal-benchmark-item">
                      <span className="parts-modal-benchmark-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="parts-modal-footer">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C58A28] shrink-0" />
                <span className="text-[14px] tracking-wider text-[#78818D] font-bold uppercase">
                  CLASSIC 350 MOTORCYCLE ARCHIVE
                </span>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="parts-modal-footer-btn"
              >
                Close Specification
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
