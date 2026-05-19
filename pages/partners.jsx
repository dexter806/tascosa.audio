// FILE LOCATION: pages/partners.jsx
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO ADD THIS PAGE:
// 1. In GitHub, click into your "pages" folder
// 2. Click "Add file" → "Create new file"
// 3. Name it exactly:  partners.jsx
// 4. Paste all of this code in and click "Commit changes"
//
// TO ADD MORE VENUES OR VENDORS LATER:
// Scroll down to the VENUES or VENDORS arrays and copy/paste one of the
// existing objects, then fill in the new details.
// ─────────────────────────────────────────────────────────────────────────────

import Head from "next/head";
import { useState } from "react";

// ─── VENUE DATA ───────────────────────────────────────────────────────────────
// logo: filename from your public/ folder. Set to "" if no logo yet.
const VENUES = [
  {
    name: "Knotting Hill Wedding and Event Center",
    category: "Wedding Venue",
    logo: "/Knotting Hill Logo.jpg",
    description:
      "Nikkie and her team are fantastic to work with. Knotting Hill offers beautiful all-inclusive wedding packages — and Tascosa Audio is proud to be part of them.",
    website: "https://www.knottinghillevents.com/",
    facebook: "https://www.facebook.com/knottinghillamarillo/",
    instagram: "",
    phone: "",
  },
  {
    name: "Iron Rose Weddings and Events",
    category: "Wedding Venue",
    logo: "/Iron Rose Logo.png",
    description:
      "Monica and her team go out of their way to make your special day truly special. A stunning venue that pairs perfectly with professional audio.",
    website: "https://www.ironroseweddings.com/",
    facebook: "https://www.facebook.com/ironrosewedding/",
    instagram: "",
    phone: "",
  },
  {
    name: "River Falls Venue + Lodges",
    category: "Wedding Venue & Lodging",
    logo: "/River Falls Logo.jpg",
    description:
      "A breathtaking venue offering both stunning event space and on-site lodging. Tascosa Audio is honored to be a trusted audio partner at River Falls.",
    website: "https://riverfallsvenue.com/",
    facebook: "",
    instagram: "https://www.instagram.com/riverfallsvenue/",
    phone: "",
  },
];

// ─── VENDOR DATA ──────────────────────────────────────────────────────────────
// logo: filename from your public/ folder.
// To add a vendor logo later: upload the image to your public/ folder in GitHub,
// then set logo: "/your-filename.png" below.
const VENDORS = [
  {
    name: "Katie Billstrom",
    business: "katiebillstromphoto",
    category: "Photographer",
    logo: "/katie-billstrom-logo.png",
    description:
      "Katie brings a stunning, authentic eye to every event she shoots. Highly recommended for weddings and private events across the Panhandle.",
    website: "https://www.katiebillstrom.com/",
    facebook: "",
    instagram: "https://www.instagram.com/katiebillstromphoto/",
    phone: "",
  },
  {
    name: "Olivia Bridges",
    business: "Olivia Bridges Photography",
    category: "Photographer",
    logo: "/olivia-bridges-logo.png",
    description:
      "Olivia captures the moments that matter most. A talented photographer with a warm, personal approach to every event she covers.",
    website: "",
    facebook: "https://www.facebook.com/profile.php?id=100093272509518",
    instagram: "https://www.instagram.com/oliviabridgesphotography",
    phone: "952-687-7923",
  },
  {
    name: "The HazyHop Mobile Bar",
    business: "The HazyHop Mobile Bar",
    category: "Mobile Bar",
    logo: "/hazyhop-logo.png",
    description:
      "A one-of-a-kind mobile bar experience perfect for weddings, private parties, and corporate events. A fantastic addition to any celebration.",
    website: "",
    facebook: "https://www.facebook.com/TheHazyHop",
    instagram: "",
    phone: "806-884-8225",
  },
  {
    name: "Christina Miller",
    business: "Christina Miller",
    category: "Event Coordination & Planning",
    logo: "",
    description:
      "Christina brings calm, detail-oriented coordination to every event she touches. If you want your day to run flawlessly, she's your person.",
    website: "",
    facebook: "",
    instagram: "",
    phone: "806-884-8225",
  },
  {
    name: "Elaine Dillard",
    business: "Events by Elaine",
    category: "Event Coordination & Planning",
    logo: "/events-by-elaine-logo.png",
    description:
      "Elaine and her team bring creativity and precision to every event they plan. From intimate gatherings to large celebrations, Events by Elaine delivers.",
    website: "https://www.events-by-elaine.com/",
    facebook: "https://www.facebook.com/Planner.EventsbyElaine",
    instagram: "https://www.instagram.com/events_by_elaine",
    phone: "(806)-886-6185",
  },
];

