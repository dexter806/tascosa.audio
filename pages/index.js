import { useState } from "react";

// --- REUSABLE UI COMPONENTS (Keep these to keep HTML clean) ---
const FormInput = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">{label}</label>
    <input
      {...props}
      className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tascosa-orange transition-all"
    />
  </div>
);

const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
    {subtitle && <p className="mt-2 text-neutral-300">{subtitle}</p>}
  </div>
);

export default function Home() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", service: "DJ Services", package: "", message: ""
  });
  const [sent, setSent] = useState(false);

  const DJ_PACKAGES = ["Private Party", "Wedding Reception", "Wedding Full Service"];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === "service" ? { package: "" } : {}) 
    }));
  }

  function jumpToContactWith(service, selectedPackage = "") {
    setForm(prev => ({
      ...prev,
      service,
      package: service === "DJ Services" ? selectedPackage : ""
    }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const bodyLines = [
      "Hello Tascosa Audio,", "", "New inquiry:", "",
      `Name: ${form.name}`, `Email: ${form.email}`, `Phone: ${form.phone}`,
      `Service: ${form.service}`, ...(form.package ? [`Package: ${form.package}`] : []),
      `Details: ${form.message}`
    ];
    const mailto = `mailto:info@tascosaaudio.com?subject=Tascosa Audio Inquiry&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.open(mailto, "_self");
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-tascosa-orange selection:text-black">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur border-b border-neutral-800/60 bg-neutral-950/70">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/TA Logo.png" alt="Tascosa Audio Logo" className="h-9 w-auto object-contain" />
            <span className="text-lg font-semibold tracking-wide">Tascosa Audio</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
                  Audio solutions <span className="text-tascosa-orange">made simple.</span>
                </h1>
                <div className="mt-5 text-neutral-300 text-lg max-w-prose space-y-4">
                  <p>At Tascosa Audio, we’re your partners in finding your audio solution.</p>
                  <p>
                    From our professional DJ services to expert setup and troubleshooting, 
                    our team is proud to serve Amarillo, Canyon, Lubbock, the Texas Panhandle, 
                    the South Plain, New Mexico, and Oklahoma.
                  </p>
                </div>
                <div className="mt-8 flex gap-3">
                  <a href="#services" className="rounded-2xl px-6 py-3 bg-tascosa-orange text-black font-semibold shadow hover:brightness-110 transition-all">
                    See Services
                  </a>
                  <a href="#pricing" className="rounded-2xl px-6 py-3 border border-neutral-700 hover:border-neutral-500 transition-colors">
                    See Pricing
                  </a>
                </div>
                <div className="mt-6 text-sm text-neutral-400">
                  Years of experience • Professional gear • Easy scheduling
                </div>
              </div>

              <div className="relative">
                <div className="aspect-[4/3] rounded-3xl border border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden">
                  <img src="/Lights.jpg" alt="Event lighting and DJ setup" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -bottom-6 -right-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur p-4 shadow-xl max-w-[280px]">
                  <p className="text-sm">Next-level vibes for weddings, private parties, school dances, and more.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

{/* SERVICES */}
<section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
  
  {/* Services Header - Centered to match Pricing */}
  <div className="text-center max-w-3xl mx-auto mb-12">
    <h2 className="text-3xl md:text-4xl font-bold">Services</h2>
    <p className="mt-4 text-neutral-300 leading-relaxed text-lg">
      Professional audio solutions tailored to your event or venue. 
      Pick what fits your need.
    </p>
  </div>

  {/* Services Grid - Balanced 2-column layout */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center max-w-5xl mx-auto">
    {[
      {
        title: "DJ Services",
        desc: "Weddings, Private Parties, and School Events. We bring the energy and the expertise to keep your dance floor moving all night long.",
        items: [
          "Professional MC Services",
          "Club-style Dance Lighting",
          "High-end Wireless Microphones",
          "Custom Playlist Planning"
        ],
        href: "#dj-packages"
      },
      {
        title: "Diagnostic, Repair & Education",
        desc: "Don't let technical issues ruin your sound. We help you fix current problems and teach you how to prevent future ones.",
        items: [
          "On-site System Troubleshooting",
          "Venue & Church Sound Tuning",
          "Feedback & Signal Flow Fixes",
          "1-on-1 Equipment Training"
        ],
        href: "#diagnostic"
      }
    ].map((card) => (
      <div
        key={card.title}
        className="group relative rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 shadow-sm transition-all duration-300 hover:border-tascosa-orange/50 hover:bg-neutral-900 flex flex-col justify-between"
      >
        {/* Subtle hover decoration */}
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity">
          <div className="h-2 w-2 rounded-full bg-tascosa-orange"></div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white group-hover:text-tascosa-orange transition-colors">
            {card.title}
          </h3>
          <p className="mt-4 text-neutral-400 text-sm leading-relaxed">
            {card.desc}
          </p>
          
          <div className="mt-6 pt-6 border-t border-neutral-800">
            <ul className="space-y-3 text-sm text-neutral-300">
              {card.items.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-tascosa-orange"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <a
          href={card.href}
          className="mt-10 inline-block text-center rounded-2xl px-6 py-4 bg-neutral-800 text-white font-bold transition-all hover:bg-tascosa-orange hover:text-black active:scale-95 shadow-lg"
        >
          Explore {card.title === "DJ Services" ? "Packages" : "Service"}
        </a>
      </div>
    ))}
  </div>

  {/* Trust Badge / Experience Note */}
  <div className="mt-16 text-center">
    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
      Serving Amarillo • Canyon • Lubbock • Panhandle • New Mexico • Oklahoma
    </p>
  </div>
</section>

{/* PRICING */}
<section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-800">
  
  {/* DJ Services Header - Now Centered */}
  <div id="dj-packages" className="text-center max-w-3xl mx-auto mb-12">
    <h2 className="text-3xl md:text-4xl font-bold">DJ Services</h2>
    <p className="mt-4 text-neutral-300 leading-relaxed">
      Transparent base packages. All packages run until 12:00 AM. 
      Per-hour add-on available for the 6-hour package only.
    </p>
  </div>

  {/* DJ Packages Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
    {[
      {
        tier: "Private Party",
        price: "$600",
        features: [
          "DJ Service",
          "Dinner/Party Music",
          "Wireless mic",
          "Dance lighting"
        ]
      },
      {
        tier: "Wedding Reception",
        price: "$900",
        features: [
          "Up to 4 hours of DJ Service",
          "Reception/Dinner Music",
          "Wireless mic",
          "Dance lighting"
        ]
      },
      {
        tier: "Wedding Full Service",
        price: "$1250",
        features: [
          "Up to 6 hours of DJ Service",
          "Ceremony Music",
          "Reception/Dinner Music",
          "Wireless mics",
          "Dance lighting"
        ],
        highlight: true
      }
    ].map((p) => (
      <div
        key={p.tier}
        className={`flex flex-col rounded-3xl border p-8 transition-all duration-300 ${
          p.highlight 
            ? "border-tascosa-orange bg-neutral-900 shadow-[0_0_20px_rgba(255,100,0,0.1)] scale-105 z-10" 
            : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
        }`}
      >
        <div className="flex items-baseline justify-between mb-6">
          <h3 className="text-xl font-bold">{p.tier}</h3>
          <span className={`text-2xl font-black ${p.highlight ? "text-tascosa-orange" : "text-white"}`}>
            {p.price}
          </span>
        </div>

        <ul className="flex-grow space-y-4 text-sm text-neutral-300">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span className="text-tascosa-orange mt-0.5">✓</span>
              {f}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => jumpToContactWith("DJ Services", p.tier)}
          className={`mt-8 w-full rounded-xl py-3 font-bold transition-all active:scale-95 ${
            p.highlight
              ? "bg-tascosa-orange text-black hover:brightness-110"
              : "border border-neutral-700 text-white hover:bg-neutral-800"
          }`}
        >
          Choose Package
        </button>
      </div>
    ))}
  </div>

  {/* Diagnostic Header - Centered */}
  <div id="diagnostic" className="mt-32 text-center max-w-3xl mx-auto mb-12">
    <h2 className="text-3xl md:text-4xl font-bold">Diagnostic, Repair & Education</h2>
    <p className="mt-4 text-neutral-300 leading-relaxed">
      On-site troubleshooting, system optimization, and hands-on learning for venues, churches, and individuals.
    </p>
  </div>

  {/* Diagnostic Card */}
  <div className="flex justify-center px-4">
    <div className="rounded-3xl border border-tascosa-orange bg-neutral-900 p-8 md:p-10 shadow-xl max-w-2xl w-full text-center relative overflow-hidden">
      {/* Subtle background glow for the special service card */}
      <div className="absolute -top-24 -right-24 h-48 w-48 bg-tascosa-orange/10 blur-3xl rounded-full" />
      
      <h3 className="text-2xl font-bold text-tascosa-orange">Audio System Service</h3>
      
      <div className="mt-6 inline-block bg-neutral-950 px-6 py-4 rounded-2xl border border-neutral-800">
        <p className="text-xl md:text-2xl font-black text-white leading-tight">
          $100 <span className="text-sm font-normal text-neutral-400">per hour (first 2 hours)</span>
          <br />
          $50 <span className="text-sm font-normal text-neutral-400">per hour (after 2 hours)</span>
        </p>
        <p className="mt-2 text-xs text-neutral-500 uppercase tracking-widest font-bold">(2-hour minimum)</p>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-8 text-left">
        <p className="text-neutral-300 text-sm leading-relaxed">
          Comprehensive service covering diagnostics, small repairs, and personalized education. 
          Perfect for improving your live sound setup or learning best practices for managing your own system.
        </p>
        <ul className="space-y-3 text-sm text-neutral-300">
          <li className="flex items-start gap-2">
            <span className="text-tascosa-orange">•</span> On-site system diagnostics
          </li>
          <li className="flex items-start gap-2">
            <span className="text-tascosa-orange">•</span> Signal flow & wiring
          </li>
          <li className="flex items-start gap-2">
            <span className="text-tascosa-orange">•</span> Feedback troubleshooting
          </li>
          <li className="flex items-start gap-2">
            <span className="text-tascosa-orange">•</span> 1-on-1 audio education
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={() => jumpToContactWith("Diagnostic, Repair & Education")}
        className="mt-10 w-full md:w-auto md:px-12 rounded-2xl py-4 bg-tascosa-orange text-black font-black hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-tascosa-orange/20"
      >
        Schedule Service
      </button>
      
      <p className="mt-8 text-[10px] text-neutral-500 uppercase tracking-widest">
        Travel fees may apply for locations outside Amarillo city limits.
      </p>
    </div>
  </div>
</section>

       {/* ABOUT SECTION */}
<section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 border-t border-neutral-800">
  
  {/* Header - Centered to match Services & Pricing */}
  <div className="text-center max-w-3xl mx-auto mb-16">
    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The People Behind the Sound</h2>
    <p className="mt-4 text-tascosa-orange font-medium uppercase tracking-widest text-sm">
      Local • Professional • Experienced
    </p>
  </div>

  <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
    
    {/* Text Content */}
    <div className="order-2 md:order-1 space-y-6 text-neutral-300 leading-relaxed">
      <p>
        We’re a local, owner-operated team born and raised right here in Amarillo. 
        For us, audio isn't just a business—it’s a career built on over a decade of 
        hands-on experience. 
      </p>
      
      <p>
        Our owner, Andy, brings 10+ years of expertise in music retail and is a proud 
        graduate of the <span className="text-white font-semibold">Conservatory of Recording Arts and Sciences (CRAS)</span>. 
        We’ve spent years behind the board running live sound and providing 
        professional DJ services across the Panhandle, Sound Plains, Oklahoma, and New Mexico. 
      </p>
      
      <p>
        Whether we are reading a crowd to keep a wedding dance floor packed or 
        troubleshooting a complex system for a local venue, we bring a level of 
        technical precision you won't find anywhere else. At the end of the day, 
        we’re your neighbors, and we’re here to make sure your event sounds perfect.
      </p>

      {/* Feature Highlights */}
      <div className="pt-6">
        <ul className="space-y-4">
          {[
            "CRAS Certified Technical Expertise",
            "15+ Years of Music Industry Experience",
            "On-site setup & professional, local service"
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-white font-medium">
              <div className="flex-none rounded-full bg-tascosa-orange/20 p-1">
                <svg className="h-4 w-4 text-tascosa-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Image Component */}
    <div className="order-1 md:order-2 relative">
      {/* Decorative background element */}
      <div className="absolute -inset-4 bg-tascosa-orange/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900 aspect-square overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
        <img
          src="/Party 2025.jpg" 
          alt="DJ booth and lighting at a party"
          className="h-full w-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
        />
      </div>
      
      {/* Small accent badge */}
      <div className="absolute -bottom-4 -left-4 bg-neutral-950 border border-neutral-800 p-4 rounded-2xl shadow-xl hidden sm:block">
        <p className="text-xs font-bold uppercase tracking-tighter text-neutral-400">Established Expertise</p>
        <p className="text-lg font-black text-tascosa-orange">15+ YEARS</p>
      </div>
    </div>

  </div>
</section>

{/* CONTACT & FOOTER */}
<section id="contact" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 border-t border-neutral-800">
  <div className="grid lg:grid-cols-5 gap-16">
    
    {/* Left Side: Form (Takes up 3 columns) */}
    <div className="lg:col-span-3">
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-bold">Request a Quote</h2>
        <p className="mt-4 text-neutral-400">
          Tell us about your event. Whether it's a wedding, private party, or a system in need of repair, 
          we'll get back to you within 24 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <FormInput label="Your Name" name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
          <FormInput label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@example.com" />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <FormInput label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="806-555-0123" />
          <div className="w-full">
            <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Service Type</label>
            <select 
              name="service" 
              value={form.service} 
              onChange={handleChange} 
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-white focus:ring-2 focus:ring-tascosa-orange focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option>DJ Services</option>
              <option>Diagnostic, Repair & Education</option>
            </select>
          </div>
        </div>

        {form.service === "DJ Services" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Select Your Package</label>
            <select 
              name="package" 
              value={form.package} 
              onChange={handleChange} 
              required 
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-white focus:ring-2 focus:ring-tascosa-orange focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Choose a DJ package…</option>
              {DJ_PACKAGES.map(label => <option key={label} value={label}>{label}</option>)}
            </select>
          </div>
        )}

        <div className="w-full">
          <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Event Details</label>
          <textarea 
            name="message" 
            value={form.message} 
            onChange={handleChange} 
            rows={5} 
            placeholder="Tell us about the venue, expected hours, and any special requests..." 
            className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 text-white focus:ring-2 focus:ring-tascosa-orange focus:outline-none transition-all resize-none" 
          />
        </div>

        <button 
          type="submit" 
          disabled={sent} 
          className="w-full md:w-auto rounded-2xl px-10 py-4 bg-tascosa-orange text-black font-black shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-wider text-sm"
        >
          {sent ? "Opening Email Client..." : "Send Inquiry"}
        </button>
        
        {sent && (
          <p className="mt-4 text-emerald-400 text-sm font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Thanks! Check your email app to finish sending.
          </p>
        )}
      </form>
    </div>

    {/* Right Side: Info Cards (Takes up 2 columns) */}
    <div className="lg:col-span-2 space-y-8">
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
          Direct Contact
        </h3>
        <ul className="space-y-6">
          <li className="flex gap-4">
            <div className="h-10 w-10 rounded-xl bg-neutral-800 flex items-center justify-center flex-none">
              <svg className="h-5 w-5 text-tascosa-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-neutral-500 tracking-widest">Email</p>
              <a href="mailto:info@tascosaaudio.com" className="text-white hover:text-tascosa-orange transition-colors">info@tascosaaudio.com</a>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="h-10 w-10 rounded-xl bg-neutral-800 flex items-center justify-center flex-none">
              <svg className="h-5 w-5 text-tascosa-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-neutral-500 tracking-widest">Phone</p>
              <a href="tel:8066707913" className="text-white hover:text-tascosa-orange transition-colors">806-670-7913</a>
            </div>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="h-4 w-1 bg-tascosa-orange rounded-full"></span>
          Service Area
        </h3>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Based in Amarillo, TX. Serving Canyon, Lubbock, the Texas Panhandle, 
          the South Plains, Oklahoma, and New Mexico.
        </p>
      </div>
    </div>
  </div>
</section>

{/* FOOTER */}
<footer className="border-t border-neutral-900 bg-neutral-950 py-12">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-4">
        <img src="/TA Logo.png" alt="Tascosa Audio" className="h-8 w-auto opacity-50" />
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
