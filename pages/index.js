
import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    service: "DJ Services",
    message: ""
  });
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const body = encodeURIComponent(
      `Hello Tascosa Audio,\n\nNew inquiry:\n\n` +
        `Name: ${form.name}\n` +
        `Email: ${form.email}\n` +
        `Phone: ${form.phone}\n` +
        `Event Date: ${form.date}\n` +
        `Service: ${form.service}\n` +
        `Details: ${form.message}\n`
    );
    window.location.href = `mailto:info@tascosaauido.com?subject=Tascosa%20Audio%20Inquiry&body=${body}`;
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-50 backdrop-blur border-b border-neutral-800/60 bg-neutral-950/70">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 shadow-lg" />
            <span className="text-lg font-semibold tracking-wide">Tascosa Audio</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
            <a href="#services" className="hover:text-white">Services</a>
           {/* <a href="#rentals" className="hover:text-white">Rentals</a> */}
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#about" className="hover:text-white">About</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </div>
        </nav>
      </header>

   {/* HERO */}
<section className="relative isolate overflow-hidden">
  <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
    <div className="grid md:grid-cols-2 gap-10 items-center">
      {/* Left: Headline + copy + buttons */}
      <div>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          Audio solutions <span className="text-amber-400">made simple.</span>
        </h1>
        <p className="mt-5 text-neutral-300 text-lg max-w-prose">
          Tascosa Audio provides professional DJ services, reliable audio rentals,
          and troubleshooting & setup support across the Texas Panhandle.
        </p>
        <div className="mt-8 flex gap-3">
          <a href="#services" className="rounded-2xl px-5 py-3 bg-amber-500 text-black font-semibold shadow hover:bg-amber-400">
            See Services
          </a>
          <a href="#pricing" className="rounded-2xl px-5 py-3 border border-neutral-700 hover:border-neutral-500">
            See Pricing
          </a>
        </div>
        <div className="mt-6 text-sm text-neutral-400">
          Years of experience • Professional gear • Easy scheduling
        </div>
      </div>

      {/* Right: Image (Lights.jpg) */}
      <div className="relative">
        <div className="aspect-[4/3] rounded-3xl border border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden">
          <img
            src="/Lights.jpg"            /* <-- Put Lights.jpg in /public exactly with this capital L */
            alt="Event lighting and DJ setup"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute -bottom-6 -right-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 backdrop-blur p-4 shadow-xl">
          <p className="text-sm">Next-level vibes for weddings, private parties, school dances, and more.</p>
        </div>
      </div>
    </div>
  </div>
</section>


      <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold">Services</h2>
        <p className="mt-2 text-neutral-300">Pick what fits your need.</p>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
           { 
  title: "DJ Services", 
  desc: "Weddings, Private Parties, School Events.", 
  items: ["Wireless mics", "Dance lighting", "MC Services"] 
},
// {
//   title: "PA Rentals", 
//   desc: "Birthdays, quinceañeras, reunions—bring the party.", 
//   items: ["Portable sound systems", "Mixers & microphones", "Delivery, setup, & tear down"] 
// },
{ 
  title: "Diagnostic, Repair, Education", 
  desc: "Get your system diagnosed, fixed, and let us teach you how to keep it running.", 
  items: ["On-site diagnostics & repair", "System setup & walkthrough", "Feedback & wiring fixes"] 
},

          ].map((card) => (
            <div key={card.title} className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow">
              <h3 className="text-xl font-semibold">{card.title}</h3>
              <p className="mt-2 text-neutral-300">{card.desc}</p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc list-inside">
                {card.items.map(item => <li key={item}>{item}</li>)}
              </ul>
              <a href="#pricing" className="mt-6 inline-block rounded-xl px-4 py-2 bg-amber-500 text-black font-medium hover:bg-amber-400">Go To Service</a>
            </div>
          ))}
        </div>
      </section>

     {/* <section id="rentals" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-800">
        <h2 className="text-3xl md:text-4xl font-bold">Audio Rentals</h2>
        <p className="mt-2 text-neutral-300">Reliable gear for DIY events. Daily/weekly rates available.</p>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            { name: "Speaker Pair (12\" Powered)", rate: "$75/day", details: "Stands + XLR included."},
            { name: "Wireless Mic Kit", rate: "$40/day", details: "Two handheld mics + receiver."},
            { name: "Mixer (8–12 ch)", rate: "$35/day", details: "Cables included on request."},
          ].map((r) => (
            <div key={r.name} className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{r.name}</h3>
                <span className="text-amber-400 font-semibold">{r.rate}</span>
              </div>
              <p className="mt-2 text-neutral-300 text-sm">{r.details}</p>
              <a href="#contact" className="mt-4 inline-block rounded-xl px-4 py-2 border border-neutral-700 hover:border-neutral-500">Reserve</a>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-neutral-400">Need something specific? Ask—we source specialty gear on request.</p>
      </section> */}

     <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-800">
  <h2 className="text-3xl md:text-4xl font-bold">DJ Services</h2>
  <p className="mt-2 text-neutral-300">Transparent base packages. All packages are till 12am. Per hour add on availble for 6 hour package only.</p>
  