// ─── SOCIAL LINK ICONS ────────────────────────────────────────────────────────
const IconGlobe = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.5 0-4.5-4.03-4.5-9S9.5 3 12 3s4.5 4.03 4.5 9-2 9-4.5 9zM3.6 9h16.8M3.6 15h16.8" />
  </svg>
);

const IconFacebook = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const IconInstagram = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const IconPhone = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

// ─── VENUE CARD ───────────────────────────────────────────────────────────────
const VenueCard = ({ venue }) => (
  <div className="group relative rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 transition-all duration-300 hover:border-tascosa-orange/50 hover:bg-neutral-900 flex flex-col justify-between">
    {/* Orange dot accent */}
    <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-tascosa-orange opacity-30 group-hover:opacity-100 transition-opacity" />

    <div>
      {/* Logo */}
      {venue.logo && (
        <div className="mb-6 h-16 flex items-center">
          <img
            src={venue.logo}
            alt={`${venue.name} logo`}
            className="max-h-14 max-w-[180px] w-auto object-contain"
            loading="lazy"
          />
        </div>
      )}

      {/* Category pill */}
      <span className="inline-block text-xs font-bold uppercase tracking-widest text-tascosa-orange bg-tascosa-orange/10 px-3 py-1 rounded-full mb-4">
        {venue.category}
      </span>

      <h3 className="text-xl font-bold text-white group-hover:text-tascosa-orange transition-colors leading-tight">
        {venue.name}
      </h3>

      <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
        {venue.description}
      </p>
    </div>

    {/* Links */}
    <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-wrap gap-3">
      {venue.website && (
        <a href={venue.website} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-tascosa-orange transition-colors bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-xl">
          <IconGlobe /> Website
        </a>
      )}
      {venue.facebook && (
        <a href={venue.facebook} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-tascosa-orange transition-colors bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-xl">
          <IconFacebook /> Facebook
        </a>
      )}
      {venue.instagram && (
        <a href={venue.instagram} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-tascosa-orange transition-colors bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-xl">
          <IconInstagram /> Instagram
        </a>
      )}
    </div>
  </div>
);

