import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  MessageSquare,
  ArrowRight,
  Shield,
  Sparkles
} from 'lucide-react';
import { Bike } from '../types/bike';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBike: Bike;
  allBikes: Bike[];
  onBikeChange: (bike: Bike) => void;
}

const INDIAN_CITIES = [
  'Mumbai',
  'New Delhi & NCR',
  'Bengaluru',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Chandigarh',
  'Jaipur',
  'Kochi',
  'London, UK',
  'Melbourne, AUS',
  'Other / International'
];

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (10:00 AM – 01:00 PM)' },
  { id: 'afternoon', label: 'Afternoon (01:00 PM – 04:00 PM)' },
  { id: 'evening', label: 'Evening (04:00 PM – 07:00 PM)' }
];

export default function BookingModal({
  isOpen,
  onClose,
  selectedBike,
  allBikes,
  onBikeChange
}: BookingModalProps) {
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[0].label);
  const [city, setCity] = useState('Mumbai');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setPreferredDate(dateStr);
  }, []);

  // Modal Open/Close GSAP Animation & Body Scroll Lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      if (modalOverlayRef.current && modalContentRef.current) {
        gsap.killTweensOf([modalOverlayRef.current, modalContentRef.current]);
        gsap.fromTo(
          modalOverlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.35, ease: 'power2.out' }
        );
        gsap.fromTo(
          modalContentRef.current,
          { opacity: 0, y: 30, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out', delay: 0.05 }
        );
      }
    } else {
      document.body.style.overflow = '';
      setIsSubmitted(false);
      setErrorMessage('');
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC Key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    if (modalOverlayRef.current && modalContentRef.current) {
      gsap.to(modalContentRef.current, {
        opacity: 0,
        y: 20,
        scale: 0.97,
        duration: 0.25,
        ease: 'power2.in'
      });
      gsap.to(modalOverlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          onClose();
          setIsSubmitted(false);
        }
      });
    } else {
      onClose();
    }
  };

  const sanitizeInput = (val: string) => val.replace(/<[^>]*>?/gm, '').trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = sanitizeInput(fullName);
    const cleanPhone = sanitizeInput(phone);
    const cleanEmail = sanitizeInput(email);

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('Please enter a valid contact phone number.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    // Simulate luxury booking dispatch
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={modalOverlayRef}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/60 backdrop-blur-xl"
      onClick={(e) => {
        if (e.target === modalOverlayRef.current) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div
        ref={modalContentRef}
        className="booking-modal-card relative w-full flex flex-col bg-[#FBF8F2] border border-[rgba(23,40,61,0.16)] rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(23,40,61,0.2)] overflow-hidden"
        style={{
          width: 'min(92vw, 760px)',
          maxWidth: '760px',
          maxHeight: 'min(92vh, 880px)',
          boxSizing: 'border-box'
        }}
      >
        {/* Subtle Ambient Accent Glow Top Edge */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #315F9C 50%, transparent 100%)'
          }}
        />

        {/* Modal Header: 1. Showroom label, 2. Heading and close button */}
        <div className="booking-modal-header">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C58A28] animate-pulse" />
              <span
                className="text-[14px] tracking-[0.25em] text-[#315F9C] uppercase font-semibold"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                ROYAL ENFIELD SHOWROOM
              </span>
            </div>
            <h2
              id="booking-modal-title"
              className="text-2xl sm:text-3xl font-bold uppercase tracking-[0.03em] text-[#17283D] m-0 leading-none"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              BOOK YOUR TEST RIDE
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-black/[0.05] hover:bg-black/[0.1] border border-[rgba(23,40,61,0.1)] text-[#17283D] flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close booking modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Container: comfortable internal padding (24px on desktop, 16px on mobile) */}
        <div className="booking-modal-body no-scrollbar">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Selected Bike Badge & Switcher */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[rgba(23,40,61,0.14)] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-12 rounded-xl bg-[#F4F0E8] border border-[rgba(23,40,61,0.1)] flex items-center justify-center p-1.5 shrink-0">
                    <img
                      src={selectedBike.src}
                      alt={selectedBike.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div>
                    <span
                      className="text-[14px] uppercase tracking-[0.2em] text-[#315F9C] font-semibold block mb-3"
                      style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    >
                      SELECTED MOTORCYCLE
                    </span>
                    <h3
                      className="text-xl sm:text-2xl uppercase text-[#17283D] m-0 leading-none"
                      style={{
                        fontFamily: "'Bebas Neue', 'Oswald', sans-serif",
                        letterSpacing: '0.04em'
                      }}
                    >
                      {selectedBike.name}
                    </h3>
                  </div>
                </div>

                {/* Bike Selector Dropdown */}
                <div className="w-full sm:w-auto">
                  <select
                    value={selectedBike.name}
                    onChange={(e) => {
                      const found = allBikes.find((b) => b.name === e.target.value);
                      if (found) onBikeChange(found);
                    }}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-[#FBF8F2] border border-[rgba(23,40,61,0.16)] text-[14px] uppercase tracking-wider focus:outline-none focus:border-[#315F9C] cursor-pointer font-semibold text-[#17283D]"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    {allBikes.map((b) => (
                      <option key={b.name} value={b.name} className="bg-[#FBF8F2] text-[#17283D]">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {errorMessage && (
                <div
                  className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-800 text-[14px] font-semibold"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {errorMessage}
                </div>
              )}

              {/* 4. Full Name and Phone Number Fields */}
              <div className="booking-field-row">
                {/* Full Name */}
                <div className="space-y-3">
                  <label
                    htmlFor="booking-full-name"
                    className="text-[14px] tracking-wider text-[#536174] uppercase font-semibold flex items-center gap-3"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    <User className="w-3.5 h-3.5 text-[#C58A28]" />
                    FULL NAME *
                  </label>
                  <input
                    id="booking-full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alexander Vance"
                    className="booking-form-input"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-3">
                  <label
                    htmlFor="booking-phone"
                    className="text-[14px] tracking-wider text-[#536174] uppercase font-semibold flex items-center gap-3"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    <Phone className="w-3.5 h-3.5 text-[#C58A28]" />
                    PHONE NUMBER *
                  </label>
                  <input
                    id="booking-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="booking-form-input"
                  />
                </div>
              </div>

              {/* 5. Email Address and City Fields */}
              <div className="booking-field-row">
                {/* Email Address */}
                <div className="space-y-3">
                  <label
                    htmlFor="booking-email"
                    className="text-[14px] tracking-wider text-[#536174] uppercase font-semibold flex items-center gap-3"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    <Mail className="w-3.5 h-3.5 text-[#C58A28]" />
                    EMAIL ADDRESS *
                  </label>
                  <input
                    id="booking-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alexander@example.com"
                    className="booking-form-input"
                  />
                </div>

                {/* City */}
                <div className="space-y-3">
                  <label
                    htmlFor="booking-city"
                    className="text-[14px] tracking-wider text-[#536174] uppercase font-semibold flex items-center gap-3"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#C58A28]" />
                    CITY *
                  </label>
                  <select
                    id="booking-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="booking-form-select cursor-pointer"
                  >
                    {INDIAN_CITIES.map((c) => (
                      <option key={c} value={c} className="bg-[#FBF8F2] text-[#17283D]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 6. Preferred Date and Preferred Time Fields */}
              <div className="booking-field-row">
                {/* Preferred Date */}
                <div className="space-y-3">
                  <label
                    htmlFor="booking-date"
                    className="text-[14px] tracking-wider text-[#536174] uppercase font-semibold flex items-center gap-3"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#C58A28]" />
                    PREFERRED DATE *
                  </label>
                  <input
                    id="booking-date"
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="booking-form-input"
                  />
                </div>

                {/* Preferred Time Slot */}
                <div className="space-y-3">
                  <label
                    htmlFor="booking-time"
                    className="text-[14px] tracking-wider text-[#536174] uppercase font-semibold flex items-center gap-3"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#C58A28]" />
                    PREFERRED TIME *
                  </label>
                  <select
                    id="booking-time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="booking-form-select cursor-pointer"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.id} value={slot.label} className="bg-[#FBF8F2] text-[#17283D]">
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 7. Optional Message Field */}
              <div className="space-y-3">
                <label
                  htmlFor="booking-message"
                  className="text-[14px] tracking-wider text-[#536174] uppercase font-semibold flex items-center gap-3"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#C58A28]" />
                  MESSAGE / DEALER PREFERENCE (OPTIONAL)
                </label>
                <textarea
                  id="booking-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Specify any preferences, custom helmet requirements, or preferred dealership..."
                  className="booking-form-textarea"
                />
              </div>

              {/* 8. REQUEST TEST RIDE Button */}
              <div className="pt-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                <button
                  id="booking-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="booking-submit-btn"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>REQUEST TEST RIDE</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>

              {/* 9. Privacy / Disclaimer Text */}
              <div className="booking-disclaimer">
                <Shield className="w-3.5 h-3.5 text-[#C58A28] shrink-0" />
                <p
                  className="text-[14px] text-[#78818D] m-0 leading-normal font-normal"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Your details will be routed exclusively to your nearest authorized Royal Enfield dealer.
                </p>
              </div>
            </form>
          ) : (
            /* Success / Request Received State */
            <div className="py-6 sm:py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#315F9C]/15 border border-[#315F9C] flex items-center justify-center text-[#C58A28] shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span
                  className="text-[14px] tracking-[0.25em] text-[#C58A28] uppercase font-semibold"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  CONFIRMATION
                </span>
                <h3
                  className="text-3xl sm:text-4xl uppercase text-[#17283D] mt-1 mb-2 tracking-[0.03em] leading-tight"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  REQUEST RECEIVED
                </h3>
                <p
                  className="text-[14px] text-[#536174] max-w-md font-normal leading-[1.65]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Your test ride request for the <strong className="text-[#17283D] font-semibold">{selectedBike.name}</strong> has been received. An authorized representative from the <strong className="text-[#17283D] font-semibold">{city}</strong> dealership will contact you to confirm your slot.
                </p>
              </div>

              {/* Summary Card */}
              <div
                className="w-full p-4 rounded-xl bg-white border border-[rgba(23,40,61,0.14)] text-left grid grid-cols-2 sm:grid-cols-4 gap-3 text-[14px] shadow-sm"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                <div>
                  <span className="text-[14px] text-[#78818D] uppercase block font-semibold">RIDER</span>
                  <span className="text-[#17283D] font-semibold text-[14px]">{fullName}</span>
                </div>
                <div>
                  <span className="text-[14px] text-[#78818D] uppercase block font-semibold">MOTORCYCLE</span>
                  <span className="text-[#C58A28] font-semibold text-[14px]">{selectedBike.name}</span>
                </div>
                <div>
                  <span className="text-[14px] text-[#78818D] uppercase block font-semibold">DATE</span>
                  <span className="text-[#17283D] font-semibold text-[14px]">{preferredDate}</span>
                </div>
                <div>
                  <span className="text-[14px] text-[#78818D] uppercase block font-semibold">LOCATION</span>
                  <span className="text-[#17283D] font-semibold text-[14px]">{city}</span>
                </div>
              </div>

              {/* Frontend Demo Note */}
              <div className="p-3 rounded-xl bg-white border border-[rgba(23,40,61,0.12)] w-full text-center shadow-sm">
                <div
                  className="flex items-center justify-center gap-2.5 text-[14px] text-[#315F9C] uppercase font-semibold mb-2"
                  style={{ fontFamily: "'Rajdhani', sans-serif" }}
                >
                  <Sparkles className="w-3 h-3 text-[#C58A28]" />
                  <span>Frontend Prototype Demonstration</span>
                </div>
                <p
                  className="text-[14px] text-[#536174] m-0"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Form submission verified successfully. Data structure structured for production API integration.
                </p>
              </div>

              <div className="pt-2 w-full flex items-center justify-center gap-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-[#17283D] hover:bg-[#315F9C] text-[14px] uppercase tracking-wider text-white transition-colors cursor-pointer font-semibold shadow-sm"
                >
                  RETURN TO SHOWROOM
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