<div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center max-w-6xl mx-auto px-4">
  {[
    { 
      tier: "Private Party", 
      price: "$750", 
      features: [
        "Up to 3 hours of DJ Service", 
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
    },
  ].map((p) => (
    <div 
      key={p.tier} 
      className={`rounded-3xl border ${
        p.highlight ? 'border-amber-500' : 'border-neutral-800'
      } bg-neutral-900 p-6 shadow-lg`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">{p.tier}</h3>
        <span className={`text-2xl font-extrabold ${p.highlight ? 'text-amber-400' : ''}`}>
          {p.price}
        </span>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc list-inside">
        {p.features.map(f => <li key={f}>{f}</li>)}
      </ul>
      <a 
        href="#contact" 
        className={`mt-6 inline-block rounded-xl px-4 py-2 ${
          p.highlight 
            ? 'bg-amber-500 text-black hover:bg-amber-400' 
            : 'border border-neutral-700 hover:border-neutral-500'
        }`}
      >
        Choose
      </a>
    </div>
  ))}
</div>

  <p className="mt-4 text-xs text-neutral-500">
  
  </p>
</section>


      <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-800">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">About Tascosa Audio</h2>
            <p className="mt-4 text-neutral-300 leading-relaxed">
      We’re a proud, owner-operated audio company born and raised right here in Amarillo, Texas. 
      Serving the Panhandle with years of event experience, we provide everything from crowd-reading 
      DJs and full wedding receptions to reliable PA rentals for parties, reunions, and community events. 
      Already have your own gear? Our on-site troubleshooting and setup support will keep your sound running smoothly. 
      With dependable equipment, clear communication, and local roots you can trust, Tascosa Audio makes audio solutions simple for every occasion.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc list-inside">
              <li>Knowledgeable staff for any situation </li>
              <li>Transparent pricing—no surprises</li>
              <li>On-time setup & professional appearance</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 aspect-square grid place-items-center text-neutral-400">
            <img src="/Party 2025.jpg" alt="DJ setup" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-800">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Request a Quote</h2>
            <p className="mt-2 text-neutral-300">Tell us about your event. We’ll reply within 24 hours.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Your name" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <input name="email" value={form.email} onChange={handleChange} type="email" required placeholder="Email" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <input name="date" value={form.date} onChange={handleChange} type="date" placeholder="Event date" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <select name="service" value={form.service} onChange={handleChange} className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option>DJ Services</option>
                 {/* <option>Audio Rentals</option>
                  <option>Both (DJ + Rentals)</option> */}
                </select>
              </div>
              <textarea name="message" value={form.message} onChange={handleChange} rows={5} placeholder="Event details, venue, hours, special requests..." className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <button type="submit" className="rounded-2xl px-5 py-3 bg-amber-500 text-black font-semibold shadow hover:bg-amber-400">Send Inquiry</button>
              {sent && (<p className="text-sm text-emerald-400">Thanks! Your email app should open with the details pre-filled.</p>)}
            </form>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="text-xl font-semibold">Business Info</h3>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              <li><strong>Service area:</strong> Amarillo & Texas Panhandle</li>
              <li><strong>Email:</strong> info@tascosaaduio.com</li>
              <li><strong>Hours:</strong> By appointment</li>
            </ul>
            <div className="mt-6 text-sm text-neutral-400">
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-sm text-neutral-400 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>© {new Date().getFullYear()} Tascosa Audio. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Instagram</a>
            <a href="#" className="hover:text-white">Facebook</a>
            <a href="#" className="hover:text-white">TikTok</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