// ─── VENDOR CARD ──────────────────────────────────────────────────────────────
const VendorCard = ({ vendor }) => (
  <div className="group relative rounded-3xl border border-neutral-800 bg-neutral-900/50 p-7 transition-all duration-300 hover:border-tascosa-orange/40 hover:bg-neutral-900 flex flex-col justify-between">
    <div className="absolute top-5 right-5 h-1.5 w-1.5 rounded-full bg-tascosa-orange opacity-30 group-hover:opacity-100 transition-opacity" />

    <div>
      {/* Logo — shows if uploaded, falls back gracefully if not */}
      {vendor.logo ? (
        <div className="mb-5 h-14 flex items-center">
          <img
            src={vendor.logo}
            alt={`${vendor.business} logo`}
            className="max-h-12 max-w-[160px] w-auto object-contain"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
      ) : (
        <div className="mb-5 h-14 w-14 rounded-2xl bg-neutral-800 flex items-center justify-center">
          <span className="text-xl font-black text-tascosa-orange">
            {vendor.business.charAt(0)}
          </span>
        </div>
      )}

      {/* Category pill */}
      <span className="inline-block text-xs font-bold uppercase tracking-widest text-tascosa-orange bg-tascosa-orange/10 px-3 py-1 rounded-full mb-4">
        {vendor.category}
      </span>

      <h3 className="text-lg font-bold text-white group-hover:text-tascosa-orange transition-colors">
        {vendor.business !== vendor.name ? vendor.business : vendor.name}
      </h3>
      {vendor.business !== vendor.name && (
        <p className="text-xs text-neutral-500 mt-0.5">{vendor.name}</p>
      )}

      <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
        {vendor.description}
      </p>
    </div>

    {/* Links + phone */}
    <div className="mt-6 pt-5 border-t border-neutral-800 flex flex-wrap gap-3">
      {vendor.website && (
        <a href={vendor.website} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-tascosa-orange transition-colors bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-xl">
          <IconGlobe /> Website
        </a>
      )}
      {vendor.facebook && (
        <a href={vendor.facebook} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-tascosa-orange transition-colors bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-xl">
          <IconFacebook /> Facebook
        </a>
      )}
      {vendor.instagram && (
        <a href={vendor.instagram} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-tascosa-orange transition-colors bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-xl">
          <IconInstagram /> Instagram
        </a>
      )}
      {vendor.phone && (
        <a href={`tel:${vendor.phone.replace(/\D/g, "")}`}
          className="flex items-center gap-2 text-xs font-medium text-neutral-300 hover:text-tascosa-orange transition-colors bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-xl">
          <IconPhone /> {vendor.phone}
        </a>
      )}
    </div>
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Partners() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Partners & Vendors | Tascosa Audio — Amarillo, TX</title>
        <meta
          name="description"
          content="Tascosa Audio's trusted partner venues and recommended vendors in the Amarillo, TX area. Photographers, event planners, mobile bars, and wedding venues we proudly work with."
        />
        <link rel="canonical" href="https://www.tascosaaudio.com/partners" />
        <meta property="og:title" content="Partners & Vendors | Tascosa Audio" />
        <meta property="og:description" content="Our trusted partner venues and recommended vendors in the Texas Panhandle." />
        <meta property="og:url" content="https://www.tascosaaudio.com/partners" />
      </Head>

      <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-tascosa-orange selection:text-black">

        {/* ── NAV (matches your main site) ──────────────────────────────── */}
        <header className="sticky top-0 z-50 backdrop-blur-md border-b border-neutral-800/60 bg-neutral-950/80">
          <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">

              <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src="/TA Logo.png" alt="Tascosa Audio Logo" className="h-9 w-auto object-contain" />
                <span className="text-lg font-bold tracking-wide">Tascosa Audio</span>
              </a>

              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
                <a href="/#services" className="hover:text-tascosa-orange transition-colors">Services</a>
                <a href="/#pricing" className="hover:text-tascosa-orange transition-colors">Pricing</a>
                <a href="/#about" className="hover:text-tascosa-orange transition-colors">About</a>
                <a href="/partners" className="text-tascosa-orange">Partners & Vendors</a>
                <a href="/#contact" className="hover:text-tascosa-orange transition-colors">Request a Quote</a>
                <a href="https://www.instagram.com/tascosaaudio" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-neutral-400 hover:text-tascosa-orange transition-colors">
                  <IconInstagram />
                </a>
                <a href="https://www.facebook.com/people/Tascosa-Audio/61583130066383/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-neutral-400 hover:text-tascosa-orange transition-colors">
                  <IconFacebook />
                </a>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMenuOpen}
                  className="p-2 text-neutral-400 hover:text-white focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile dropdown */}
            {isMenuOpen && (
              <div className="md:hidden border-t border-neutral-800 py-4 px-2 space-y-1 bg-neutral-950">
                {[
                  { name: "Services", href: "/#services" },
                  { name: "Pricing", href: "/#pricing" },
                  { name: "About", href: "/#about" },
                  { name: "Partners & Vendors", href: "/partners" },
                  { name: "Request a Quote", href: "/#contact" },
                ].map((link) => (
                  <a key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 text-base font-medium rounded-xl transition-all
                      ${link.href === "/partners"
                        ? "text-tascosa-orange bg-tascosa-orange/10"
                        : "text-neutral-300 hover:bg-neutral-900 hover:text-tascosa-orange"
                      }`}>
                    {link.name}
                  </a>
                ))}
                <div className="pt-4 pb-2 px-4">
                  <a href="sms:+18066707913"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-tascosa-orange text-black font-black rounded-2xl shadow-lg active:scale-95 transition-all">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    TEXT US: 806-670-7913
                  </a>
                </div>
              </div>
            )}
          </nav>
        </header>

        <main>

          {/* ── PAGE HERO ─────────────────────────────────────────────── */}
          <section className="relative isolate overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.05),transparent_60%)]" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tascosa-orange mb-4">
                Trusted relationships. Better events.
              </p>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                Partners &{" "}
                <span className="text-tascosa-orange">Vendors</span>
              </h1>
              <p className="mt-6 text-neutral-300 text-lg max-w-2xl mx-auto leading-relaxed">
                These are the venues we're proud to partner with and the vendors we personally recommend.
                Every name on this page has earned our trust — and we're happy to work alongside all of them.
              </p>

              {/* Exclusive pricing callout — inviting, not exclusionary */}
              <div className="mt-8 inline-flex items-start gap-3 rounded-2xl border border-tascosa-orange/30 bg-tascosa-orange/5 px-6 py-4 max-w-xl mx-auto text-left">
                <span className="text-tascosa-orange mt-0.5 flex-none">✦</span>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  <span className="text-white font-semibold">Already booked with one of our partner venues?</span>{" "}
                  Reach out and ask us about exclusive pricing available to their clients.{" "}
                  <a href="/#contact" className="text-tascosa-orange hover:underline font-medium">Get in touch →</a>
                </p>
              </div>
            </div>
          </section>

          {/* ── PARTNER VENUES ────────────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-800">
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-3">
                <span className="h-px flex-grow bg-neutral-800" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Partner Venues</span>
                <span className="h-px flex-grow bg-neutral-800" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-center">Venues We Partner With</h2>
              <p className="mt-3 text-neutral-400 text-center max-w-2xl mx-auto">
                Tascosa Audio is built into the all-inclusive packages at each of these venues.
                Book with them and you're already getting professional audio taken care of.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {VENUES.map((venue) => (
                <VenueCard key={venue.name} venue={venue} />
              ))}
            </div>
          </section>

          {/* ── RECOMMENDED VENDORS ───────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-800">
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-3">
                <span className="h-px flex-grow bg-neutral-800" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Recommended Vendors</span>
                <span className="h-px flex-grow bg-neutral-800" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-center">Vendors We Recommend</h2>
              <p className="mt-3 text-neutral-400 text-center max-w-2xl mx-auto">
                These are the local professionals we trust and have worked alongside.
                Every vendor listed here comes with our personal recommendation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {VENDORS.map((vendor) => (
                <VendorCard key={vendor.name} vendor={vendor} />
              ))}
            </div>
          </section>

          {/* ── BOTTOM CTA ────────────────────────────────────────────── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-800">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-10 md:p-14 text-center max-w-3xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tascosa-orange mb-4">
                Audio solutions made simple.
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">Ready to make your event unforgettable?</h2>
              <p className="mt-4 text-neutral-400 leading-relaxed">
                Whether you're booking through one of our partner venues or planning your own event,
                we're here to make sure your audio is the last thing you have to worry about.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <a href="/#contact"
                  className="rounded-2xl px-8 py-4 bg-tascosa-orange text-black font-black shadow-lg hover:brightness-110 active:scale-95 transition-all">
                  Request a Quote
                </a>
                <a href="/"
                  className="rounded-2xl px-8 py-4 border border-neutral-700 hover:border-neutral-500 transition-colors font-medium">
                  Back to Home
                </a>
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
              <p className="text-neutral-600 text-[10px] uppercase tracking-[0.2em]">
                © {new Date().getFullYear()} Tascosa Audio LLC
              </p>
            </div>
          </div>
        </footer>

        {/* ── STICKY MOBILE TEXT BAR ────────────────────────────────────── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-neutral-950/95 backdrop-blur border-t border-neutral-800">
          <a href="sms:+18066707913"
            className="flex items-center justify-center gap-3 w-full py-3.5 bg-tascosa-orange text-black font-black rounded-2xl shadow-lg active:scale-95 transition-all text-sm">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            TEXT US NOW — 806-670-7913
          </a>
        </div>

      </div>
    </>
  );
}
