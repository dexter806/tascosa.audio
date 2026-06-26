// Last updated: June 25, 2026 — Travel fee zones added (DJ + Diagnostic); Reviews carousel (manual, add/remove from TESTIMONIALS array)
// ─────────────────────────────────────────────────────────────────────────────
// Tascosa Audio — page.jsx
//
// CHANGELOG:
//  ✅ [Jun 25] Travel fee zone table added to both DJ and Diagnostic sections
//  ✅ [Jun 25] Testimonials: auto-scrolling carousel, shows 3 cards on desktop / 1 on mobile
//  ✅ [Jun 25] Dot count matches visible pages (not total reviews) — fewer dots
//  ✅ [Jun 16] Real form submission via /api/contact (Resend)
//  ✅ [Jun 16] Event date field, sent/error state reset, SEO head, social icons,
//              sticky mobile bar, accessibility, image performance improvements
//  ✅ [Jun 25] Diagnostic pricing: service blocks at $125/hr, education tiers, retainer by request
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
// NOTE: useEffect and useRef are used by ReviewsCarousel only — do not remove
import Head from "next/head";

// ─── REUSABLE UI COMPONENTS ──────────────────────────────────────────────────

const FormInput = ({ label, id, ...props }) => (
  <div className="w-full">
    <label htmlFor={id} className="block text-sm font-medium text-neutral-300 mb-1.5 ml-1">
      {label}
    </label>
    <input
      id={id}
      {...props}
      className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
    />
  </div>
);

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left gap-6 group"
      >
        <span className="text-base font-semibold text-white group-hover:text-tascosa-orange transition-colors">
          {question}
        </span>
        <span className={"flex-none h-6 w-6 rounded-full border border-neutral-700 flex items-center justify-center transition-all " + (open ? "border-tascosa-orange bg-tascosa-orange/10" : "group-hover:border-neutral-500")}>
          <svg className={"h-3 w-3 text-tascosa-orange transition-transform duration-300 " + (open ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="mt-4 text-sm text-neutral-400 leading-relaxed pr-10 animate-in fade-in slide-in-from-top-2 duration-200">
          {answer}
        </p>
      )}
    </div>
  );
};

// ─── TRAVEL FEE TABLE — shared by DJ and Diagnostic sections ─────────────────
// Collapsed by default; click or hover the header to expand.
const TravelFeeTable = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
      {/* Header — always visible, click toggles, hover also opens */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className="w-full px-6 py-4 flex items-center justify-between gap-2 group focus:outline-none"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-tascosa-orange flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h4 className="text-sm font-bold text-white uppercase tracking-widest group-hover:text-tascosa-orange transition-colors">
            Travel Fee Schedule
          </h4>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <span className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors">
            {open ? "hide" : "view rates"}
          </span>
          <span className={"flex h-5 w-5 items-center justify-center rounded-full border transition-all " + (open ? "border-tascosa-orange bg-tascosa-orange/10" : "border-neutral-700 group-hover:border-neutral-500")}>
            <svg className={"h-2.5 w-2.5 text-tascosa-orange transition-transform duration-300 " + (open ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </button>

      {/* Expandable content */}
      {open && (
        <div
          className="border-t border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-200"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="divide-y divide-neutral-800">
            {[
              { zone: "0 – 30 miles", fee: "Free", note: "Amarillo & immediate surrounding area", highlight: false },
              { zone: "31 – 60 miles", fee: "$50", note: "Pampa, Hereford, Tulia area", highlight: false },
              { zone: "61 – 100 miles", fee: "$75", note: "Lubbock, Childress, Dalhart area", highlight: false },
              { zone: "100+ miles", fee: "$125", note: "NM, OK, extended Panhandle", highlight: true },
            ].map((row) => (
              <div key={row.zone} className="flex items-center justify-between px-6 py-3 gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">{row.zone}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{row.note}</p>
                </div>
                <span className={`text-sm font-black flex-none ${row.highlight ? "text-tascosa-orange" : "text-white"}`}>
                  {row.fee}
                </span>
              </div>
            ))}
          </div>
          <p className="px-6 py-3 text-[10px] text-neutral-600 uppercase tracking-widest border-t border-neutral-800">
            Distance measured from Amarillo, TX · Fees are one-way and added to your package total
          </p>
        </div>
      )}
    </div>
  );
};

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
// To add a review:  copy one block and paste it before the closing ];
// To remove one:    delete its { } block (and the comma before it).
// To hide all:      set the array to [] and the section won't render.
// Fields:
//   quote  — the review text
//   name   — reviewer's first name / initial (e.g. "Nikki P.")
//   event  — short context line shown below the name
//   rating — number 1–5 (controls how many stars are filled)
// ─────────────────────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "Absolutely amazing DJ. I am the owner of Knotting Hill Wedding Venue and Andy does a phenomenal job! He has done countless weddings for us! Highly recommend!",
    name: "Nikki P.",
    event: "Owner Knotting Hill Wedding Venue — Amarillo, TX",
    rating: 5,
  },
  {
    quote: "Really awesome people to have work sound! Very knowledgeable and communicates well when they have a question or if you have a specific need for your event.",
    name: "Izaak C.",
    event: "Wedding Reception — Lubbock, TX",
    rating: 5,
  },
  {
    quote: "Andy is fantastic! He recently DJ'd my 40th birthday party and did a phenomenal job. Andy is easy to communicate with, is reliable and makes the event fun. Highly recommend him and Tascosa Audio! You can't go wrong booking him!",
    name: "Tanya P.",
    event: "Private Party — Amarillo, TX",
    rating: 5,
  },
  {
    quote: "Andy was absolutely incredible as the DJ for our wedding. He did everything we asked for and then did things we didn't know we needed but wanted (like soft music for our knot tying during the ceremony so it wasn't awkwardly quiet!) He knew how to keep the party rolling for the older crowd without making the younger ones bored and vice versa. He checked in with me so many times during the process leading up to wedding day, and asked if he could help in any way. He played a song that was just a personal mp3 rather than on a streaming service because we requested it and he made every effort to do anything I asked. I felt so needy but he reassured me he could handle it and he DID. He even stayed late when my guests didn't get out early enough for my husband and I to do a private last dance. He waited until we were ready before packing up for the night. Would recommend him to anyone looking for an event DJ.",
    name: "Lindsey S.",
    event: "Wedding — Amarillo, TX",
    rating: 5,
  },
  {
    quote: "Andy was the DJ at a Karaoke night for our non-profit organization. He was INCREDIBLE! Kept the night moving and the vibes going the whole night. Book him! You won't regret it!",
    name: "Jessica C.",
    event: "Corporate Event — Amarillo, TX",
    rating: 5,
  },
  {
    quote: "You guys are the best. Always on time, all the best songs and I can't recommend you guys enough.",
    name: "Grant M.",
    event: "Owner Iron Rose Wedding & Event Center — Amarillo, TX",
    rating: 5,
  },
  // ── ADD NEW REVIEWS BELOW THIS LINE ──
  // {
  //   quote: "Paste the review text here.",
  //   name: "First Last Initial — e.g. John D.",
  //   event: "Event type — City, TX",
  //   rating: 5,
  // },
];

