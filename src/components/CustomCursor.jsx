import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * CustomCursor — Premium circular cursor with expand-on-hover.
 * Optimized with passive event delegation and GSAP quickTo for zero re-renders and no DOM mutation churn.
 */
export default function CustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    // Disable on touch devices or fine pointer absent
    if (!cursor || window.matchMedia('(pointer: coarse)').matches) return;

    const xTo = gsap.quickTo(cursor, 'left', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'top', { duration: 0.4, ease: 'power3' });

    const handleMouseMove = (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    // Event delegation eliminates MutationObserver and mass listener registration
    const handleMouseOver = (e) => {
      // Never expand the cursor inside the fixed navigation bar
      if (e.target?.closest?.('.nav-fixed')) {
        cursor.classList.remove('expanded');
        return;
      }

      const target = e.target?.closest?.(
        'a, button, [data-cursor-expand], .showcase-image-wrap, .hero-bike-container, .anatomy-bike-wrap, input, select, textarea, [role="button"]'
      );
      if (target) {
        cursor.classList.add('expanded');
      } else {
        cursor.classList.remove('expanded');
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <div ref={cursorRef} className="custom-cursor" aria-hidden="true">
      <span className="custom-cursor-label">EXPLORE</span>
    </div>
  );
}
