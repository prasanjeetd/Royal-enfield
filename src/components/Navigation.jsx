import React, { useEffect, useState } from 'react';

/**
 * Navigation — Fixed Navbar with persistent top positioning and scroll-aware styling.
 * Royal Enfield logo left, dynamic model badge center, navigation links right.
 */
export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Track scroll state for frosted glass effect and active section highlight
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 40);

      // Section tracking for active navigation link
      const sectionIds = ['hero', 'bike-3d', 'parts-archive', 'choose-your-ride', 'contact'];
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveSection(sectionIds[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'OVERVIEW', href: '#hero', id: 'hero' },
    { label: '3D EXPERIENCE', href: '#bike-3d', id: 'bike-3d' },
    { label: 'PARTS ARCHIVE', href: '#parts-archive', id: 'parts-archive' },
    { label: 'COLLECTION', href: '#choose-your-ride', id: 'choose-your-ride' },
    { label: 'CONTACT', href: '#contact', id: 'contact' },
  ];

  const getSectionTargetScroll = (id) => {
    const nav = document.getElementById('main-navbar');
    // Scrolled navbar height is 72px on desktop, 64px on mobile
    const navH = nav ? nav.offsetHeight : (window.innerWidth <= 768 ? 64 : 72);

    if (id === 'hero' || id === 'overview') return 0;

    const ST = window.__ScrollTrigger;
    if (ST) {
      ST.update();
    }

    const pts = ST ? ST.getById('partsTrackScroll') : null;
    const pinSpacer = document.querySelector('.pin-spacer');

    if (id === 'bike-3d') {
      const el = document.getElementById('bike-3d');
      return el ? Math.max(0, el.offsetTop - navH) : 0;
    }

    if (id === 'parts-archive') {
      if (pts) {
        return Math.max(0, pts.start);
      }
      const el = document.getElementById('parts-archive');
      return el ? Math.max(0, el.offsetTop - navH) : 0;
    }

    if (id === 'choose-your-ride' || id === 'collection') {
      if (pinSpacer) {
        return Math.max(0, pinSpacer.offsetTop + pinSpacer.offsetHeight - navH);
      }
      if (pts && pts.pin) {
        const partsEl = document.getElementById('parts-archive');
        const partsHeight = partsEl ? partsEl.offsetHeight : window.innerHeight;
        return Math.max(0, pts.end + partsHeight - navH);
      }
      const el = document.getElementById('choose-your-ride');
      return el ? Math.max(0, el.offsetTop - navH) : 0;
    }

    if (id === 'contact') {
      const contactEl = document.getElementById('contact');
      if (pinSpacer) {
        const chooseEl = document.getElementById('choose-your-ride');
        const chooseTop = pinSpacer.offsetTop + pinSpacer.offsetHeight;
        const chooseH = chooseEl ? chooseEl.offsetHeight : 0;
        return Math.max(0, chooseTop + chooseH - navH);
      }
      return contactEl ? Math.max(0, contactEl.offsetTop - navH) : 0;
    }

    const targetEl = document.getElementById(id);
    return targetEl ? Math.max(0, targetEl.offsetTop - navH) : 0;
  };

  const handleLinkClick = (e, href, id) => {
    e.preventDefault();
    setActiveSection(id);

    if (id === 'bike-3d') {
      window.dispatchEvent(new CustomEvent('init-bike-3d'));
    }

    const targetScroll = getSectionTargetScroll(id);

    if (window.__lenis) {
      window.__lenis.scrollTo(targetScroll, { duration: 1.2 });
    } else {
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-navbar"
      className={`nav-fixed ${scrolled ? 'scrolled' : ''}`}
      style={{
        fontFamily: "'Rajdhani', sans-serif"
      }}
    >
      <div className="nav-container">
        {/* Left: Brand Logo */}
        <a
          href="#hero"
          className="nav-logo"
          onClick={(e) => handleLinkClick(e, '#hero', 'hero')}
          aria-label="Royal Enfield Home"
        >
          <img
            src="/logo.webp"
            alt="Royal Enfield"
            className="nav-logo-img"
            width="160"
            height="57"
            loading="eager"
          />
        </a>

        {/* Right: Navigation Links */}
        <nav aria-label="Main Navigation">
          <ul className="nav-links">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className={`nav-link ${activeSection === l.id ? 'active' : ''}`}
                  onClick={(e) => handleLinkClick(e, l.href, l.id)}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
