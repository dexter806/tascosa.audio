import React, { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "DJ Services",
    package: "",
    message: ""
  });
  const [sent, setSent] = useState(false);

  const DJ_PACKAGES = ["Private Party", "Wedding Reception", "Wedding Full Service"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "service" ? { package: "" } : {})
    }));
  };

  const jumpToContactWith = (service, selectedPackage = "") => {
    setForm((prev) => ({
      ...prev,
      service,
      package: service === "DJ Services" ? selectedPackage : ""
    }));
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bodyLines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Service: ${form.service}`,
      `Package: ${form.package}`,
      `Details: ${form.message}`
    ];
    const mailto = `mailto:info@tascosaaudio.com?subject=Inquiry&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.open(mailto, "_self");
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur border-b border-neutral-800">
        <nav className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/TA Logo.png" alt="Logo" className="h-8 w-auto" />
            <span className="font-bold tracking-tight">Tascosa Audio</span>
          </div>
          <div className="hidden md:flex gap-6 text-sm">
            <a href="#services" className="hover:text-tascosa-orange transition-colors">Services</a>
            <a href="#pricing" className="hover:text-tascosa-orange transition-colors">Pricing</a>
            <a href="#about" className="hover:text-tascosa-orange transition-colors">About</a>
            <a href="#contact" className="hover:text-tascosa-orange transition-colors">Contact</a>
          </div>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="mx-auto max-w-7xl px-4 py-20 text-center md:text-left">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-black leading-tight">
                Audio solutions <span className="text-tascosa-orange">made simple.</span>
              </h1>
              <p className="mt-6 text-neutral-300 text-lg">
                Partnering with you for professional DJ services, setup, and troubleshooting across the Texas Panhandle and beyond.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                <a href="#services" className="px-8 py-3 bg-tascosa-orange text-black font-bold rounded-xl">Our Services</a>
                <a href="#contact" className="px-8 py-3 border border-neutral-700 rounded-xl hover:bg-neutral-900">Get a Quote</a>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl">
              <img src="/Lights.jpg" alt="Event Lighting" className="w-full h-auto" />
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="py-20 border-t border-neutral-900 bg-neutral-900/20">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Services</h2>
            <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 text-left">
                <h3 className="text-2xl font-bold text-tascosa-orange">DJ Services</h3>
                <p className="mt-2 text-neutral-400">Weddings, Parties, School Events.</p>
                <ul className="mt-6 space-y-2 text-sm text-neutral-300">
                  <li>• Professional MC Services</li>
                  <li>• Dance Floor Lighting</li>
                  <li>• High-End Wireless Mics</li>
                </ul>
                <button onClick={() => jumpToContactWith("DJ Services")} className="mt-8 w-full py-3 bg-neutral-800 rounded-xl font-bold hover:bg-tascosa-orange hover:text-black transition-all">Go to Packages</button>
              </div>
              <div className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 text-left">
                <h3 className="text-2xl font-bold text-tascosa-orange">Diagnostic & Repair</h3>
                <p className="mt-2 text-neutral-400">Troubleshooting and Audio Education.</p>
                <ul className="mt-6 space-y-2 text-sm text-neutral-300">
                  <li>• On-site Diagnostics</li>
                  <li>• System Training</li>
                  <li>• Signal Flow Optimization</li>
                </ul>
                <button onClick={() => jumpToContactWith("Diagnostic, Repair & Education")} className="mt-8 w-full py-3 bg-neutral-800 rounded-xl font-bold hover:bg-tascosa-orange hover:text-black transition-all">Schedule Service</button>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-20 border-t border-neutral-900">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">DJ Pricing</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Private Party", price: "$600", items: ["DJ Service", "Dance lighting"] },
                { name: "Wedding Reception", price: "$900", items: ["Up to 4 hours", "Dinner Music"] },
                { name: "Wedding Full Service", price: "$1250", items: ["Up to 6 hours", "Ceremony Music"], highlight: true }
              ].map((pkg) => (
                <div key={pkg.name} className={`p-8 rounded-3xl border ${pkg.highlight ? 'border-tascosa-orange bg-neutral-900 scale-105 shadow-xl' : 'border-neutral-800'}`}>
                  <h3 className="text-xl font-bold">{pkg.name}</h3>
                  <div className="text-3xl font-black my-4 text-tascosa-orange">{pkg.price}</div>
                  <ul className="text-sm text-neutral-400 space-y-2 mb-8">
                    {pkg.items.map(i => <li key={i}>✓ {i}</li>)}
                  </ul>
                  <button onClick={() => jumpToContactWith("DJ Services", pkg.name)} className="w-full py-3 bg-tascosa-orange text-black font-bold rounded-xl">Choose</button>
                </div>
              ))}
            </div>

            <div className="mt-24 max-w-2xl mx-auto p-10 bg-neutral-900 border border-tascosa-orange rounded-3xl">
              <h3 className="text-2xl font-bold text-tascosa-orange">Diagnostic & Education</h3>
              <p className="mt-4 text-xl font-bold">$100/hr (first 2 hours) • $50/hr after</p>
              <p className="mt-2 text-sm text-neutral-400">On-site troubleshooting for venues, churches, and individuals.</p>
              <button onClick={() => jumpToContactWith("Diagnostic, Repair & Education")} className="mt-8 px-10 py-4 bg-tascosa-orange text-black font-bold rounded-xl">Book Now</button>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="py-20 border-t border-neutral-900 bg-neutral-900/20">
          <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-center md:text-left">The People Behind the Sound</h2>
              <p className="text-neutral-300">Local, owner-operated, and born in Amarillo. Andy brings 10+ years of experience and is a CRAS graduate.</p>
              <p className="text-neutral-300">Serving Amarillo, Canyon, Lubbock, and the surrounding areas with professional precision.</p>
            </div>
            <div className="rounded-3xl overflow-hidden border border-neutral-800 aspect-square">
              <img src="/Party 2025.jpg" className="w-full h-full object-cover" alt="About" />
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="py-20 border-t border-neutral-900">
          <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold">Get a Quote</h2>
              <p className="mt-4 text-neutral-400">Response within 24 hours guaranteed.</p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Name" className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-tascosa-orange outline-none" />
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Email" className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-tascosa-orange outline-none" />
                <select name="service" value={form.service} onChange={handleChange} className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl outline-none">
                  <option>DJ Services</option>
                  <option>Diagnostic, Repair & Education</option>
                </select>
                <textarea name="message" value={form.message} onChange={handleChange} rows={4} placeholder="Details about your event..." className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-tascosa-orange outline-none" />
                <button type="submit" className="w-full py-4 bg-tascosa-orange text-black font-bold rounded-xl hover:brightness-110 transition-all">
                  {sent ? "Opening Email Client..." : "Send Inquiry"}
                </button>
              </form>
            </div>
            <div className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 h-fit">
              <h3 className="text-xl font-bold mb-6">Business Details</h3>
              <p className="text-neutral-300"><strong>Email:</strong> info@tascosaaudio.com</p>
              <p className="mt-4 text-neutral-300"><strong>Phone:</strong> 806-670-7913</p>
              <div className="mt-8 flex gap-6">
                <a href="https://instagram.com/tascosaaudio" className="text-tascosa-orange underline">Instagram</a>
                <a href="https://facebook.com/people/Tascosa-Audio/61583130066383/#" className="text-tascosa-orange underline">Facebook</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-neutral-900 text-center text-neutral-500 text-sm">
        © {new Date().getFullYear()} Tascosa Audio. All rights reserved.
      </footer>
    </div>
  );
}