// ─── REVIEWS CAROUSEL ────────────────────────────────────────────────────────
// Shows 3 cards side-by-side on desktop, 1 at a time on mobile.
// Dots represent pages (groups of 3), not individual reviews.
// Auto-advances every 5s; pauses on hover.
const ReviewsCarousel = ({ reviews }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [perPage, setPerPage] = useState(3);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  // Detect mobile vs desktop to set cards per page
  useEffect(() => {
    const update = () => setPerPage(window.innerWidth < 768 ? 1 : 3);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const totalPages = Math.ceil(reviews.length / perPage);

  const next = () => setCurrent((c) => (c + 1) % totalPages);
  const prev = () => setCurrent((c) => (c - 1 + totalPages) % totalPages);

  // Auto-advance every 5s unless paused or only one page
  useEffect(() => {
    if (paused || totalPages <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused, totalPages, current]);

  if (!reviews.length) return null;

  // Slice out which reviews to show for the current page
  const visible = reviews.slice(current * perPage, current * perPage + perPage);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[280px]">
        {visible.map((t, i) => (
          <div
            key={`${current}-${i}`}
            className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 flex flex-col justify-between hover:border-tascosa-orange/30 transition-all duration-300 animate-in fade-in duration-300"
          >
            <div>
              <div className="flex gap-0.5 mb-5">
                {[...Array(5)].map((_, si) => (
                  <svg key={si} className={`h-4 w-4 ${si < (t.rating || 5) ? "text-tascosa-orange" : "text-neutral-700"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-neutral-300 text-sm leading-relaxed italic">"{t.quote}"</p>
            </div>
            <div className="mt-6 pt-6 border-t border-neutral-800">
              <p className="text-white font-semibold text-sm">{t.name}</p>
              <p className="text-neutral-500 text-xs mt-0.5">{t.event}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation — only show if more than one page */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={prev}
            aria-label="Previous reviews"
            className="h-9 w-9 rounded-full border border-neutral-700 hover:border-tascosa-orange flex items-center justify-center text-neutral-400 hover:text-tascosa-orange transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to page ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-tascosa-orange" : "w-2 bg-neutral-700 hover:bg-neutral-500"}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            aria-label="Next reviews"
            className="h-9 w-9 rounded-full border border-neutral-700 hover:border-tascosa-orange flex items-center justify-center text-neutral-400 hover:text-tascosa-orange transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Home() {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", service: "DJ Services",
    pkg: "", eventDate: "", message: "",
  });
  const [formStatus, setFormStatus] = useState("idle");
  const [reviews] = useState(TESTIMONIALS);

  const DJ_PACKAGES = ["Private Party", "Wedding Reception", "Wedding Full Service"];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === "service" ? { pkg: "" } : {}),
    }));
  }

  function jumpToContactWith(service, selectedPackage = "") {
    setForm(prev => ({
      ...prev,
      service,
      pkg: service === "DJ Services" ? selectedPackage : "",
    }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setFormStatus("success");
        setForm({ name: "", email: "", phone: "", service: "DJ Services", pkg: "", eventDate: "", message: "" });
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    }
    setTimeout(() => setFormStatus("idle"), 6000);
  }

  return (
    <>
      {/* ── SEO HEAD ──────────────────────────────────────────────────── */}
      <Head>
        <title>Tascosa Audio | DJ & Audio Services — Amarillo, TX</title>
        <meta name="description" content="Professional DJ services, live sound production, and audio system troubleshooting in Amarillo, TX. Serving the Texas Panhandle, Lubbock, New Mexico & Oklahoma. Get a free quote today." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.tascosaaudio.com" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.tascosaaudio.com" />
        <meta property="og:title" content="Tascosa Audio | DJ & Audio Services — Amarillo, TX" />
        <meta property="og:description" content="Professional DJ, live sound, and audio troubleshooting in Amarillo, TX. 10+ years of experience. Get a free quote." />
        <meta property="og:image" content="https://www.tascosaaudio.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tascosa Audio | DJ & Audio Services — Amarillo, TX" />
        <meta name="twitter:description" content="Professional DJ, live sound, and audio troubleshooting in Amarillo, TX." />
        <meta name="twitter:image" content="https://www.tascosaaudio.com/og-image.jpg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Tascosa Audio",
              "description": "Professional DJ services, live sound production, and audio system troubleshooting in Amarillo, TX.",
              "url": "https://www.tascosaaudio.com",
              "telephone": "+18066707913",
              "email": "info@tascosaaudio.com",
              "address": { "@type": "PostalAddress", "addressLocality": "Amarillo", "addressRegion": "TX", "addressCountry": "US" },
              "areaServed": ["Amarillo, TX", "Canyon, TX", "Lubbock, TX", "Texas Panhandle", "South Plains, TX", "New Mexico", "Oklahoma"],
              "sameAs": ["https://www.instagram.com/tascosaaudio", "https://www.facebook.com/people/Tascosa-Audio/61583130066383/"],
              "priceRange": "$$",
              "openingHours": "Mo-Su 09:00-21:00",
            }),
          }}
        />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-tascosa-orange selection:text-black">

        {/* ── NAV ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 backdrop-blur-md border-b border-neutral-800/60 bg-neutral-950/80">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <a href="#" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src="/TA Logo.png" alt="Tascosa Audio Logo" className="h-9 w-auto object-contain" />
                <span className="text-lg font-bold tracking-wide">Tascosa Audio</span>
              </a>
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
                <a href="#services" className="hover:text-tascosa-orange transition-colors">Services</a>
                <a href="#pricing" className="hover:text-tascosa-orange transition-colors">Pricing</a>
                <a href="#about" className="hover:text-tascosa-orange transition-colors">About</a>
                <a href="/partners" className="hover:text-tascosa-orange transition-colors">Partners &amp; Vendors</a>
                <a href="#contact" className="hover:text-tascosa-orange transition-colors">Request a Quote</a>
                <a href="https://www.instagram.com/tascosaaudio" target="_blank" rel="noopener noreferrer" aria-label="Tascosa Audio on Instagram" className="text-neutral-400 hover:text-tascosa-orange transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://www.facebook.com/people/Tascosa-Audio/61583130066383/" target="_blank" rel="noopener noreferrer" aria-label="Tascosa Audio on Facebook" className="text-neutral-400 hover:text-tascosa-orange transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </div>
              <div className="md:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMenuOpen} className="p-2 text-neutral-400 hover:text-white focus:outline-none">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                  </svg>
                </button>
              </div>
            </div>
            {isMenuOpen && (
              <div className="md:hidden border-t border-neutral-800 py-4 px-2 space-y-1 bg-neutral-950">
                {[{ name: "Services", href: "#services" }, { name: "Pricing", href: "#pricing" }, { name: "About", href: "#about" }, { name: "Partners & Vendors", href: "/partners" }, { name: "Request a Quote", href: "#contact" }].map((link) => (
                  <a key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-base font-medium text-neutral-300 hover:bg-neutral-900 hover:text-tascosa-orange rounded-xl transition-all">{link.name}</a>
                ))}
                <div className="pt-4 pb-2 px-4">
                  <a href="sms:+18066707913" className="flex items-center justify-center gap-3 w-full py-4 bg-tascosa-orange text-black font-black rounded-2xl shadow-lg active:scale-95 transition-all">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                    TEXT US: 806-670-7913
                  </a>
                </div>
              </div>
            )}
          </nav>
        </header>

        <main>

          {/* ── HERO ──────────────────────────────────────────────────── */}
          <section className="relative isolate overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-tascosa-orange mb-4">Audio solutions made simple.</p>
                  <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                    Your Amarillo <span className="text-tascosa-orange">audio experts.</span>
                  </h1>
                  <div className="mt-5 text-neutral-300 text-lg max-w-prose space-y-4">
                    <p>At Tascosa Audio, we're your partners in finding your audio solution.</p>
                    <p>From professional DJ services to expert setup and troubleshooting, our team proudly serves Amarillo, Canyon, Lubbock, the Texas Panhandle, the South Plains, New Mexico, and Oklahoma.</p>
                  </div>
                  <div className="mt-8 flex gap-3 flex-wrap">
                    <a href="#services" className="rounded-2xl px-6 py-3 bg-tascosa-orange text-black font-semibold shadow hover:brightness-110 transition-all">See Services</a>
                    <a href="#pricing" className="rounded-2xl px-6 py-3 border border-neutral-700 hover:border-neutral-500 transition-colors">See Pricing</a>
                    <a href="https://www.instagram.com/tascosaaudio" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-2xl px-4 py-3 border border-neutral-700 hover:border-tascosa-orange hover:text-tascosa-orange transition-all flex items-center gap-2 text-sm text-neutral-300">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      Instagram
                    </a>
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-1.5 text-xs text-neutral-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-tascosa-orange"></span>
                    Serving Amarillo · Canyon · Lubbock · Panhandle · NM · OK
                  </div>
                  <div className="mt-4 text-sm text-neutral-400">10+ years of experience • Professional gear • Easy scheduling</div>
                </div>
                <div className="relative">
                  <div className="aspect-[4/3] rounded-3xl border border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden">
                    <img src="/gallery-13.jpg" alt="DJ setup and event lighting at an Amarillo wedding — Tascosa Audio" className="h-full w-full object-cover" fetchpriority="high" />
                  </div>
                  <div className="absolute -bottom-6 -right-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur p-4 shadow-xl max-w-[280px]">
                    <p className="text-sm">Next-level vibes for weddings, private parties, school dances, and more.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── SERVICES ──────────────────────────────────────────────── */}
          <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Services</h2>
              <p className="mt-4 text-neutral-300 leading-relaxed text-lg">Professional audio solutions tailored to your event or venue. Pick what fits your need.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {[
                { title: "DJ Services", desc: "Weddings, Private Parties, and School Events. We bring the energy and the expertise to keep your dance floor moving all night long.", items: ["Professional MC Services", "Club-style Dance Lighting", "High-end Wireless Microphones", "Custom Playlist Planning"], href: "#dj-packages" },
                { title: "Diagnostic, Repair & Education", desc: "Don't let technical issues ruin your sound. We help you fix current problems and teach you how to prevent future ones.", items: ["On-site System Troubleshooting", "Venue & Church Sound Tuning", "Feedback & Signal Flow Fixes", "1-on-1 Equipment Training"], href: "#diagnostic" },
              ].map((card) => (
                <div key={card.title} className="group relative rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 shadow-sm transition-all duration-300 hover:border-tascosa-orange/50 hover:bg-neutral-900 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity"><div className="h-2 w-2 rounded-full bg-tascosa-orange"></div></div>
                  <div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-tascosa-orange transition-colors">{card.title}</h3>
                    <p className="mt-4 text-neutral-400 text-sm leading-relaxed">{card.desc}</p>
                    <div className="mt-6 pt-6 border-t border-neutral-800">
                      <ul className="space-y-3 text-sm text-neutral-300">
                        {card.items.map((item) => (
                          <li key={item} className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-tascosa-orange flex-none"></span>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <a href={card.href} className="mt-10 inline-block text-center rounded-2xl px-6 py-4 bg-neutral-800 text-white font-bold transition-all hover:bg-tascosa-orange hover:text-black active:scale-95 shadow-lg">
                    Explore {card.title === "DJ Services" ? "Packages" : "Service"}
                  </a>
                </div>
              ))}
            </div>
            <div className="mt-16 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">Serving Amarillo • Canyon • Lubbock • The Texas Panhandle • The South Plains • New Mexico • Oklahoma</p>
            </div>
          </section>

          {/* ── ABOUT ─────────────────────────────────────────────────── */}
          <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 border-t border-neutral-800">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The People Behind the Sound</h2>
              <p className="mt-4 text-tascosa-orange font-medium uppercase tracking-widest text-sm">Local • Professional • Experienced</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 md:order-1 space-y-6 text-neutral-300 leading-relaxed">
                <p>We're a local, owner-operated team born and raised right here in Amarillo. For us, audio isn't just a business — it's a career built on over a decade of hands-on experience.</p>
                <p>Our owner, Andy, brings 10+ years of expertise in music retail and is a proud graduate of the <span className="text-white font-semibold">Conservatory of Recording Arts and Sciences (CRAS)</span>. We've spent years behind the board running live sound and providing professional DJ services across the Panhandle, South Plains, Oklahoma, and New Mexico.</p>
                <p>Whether we are reading a crowd to keep a wedding dance floor packed or troubleshooting a complex system for a local venue, we bring a level of technical precision you won't find anywhere else. At the end of the day, we're your neighbors, and we're here to make sure your event sounds perfect.</p>
                <div className="pt-6">
                  <ul className="space-y-4">
                    {["CRAS Certified Technical Expertise", "10+ Years of Music Industry Experience", "On-site setup & professional, local service"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-white font-medium">
                        <div className="flex-none rounded-full bg-tascosa-orange/20 p-1">
                          <svg className="h-4 w-4 text-tascosa-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="order-1 md:order-2 relative">
                <div className="absolute -inset-4 bg-tascosa-orange/5 rounded-full blur-3xl -z-10"></div>
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900 aspect-square overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                  <img src="/Party 2025.jpg" alt="Andy Martinez — owner of Tascosa Audio — at a live DJ event in Amarillo TX" className="h-full w-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700" loading="lazy" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-neutral-950 border border-neutral-800 p-4 rounded-2xl shadow-xl hidden sm:block">
                  <p className="text-xs font-bold uppercase tracking-tighter text-neutral-400">Established Expertise</p>
                  <p className="text-lg font-black text-tascosa-orange">10+ YEARS</p>
                </div>
              </div>
            </div>
            <div className="mt-16 text-center">
              <a href="#testimonials" className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 border border-neutral-700 hover:border-tascosa-orange hover:text-tascosa-orange text-neutral-300 font-semibold transition-all">
                See What Clients Say
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </a>
            </div>
          </section>

          {/* ── PRICING ───────────────────────────────────────────────── */}
          <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-800">

            {/* DJ Packages */}
            <div id="dj-packages" className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">DJ Services</h2>
              <p className="mt-4 text-neutral-300 leading-relaxed">Transparent base packages. All packages run until 12:00 AM. Per-hour add-on available for the 6-hour package only.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { tier: "Private Party", price: "$600", features: ["DJ Service", "Dinner/Party Music", "Wireless mic", "Dance lighting"] },
                { tier: "Wedding Reception", price: "$900", features: ["Up to 4 hours of MC / DJ Service", "Reception/Dinner Music", "Wireless mic", "Dance lighting"] },
                { tier: "Wedding Full Service", price: "$1,250", features: ["Up to 6 hours of MC / DJ Service", "Ceremony Music", "Reception/Dinner Music", "Wireless mics", "Dance lighting"], highlight: true },
              ].map((p) => (
                <div key={p.tier} className={`flex flex-col rounded-3xl border p-8 transition-all duration-300 ${p.highlight ? "border-tascosa-orange bg-neutral-900 shadow-[0_0_20px_rgba(255,100,0,0.1)] scale-105 z-10" : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"}`}>
                  {p.highlight && <div className="mb-4 text-center"><span className="text-xs font-bold uppercase tracking-widest text-tascosa-orange bg-tascosa-orange/10 px-4 py-1 rounded-full">Most Popular</span></div>}
                  <div className="flex items-baseline justify-between mb-6">
                    <h3 className="text-xl font-bold">{p.tier}</h3>
                    <span className={`text-2xl font-black ${p.highlight ? "text-tascosa-orange" : "text-white"}`}>{p.price}</span>
                  </div>
                  <ul className="flex-grow space-y-4 text-sm text-neutral-300">
                    {p.features.map((f) => <li key={f} className="flex items-start gap-3"><span className="text-tascosa-orange mt-0.5">✓</span>{f}</li>)}
                  </ul>
                  <button type="button" onClick={() => jumpToContactWith("DJ Services", p.tier)} className={`mt-8 w-full rounded-xl py-3 font-bold transition-all active:scale-95 ${p.highlight ? "bg-tascosa-orange text-black hover:brightness-110" : "border border-neutral-700 text-white hover:bg-neutral-800"}`}>
                    Choose Package
                  </button>
                </div>
              ))}
            </div>

            {/* DJ Travel Fees */}
            <div className="max-w-2xl mx-auto mt-10">
              <TravelFeeTable />
            </div>

            {/* ── DIAGNOSTIC, REPAIR & EDUCATION ───────────────────────── */}
            <div id="diagnostic" className="mt-32 text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Diagnostic, Repair & Education</h2>
              <p className="mt-4 text-neutral-300 leading-relaxed">We come to you, assess your system honestly, and recommend only what you actually need. All work is billed in 2-hour blocks — no surprises.</p>
            </div>

            {/* Free Diagnostic Banner */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="rounded-3xl border border-tascosa-orange/40 bg-tascosa-orange/5 p-8 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 h-48 w-48 bg-tascosa-orange/10 blur-3xl rounded-full" />
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-white">Free Diagnostic <span className="text-tascosa-orange">When You Book.</span></h3>
                    <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
                      Not sure what's wrong? We'll come out, evaluate your setup, and give you a straight answer — no guesswork, no pressure. Book any service block and the diagnostic is completely <span className="text-white font-semibold">on us</span>. If you choose not to proceed, a one-time trip &amp; assessment fee of <span className="text-white font-semibold">$50</span> applies.
                    </p>
                  </div>
                  <button type="button" onClick={() => jumpToContactWith("Diagnostic, Repair & Education")} className="flex-none rounded-2xl px-8 py-4 bg-tascosa-orange text-black font-black hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-tascosa-orange/20 whitespace-nowrap">
                    Schedule Free Diagnostic
                  </button>
                </div>
              </div>
            </div>

            {/* Service Blocks */}
            <div className="max-w-4xl mx-auto mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Service Blocks</h3>
              <p className="text-sm text-neutral-400 mb-8">Billed in 2-hour blocks at <span className="text-white font-semibold">$125/hr</span>. The more hours you book, the more you save. Additional time beyond your booked block is billed at <span className="text-white font-semibold">$125/hr</span>.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { name: "Block 1 — Quick Fix", hours: "2 hours", price: "$250", savings: null, desc: "Minor repairs, quick signal flow fixes, basic troubleshooting.", highlight: false },
                  { name: "Block 2 — Standard", hours: "4 hours", price: "$425", savings: "Save $75", desc: "Deeper diagnostics, wiring issues, system tuning and optimization.", highlight: true },
                  { name: "Block 3 — Half Day", hours: "6 hours", price: "$600", savings: "Save $150", desc: "Complex installs, full system overhauls, multi-zone setups.", highlight: false },
                ].map((block) => (
                  <div key={block.name} className={`relative flex flex-col rounded-3xl border p-7 transition-all duration-300 ${block.highlight ? "border-tascosa-orange bg-neutral-900 shadow-[0_0_20px_rgba(255,100,0,0.1)] scale-105 z-10" : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"}`}>
                    {block.savings && <div className="mb-3"><span className="text-xs font-bold uppercase tracking-widest text-tascosa-orange bg-tascosa-orange/10 px-3 py-1 rounded-full">{block.savings}</span></div>}
                    <h4 className="text-base font-bold text-white">{block.name}</h4>
                    <p className="text-xs text-neutral-500 mt-0.5 mb-4">{block.hours}</p>
                    <p className={`text-3xl font-black mb-3 ${block.highlight ? "text-tascosa-orange" : "text-white"}`}>{block.price}</p>
                    <p className="text-sm text-neutral-400 leading-relaxed flex-grow">{block.desc}</p>
                    <button type="button" onClick={() => jumpToContactWith("Diagnostic, Repair & Education")} className={`mt-6 w-full rounded-xl py-3 text-sm font-bold transition-all active:scale-95 ${block.highlight ? "bg-tascosa-orange text-black hover:brightness-110" : "border border-neutral-700 text-white hover:bg-neutral-800"}`}>
                      Book This Block
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center text-xs text-neutral-500 uppercase tracking-widest">Overtime billed at $125/hr</p>
            </div>

            {/* Diagnostic Travel Fees */}
            <div className="max-w-2xl mx-auto mt-10">
              <TravelFeeTable />
            </div>

            {/* Education Sessions */}
            <div className="max-w-4xl mx-auto mt-20">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-white">Education Sessions</h3>
                <p className="mt-2 text-sm text-neutral-400">One-on-one or small group training — learn your system, stop the guesswork. Sessions can be booked standalone or added to any service block.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Intro Session", detail: "1 hour · 1 person", price: "$100", note: "Great starting point — heads up, it goes fast." },
                  { name: "Deep Dive", detail: "2 hours · 1 person", price: "$175", note: "Enough time to really get into your system." },
                  { name: "Small Group", detail: "2 hours · up to 3 people", price: "$225", note: "Perfect for church AV teams or venue staff." },
                  { name: "Add to Service Block", detail: "Any block", price: "+$100", note: "Combine hands-on repair with guided training." },
                ].map((edu) => (
                  <div key={edu.name} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 hover:border-tascosa-orange/30 transition-all duration-300 flex flex-col">
                    <p className="text-base font-bold text-white">{edu.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 mb-3">{edu.detail}</p>
                    <p className="text-2xl font-black text-tascosa-orange mb-3">{edu.price}</p>
                    <p className="text-xs text-neutral-400 leading-relaxed flex-grow">{edu.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 text-center">
                <p className="text-xs text-neutral-500">4th person and beyond: <span className="text-neutral-300 font-semibold">+$25 per person</span></p>
              </div>
            </div>

            {/* Retainer */}
            <div className="max-w-4xl mx-auto mt-16">
              <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">Ongoing Support &amp; Retainer Options</h3>
                  <p className="mt-2 text-sm text-neutral-400 leading-relaxed">Need a reliable tech partner on an ongoing basis? We offer retainer arrangements for venues, churches, and organizations that want priority access and consistent support. Every situation is different — reach out and we'll build something that makes sense for you.</p>
                </div>
                <button type="button" onClick={() => jumpToContactWith("Diagnostic, Repair & Education")} className="flex-none rounded-2xl px-8 py-4 border border-neutral-700 text-white font-bold hover:border-tascosa-orange hover:text-tascosa-orange transition-all active:scale-95 whitespace-nowrap">
                  Ask About Retainers
                </button>
              </div>
            </div>

          </section>

          {/* ── TESTIMONIALS (auto-scrolling carousel) ────────────────── */}
          {TESTIMONIALS.length > 0 && (
          <section id="testimonials" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-800">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">What Clients Say</h2>
              <p className="mt-4 text-neutral-300">Real events. Real people. Real results.</p>
            </div>

            <ReviewsCarousel reviews={reviews} />

            <div className="mt-10 text-center">
              <a
                href="https://g.page/r/YOUR_GOOGLE_PLACE_ID/review"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-full px-5 py-2 transition-all"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Leave us a Google Review
              </a>
              {/* NOTE: Replace YOUR_GOOGLE_PLACE_ID above with your actual Google Place ID */}
            </div>
          </section>
          )} {/* end TESTIMONIALS.length > 0 */}

          {/* ── GALLERY ───────────────────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-800">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Gallery</h2>
              <p className="mt-4 text-neutral-300">A look at some of the events we have had the honor of being a part of.</p>
            </div>
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {[
                { src: "/gallery-01.jpg", alt: "Tascosa Audio event lighting and DJ setup" },
                { src: "/gallery-02.jpg", alt: "Live event DJ services Amarillo TX" },
                { src: "/gallery-03.jpg", alt: "Wedding reception dance floor Amarillo" },
                { src: "/gallery-04.jpg", alt: "Packed wedding dance floor with colorful lighting" },
                { src: "/gallery-05.jpg", alt: "DJ booth setup at Amarillo event" },
                { src: "/gallery-06.jpg", alt: "Professional event lighting Tascosa Audio" },
                { src: "/gallery-07.jpg", alt: "Wedding reception lighting and audio setup" },
                { src: "/gallery-08.jpg", alt: "Live sound production Amarillo TX" },
                { src: "/gallery-09.jpg", alt: "Event DJ services Texas Panhandle" },
                { src: "/gallery-10.jpg", alt: "Professional DJ setup and dance lighting" },
                { src: "/gallery-11.jpg", alt: "Wedding dance floor packed with guests" },
                { src: "/gallery-12.jpg", alt: "Tascosa Audio live event production" },
                { src: "/gallery-13.jpg", alt: "Professional audio and lighting setup Amarillo" },
              ].map((photo) => (
                <div key={photo.src} className="break-inside-avoid rounded-2xl overflow-hidden border border-neutral-800 hover:border-tascosa-orange/50 transition-all duration-300 group">
                  <img src={photo.src} alt={photo.alt} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ───────────────────────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-800">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
              <p className="mt-4 text-neutral-300">Everything you need to know before booking. Still have questions?{" "}<a href="#contact" className="text-tascosa-orange hover:underline">Reach out anytime.</a></p>
            </div>
            <div className="max-w-3xl mx-auto divide-y divide-neutral-800">
              {[
                { q: "Do you take song requests and do-not-play lists?", a: "Absolutely. We encourage both. You can share your must-play songs, special requests, and any songs you'd prefer we skip. Your playlist is personal to you and we treat it that way." },
                { q: "How do you handle music for the ceremony vs. the reception?", a: "We treat them as two completely separate experiences. Ceremony music is carefully curated for the tone and emotion of each moment — processional, recessional, and everything in between. The reception is where we shift gears and focus on keeping the energy high and the dance floor packed all night." },
                { q: "How early do you arrive to set up?", a: "We typically arrive two hours before the ceremony begins so everything is dialed in well ahead of time. We have music playing 30 minutes before the ceremony starts so your guests are welcomed with great sound as they arrive." },
                { q: "Does setup and breakdown time cost extra?", a: "Never. Setup and breakdown are always included in your package price. Your event time is your event time — we handle everything else around it." },
                { q: "What happens if there's a technical issue during the event?", a: "We come prepared with backup equipment for exactly this reason. In over a decade of events we've learned that preparation is everything. A technical issue has never stopped one of our shows and we intend to keep it that way." },
                { q: "Do you provide your own equipment?", a: "Yes — we bring everything. Professional speakers, wireless microphones, dance floor lighting, and all the cables and gear needed for a seamless setup. You don't need to worry about a thing." },
                { q: "Do you require a deposit?", a: "Yes. A non-refundable deposit of 00 is required to secure your date. The remaining balance can be paid any time up to the day before your event. We accept credit cards, Venmo, and Cash App." },
                { q: "How far in advance should we book?", a: "As soon as you have your date confirmed — especially for weddings. Peak season weekends book up quickly. We recommend reaching out at least 3 to 6 months in advance to guarantee your date." },
                { q: "Do you travel outside of Amarillo?", a: "Absolutely. We serve all of the Texas Panhandle, the South Plains, New Mexico, and Oklahoma. Travel fees apply based on distance from Amarillo — see our travel fee schedule in the pricing section for exact rates." },
              ].map(({ q, a }, i) => <FAQItem key={i} question={q} answer={a} />)}
            </div>
          </section>

          {/* ── CONTACT ───────────────────────────────────────────────── */}
          <section id="contact" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 border-t border-neutral-800">
            <div className="grid lg:grid-cols-5 gap-16">
              <div className="lg:col-span-3">
                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold">Request a Quote</h2>
                  <p className="mt-2 text-neutral-300">Tell us about your event. Whether it's a wedding, private party, or a system in need of repair, we'll get back to you within 24 hours.</p>
                </div>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormInput label="Your Name" id="name" name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
                    <FormInput label="Email Address" id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@example.com" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <FormInput label="Phone Number" id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="806-555-0123" />
                    <div className="w-full">
                      <label htmlFor="service" className="block text-sm font-medium text-neutral-300 mb-1.5 ml-1">Service Type</label>
                      <select id="service" name="service" value={form.service} onChange={handleChange} className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-white focus:ring-2 focus:ring-tascosa-orange focus:outline-none transition-all appearance-none cursor-pointer">
                        <option>DJ Services</option>
                        <option>Diagnostic, Repair & Education</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="w-full">
                      <label htmlFor="eventDate" className="block text-sm font-medium text-neutral-300 mb-1.5 ml-1">Event Date</label>
                      <input id="eventDate" name="eventDate" type="date" value={form.eventDate} onChange={handleChange} className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-white focus:ring-2 focus:ring-tascosa-orange focus:outline-none transition-all [color-scheme:dark]" />
                    </div>
                    {form.service === "DJ Services" && (
                      <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
                        <label htmlFor="pkg" className="block text-sm font-medium text-neutral-300 mb-1.5 ml-1">Select Your Package</label>
                        <select id="pkg" name="pkg" value={form.pkg} onChange={handleChange} required className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-white focus:ring-2 focus:ring-tascosa-orange focus:outline-none transition-all appearance-none cursor-pointer">
                          <option value="">Choose a DJ package…</option>
                          {DJ_PACKAGES.map(label => <option key={label} value={label}>{label}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <label htmlFor="message" className="block text-sm font-medium text-neutral-300 mb-1.5 ml-1">Event Details</label>
                    <textarea id="message" name="message" value={form.message} onChange={handleChange} rows={5} placeholder="Tell us about the venue, expected hours, and any special requests..." className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-white focus:ring-2 focus:ring-tascosa-orange focus:outline-none transition-all resize-none" />
                  </div>
                  <button type="submit" disabled={formStatus === "sending" || formStatus === "success"} className="w-full md:w-auto rounded-2xl px-10 py-4 bg-tascosa-orange text-black font-black shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-wider text-sm">
                    {formStatus === "sending" ? "Sending…" : formStatus === "success" ? "Sent!" : "Request Quote"}
                  </button>
                  {formStatus === "success" && <p className="mt-4 text-emerald-400 text-sm font-medium flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>Got it! We'll be in touch within 24 hours.</p>}
                  {formStatus === "error" && <p className="mt-4 text-red-400 text-sm font-medium flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-400"></span>Something went wrong. Please call or text us directly at 806-670-7913.</p>}
                </form>
              </div>
              <div className="lg:col-span-2 space-y-8">
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>Direct Contact</h3>
                  <ul className="space-y-6">
                    <li className="flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-neutral-800 flex items-center justify-center flex-none"><svg className="h-5 w-5 text-tascosa-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                      <div><p className="text-xs uppercase font-bold text-neutral-500 tracking-widest">Email</p><a href="mailto:info@tascosaaudio.com" className="text-white hover:text-tascosa-orange transition-colors">info@tascosaaudio.com</a></div>
                    </li>
                    <li className="flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-neutral-800 flex items-center justify-center flex-none"><svg className="h-5 w-5 text-tascosa-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
                      <div><p className="text-xs uppercase font-bold text-neutral-500 tracking-widest">Phone / Text</p><a href="tel:8066707913" className="text-white hover:text-tascosa-orange transition-colors">806-670-7913</a></div>
                    </li>
                  </ul>
                </div>
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>Service Area</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">Based in Amarillo, TX. Serving Canyon, Lubbock, the Texas Panhandle, the South Plains, New Mexico, and Oklahoma.</p>
                </div>
                <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>Response Time</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">We respond to all quote requests within <span className="text-white font-semibold">24 hours</span>. For urgent inquiries, call or text us directly.</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="border-t border-neutral-900 bg-neutral-950 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4">
                <img src="/TA Logo.png" alt="Tascosa Audio" className="h-8 w-auto opacity-50" loading="lazy" />
                <p className="text-neutral-500 text-sm italic">Audio solutions made simple.</p>
              </div>
              <div className="flex gap-10 text-sm font-medium">
                <a href="https://www.instagram.com/tascosaaudio" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">Instagram</a>
                <a href="https://www.facebook.com/people/Tascosa-Audio/61583130066383/#" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">Facebook</a>
              </div>
              <p className="text-neutral-600 text-[10px] uppercase tracking-[0.2em]">© {new Date().getFullYear()} Tascosa Audio LLC</p>
            </div>
          </div>
        </footer>

        {/* ── STICKY MOBILE TEXT BAR ────────────────────────────────────── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-neutral-950/95 backdrop-blur border-t border-neutral-800">
          <a href="sms:+18066707913" className="flex items-center justify-center gap-3 w-full py-3.5 bg-tascosa-orange text-black font-black rounded-2xl shadow-lg active:scale-95 transition-all text-sm">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
            TEXT US NOW — 806-670-7913
          </a>
        </div>

      </div>
    </>
  );
}
