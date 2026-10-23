import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, MapPin } from 'lucide-react';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const sanitizeInput = (str: string) => str.replace(/<[^>]*>?/gm, '').trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeInput(formData.name);
    const cleanEmail = sanitizeInput(formData.email);
    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) return;
    setIsSubmitted(true);
  };

  const branches = [
    { city: 'MUMBAI', address: 'Bandra West, Linking Road', link: '#choose-your-ride' },
    { city: 'NEW DELHI', address: 'Connaught Place, Radial 3', link: '#choose-your-ride' },
    { city: 'BENGALURU', address: 'Indiranagar, 100 Feet Road', link: '#choose-your-ride' },
    { city: 'LONDON', address: 'Brompton Road, Kensington', link: '#choose-your-ride' }
  ];

  return (
    <footer
      id="contact"
      aria-label="Royal Enfield Contact and Showrooms"
      className="contact-section relative w-full bg-[#050A14] text-[#17283D] border-t border-[rgba(124,167,230,0.16)] overflow-hidden z-20"
      style={{
        backgroundColor: '#050A14',
      }}
    >
      {/* Background Atmosphere: Subtle Radial Steel-Blue Lighting */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(45, 78, 128, 0.22) 0%, rgba(15, 39, 71, 0.08) 60%, #050A14 95%)',
        }}
        aria-hidden="true"
      />

      {/* Main Container — Centered, max-width 1440px, consistent 48px desktop horizontal padding */}
      <div
        id="contact-container"
        className="contact-container relative z-10 w-full max-w-[1440px] flex flex-col"
        style={{
          width: '100%',
          maxWidth: '1440px',
          marginInline: 'auto',
          boxSizing: 'border-box',
        }}
      >
        
        {/* Main Two-Column Grid Area */}
        <div id="contact-grid" className="contact-grid w-full">
          
          {/* ======================================================= */}
          {/* LEFT COLUMN: HEADING & BRANCH LOCATION CARDS            */}
          {/* ======================================================= */}
          <div id="contact-left-col" className="contact-left-col flex flex-col w-full min-w-0">
            {/* Category Eyebrow */}
            <div className="flex items-center gap-3 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C58A28] animate-pulse" />
              <span
                className="text-[14px] tracking-[0.25em] text-[#C58A28] uppercase font-semibold"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                ROYAL ENFIELD / CONTACT
              </span>
            </div>

            {/* Large Heading: START YOUR JOURNEY. */}
            <h2
              className="text-4xl sm:text-5xl lg:text-[56px] xl:text-[62px] uppercase tracking-[0.03em] leading-[0.94] m-0 heading-chiselled-hero"
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
              <span className="block">START YOUR</span>
              <span className="block">
                JOURNEY<span className="text-[#C58A28]" style={{ WebkitTextFillColor: '#C58A28' }}>.</span>
              </span>
            </h2>

            {/* Short Description */}
            <p
              className="text-[14px] text-[#536174] font-normal leading-relaxed mt-3 mb-6 max-w-lg"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Find your nearest Royal Enfield or get in touch with us.
            </p>

            {/* Branches Heading / Subtitle */}
            <div className="flex items-center justify-between pb-2 mb-3.5 border-b border-[rgba(23,40,61,0.12)]">
              <span
                className="text-[14px] tracking-[0.2em] text-[#315F9C] uppercase font-semibold"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                AUTHORIZED BRANCHES
              </span>
              <span
                className="text-[14px] tracking-wider text-[#78818D] uppercase font-semibold"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                04 LOCATIONS
              </span>
            </div>

            {/* 4 Separate Horizontal Cards */}
            <div className="contact-branch-list">
              {branches.map((branch) => (
                <a
                  key={branch.city}
                  href={branch.link}
                  className="contact-branch-card group"
                >
                  {/* Left: Location Pin Icon + City + Address */}
                  <div className="contact-branch-content">
                    <div className="contact-branch-icon-wrap">
                      <MapPin className="w-4 h-4 text-[#315F9C] group-hover:text-[#C58A28] transition-colors" />
                    </div>
                    <div className="contact-branch-details">
                      <h3 className="contact-branch-city">
                        {branch.city}
                      </h3>
                      <p className="contact-branch-address">
                        {branch.address}
                      </p>
                    </div>
                  </div>

                  {/* Right: VIEW LOCATION + Arrow */}
                  <div className="contact-branch-action">
                    <span className="hidden sm:inline">VIEW LOCATION</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* ======================================================= */}
          {/* RIGHT COLUMN: CONTACT FORM CARD                         */}
          {/* ======================================================= */}
          <div id="contact-right-col" className="contact-right-col flex flex-col w-full min-w-0">
            <div id="contact-form-card" className="contact-form-card">
              
              {/* Subtle Edge Lighting (Top) */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(227, 1, 0, 0.5) 50%, transparent 100%)',
                }}
              />

              {/* Card Header */}
              <div className="contact-form-header">
                <div className="contact-form-eyebrow">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E30100] shrink-0" />
                  <span
                    className="text-[14px] tracking-[0.25em] text-[#C58A28] uppercase font-semibold"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    DIRECT INQUIRY
                  </span>
                </div>

                <h3 className="contact-form-heading">
                  <span>CONTACT US</span>
                  <span className="text-[#C58A28]" style={{ WebkitTextFillColor: '#C58A28' }}>.</span>
                </h3>

                <p className="contact-form-desc">
                  Let's talk about your next ride.
                </p>
              </div>

              {/* Form or Submitted State */}
              {isSubmitted ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#315F9C]/15 border border-[#315F9C] flex items-center justify-center text-[#C58A28]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4
                    className="text-2xl uppercase tracking-[0.04em] text-[#17283D] m-0"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    MESSAGE RECEIVED
                  </h4>
                  <p
                    className="text-[14px] text-[#536174] max-w-sm leading-relaxed"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Thank you. A Royal Enfield specialist will connect with you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ name: '', email: '', message: '' });
                    }}
                    className="mt-2 text-[14px] uppercase tracking-[0.2em] text-[#C58A28] hover:text-[#17283D] underline underline-offset-4 cursor-pointer font-semibold"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form-body">
                  {/* Name Field */}
                  <div className="contact-field-group">
                    <label
                      htmlFor="name"
                      className="contact-field-label"
                    >
                      NAME
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="contact-input"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="contact-field-group">
                    <label
                      htmlFor="email"
                      className="contact-field-label"
                    >
                      EMAIL
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="contact-input"
                    />
                  </div>

                  {/* Message Field */}
                  <div className="contact-field-group">
                    <label
                      htmlFor="message"
                      className="contact-field-label"
                    >
                      MESSAGE
                    </label>
                    <textarea
                      id="message"
                      rows={3}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your next ride or inquiry..."
                      className="contact-textarea"
                    />
                  </div>

                  {/* Full-width Gold Gradient Button */}
                  <div className="contact-submit-wrap">
                    <button
                      type="submit"
                      className="contact-submit-btn group"
                    >
                      <span>SEND MESSAGE</span>
                      <ArrowRight className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2.6} />
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* FOOTER BOTTOM BAR                                         */}
        {/* ========================================================= */}
        <div
          className="contact-footer-bar w-full box-border"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          {/* Left: Royal Enfield Brand */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#17283D] tracking-[0.18em] uppercase">
              ROYAL ENFIELD
            </span>
          </div>

          {/* Center: Heritage Since 1901 */}
          <div className="tracking-[0.25em] text-[#C58A28] uppercase font-semibold text-[14px]">
            SINCE 1901
          </div>

          {/* Right: Privacy & Terms */}
          <div className="flex items-center gap-3.5 text-[14px] font-medium tracking-wider">
            <span className="hover:text-[#17283D] transition-colors cursor-pointer">PRIVACY</span>
            <span>•</span>
            <span className="hover:text-[#17283D] transition-colors cursor-pointer">TERMS</span>
            <span>•</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
