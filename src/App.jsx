import React, { useEffect, Suspense, lazy } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import CustomCursor from './components/CustomCursor';
import Navigation from './components/Navigation';
import EditorialHero from './components/EditorialHero';
import ErrorBoundary from './components/ErrorBoundary';
import CinematicLoader from './components/CinematicLoader';

// Lazy-load heavy below-the-fold sections for faster initial page load
const Bike3DExperience = lazy(() => import('./components/Bike3DExperience'));
const PartsArchiveSection = lazy(() => import('./components/PartsArchiveSection'));
const ChooseYourRideSection = lazy(() => import('./components/ChooseYourRideSection'));
const ContactSection = lazy(() => import('./components/ContactSection'));

gsap.registerPlugin(ScrollTrigger);

/**
 * App Root Component — Royal Enfield Experience
 * Flow: 1. Hero -> 2. 3D Experience -> 3. Parts Showcase -> 4. Choose Your Ride -> 5. Contact
 */
export default function App() {
  useEffect(() => {
    // 1. Enforce manual scroll restoration so the browser does not jump on reload
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // 2. Clear GSAP ScrollTrigger internal scroll memory
    if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.clearScrollMemory) {
      ScrollTrigger.clearScrollMemory('manual');
    }

    // 3. Reset window scroll to 0 immediately
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 4. Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    window.__lenis = lenis;
    window.__ScrollTrigger = ScrollTrigger;
    window.__gsap = gsap;

    // Reset Lenis internal scroll position to 0 immediately
    lenis.scrollTo(0, { immediate: true });

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateTicker = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(1000, 16);

    // Track user-initiated scrolling to avoid interfering with intentional gestures
    let userScrolled = false;
    const onUserInteraction = () => {
      userScrolled = true;
    };
    window.addEventListener('wheel', onUserInteraction, { passive: true, once: true });
    window.addEventListener('touchmove', onUserInteraction, { passive: true, once: true });
    window.addEventListener('keydown', onUserInteraction, { passive: true, once: true });

    // Guard during initial paint and layout computation (e.g. as Suspense components hydrate)
    const rafId = requestAnimationFrame(() => {
      if (!userScrolled) {
        lenis.scrollTo(0, { immediate: true });
        window.scrollTo(0, 0);
      }
    });

    const timerId = setTimeout(() => {
      if (!userScrolled && window.scrollY > 0) {
        lenis.scrollTo(0, { immediate: true });
        window.scrollTo(0, 0);
      }
    }, 150);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      window.removeEventListener('wheel', onUserInteraction);
      window.removeEventListener('touchmove', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return (
    <div className="app-container">
      {/* Full-Screen Premium Cinematic Loading Screen */}
      <CinematicLoader />

      {/* Custom Precision Cursor */}
      <CustomCursor />

      {/* Minimal Fixed Navigation (visible when scrolled) */}
      <Navigation />

      {/* Main Experience Flow */}
      <main>
        {/* 1. Full-screen Editorial Carousel Hero */}
        <EditorialHero />

        {/* 2-5. Lazy-loaded sections — only downloaded when user scrolls */}
        <ErrorBoundary fallbackTitle="SECTION DISPLAY ERROR">
          <Suspense
            fallback={
              <div
                className="w-full min-h-[60vh] flex items-center justify-center bg-[#050A14]"
                aria-label="Loading interactive content"
              >
                <div className="w-8 h-8 rounded-full border-2 border-[#7CA7E6]/20 border-t-[#D71920] animate-spin" />
              </div>
            }
          >
            {/* 2. Rebuilt Interactive 3D Motorcycle Experience */}
            <Bike3DExperience />

            {/* 3. Premium Motorcycle Parts Showcase */}
            <PartsArchiveSection />

            {/* 4. Bike Collection / Choose Your Machine & Booking Experience */}
            <ChooseYourRideSection />

            {/* 5. Contact & Authorized Dealership Hub */}
            <ContactSection />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
