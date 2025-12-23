import { useState } from "react";

// --- REUSABLE UI SUB-COMPONENTS ---

// 1. Clean Input Component to avoid repeating classes
const FormInput = ({ label, ...props }) => (
  <div className="w-full">
    <label className="block text-xs font-medium text-neutral-400 mb-1 ml-1">{label}</label>
    <input
      {...props}
      className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 
                 text-white placeholder-neutral-500 transition-all
                 focus:outline-none focus:ring-2 focus:ring-tascosa-orange focus:border-transparent"
    />
  </div>
);

// 2. Nav Link Component
const NavLink = ({ href, children }) => (
  <a href={href} className="hover:text-white transition-colors">
    {children}
  </a>
);

export default function Home() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", service: "DJ Services", package: "", message: ""
  });
  const [sent, setSent] = useState(false);

  const DJ_PACKAGES = ["Private Party", "Wedding Reception", "Wedding Full Service"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === "service" ? { package: "" } : {})
    }));
  };

  const jumpToContactWith = (service, selectedPackage = "") => {
    setForm(prev => ({ ...prev, service, package: service === "DJ Services" ? selectedPackage : "" }));
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const bodyLines = [
      "Hello Tascosa Audio,", "", "New inquiry:", "",
      `Name: ${form.name}`, `Email: ${form.email}`, `Phone: ${form.phone}`,
      `Service: ${form.service}`, ...(form.package ? [`Package: ${form.package}`] : []),
      `Details: ${form.message}`
    ];
    const mailto = `mailto:info@tascosaaudio.com?subject=Inquiry&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.open(mailto, "_self");
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-tascosa-orange selection:text-black">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-neutral-800/60 bg-neutral-950/70">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/TA Logo.png" alt="Logo" className="h-9 w-auto object-contain" />
            <span className="text-lg font-semibold tracking-wide">Tascosa Audio</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
            <NavLink href="#services">Services</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#about">About</NavLink>
            <NavLink href="#contact">Contact</NavLink>
          </div>
        </nav>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,100,0,0.08),transparent_50%)]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                  Audio solutions <br />
                  <span className="text-tascosa-orange">made simple.</span>
                </h1>
                <p className="text-neutral-400 text-lg max-w-md leading-relaxed">
                  Professional DJ services and expert audio troubleshooting for the Texas Panhandle and beyond.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="#services" className="bg-tascosa-orange text-black font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-transform">
                    See Services
                  </a>
                  <a href="#pricing" className="bg-neutral-900 border border-neutral-700 px-8 py-4 rounded-2xl hover:bg-neutral-800 transition-colors">
                    See Pricing
                  </a>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-tascosa-orange to-orange-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative aspect-[4/3] rounded-3xl border border-neutral-800 bg-neutral-900 overflow-hidden shadow-2xl">
                  <img src="/Lights.jpg" alt="Setup" className="h-full w-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION - Simplified Grid */}
        <section id="pricing" className="py-24 border-t border-neutral-900 bg-neutral-950">
          <div className="mx-auto max-w-7xl px-4 text-center mb-12">
            <h2 className="text-4xl font-bold">DJ Packages</h2>
            <p className="text-neutral-400 mt-4">Transparent pricing, no hidden fees.</p>
          </div>
          
          <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-3 gap-8">
            {/* Using a Map here is much cleaner than writing 3 divs */}
            {[
              { tier: "Private Party", price: "$600", features: ["Wireless mic", "Dance lighting", "4 Hour Set"] },
              { tier: "Wedding Reception", price: "$900", features: ["Up to 4 hours", "Dinner Music", "Wireless mic"], highlight: false },
              { tier: "Full Service", price: "$1250", features: ["Up to 6 hours", "Ceremony + Reception", "Full Audio/Visual"], highlight: true }
            ].map((p) => (
              <div key={p.tier} className={`p-8 rounded-3xl border ${p.highlight ? 'border-tascosa-orange ring-1 ring-tascosa-orange' : 'border-neutral-800'} bg-neutral-900/50 flex flex-col justify-between`}>
                <div>
                  <h3 className="text-xl font-bold">{p.tier}</h3>
                  <div className="text-3xl font-black mt-2 text-tascosa-orange">{p.price}</div>
                  <ul className="mt-6 space-y-3 text-sm text-neutral-400">
                    {p.features.map(f => <li key={f} className="flex items-center gap-2">✓ {f}</li>)}
                  </ul>
                </div>
                <button 
                  onClick={() => jumpToContactWith("DJ Services", p.tier)}
                  className={`mt-8 w-full py-3 rounded-xl font-bold transition-all ${p.highlight ? 'bg-tascosa-orange text-black' : 'bg-neutral-800 hover:bg-neutral-700'}`}
                >
                  Choose Package
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-24 bg-neutral-900/30">
          <div className="mx-auto max-w-3xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold">Request a Quote</h2>
              <p className="text-neutral-400 mt-4">Fill out the form below and Andy will get back to you within 24 hours.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900 border border-neutral-800 p-8 rounded-3xl">
              <div className="grid md:grid-cols-2 gap-6">
                <FormInput label="Full Name" name="name" value={form.name} onChange={handleChange} required />
                <FormInput label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormInput label="Phone Number" name="phone" value={form.phone} onChange={handleChange} />
                <div className="w-full">
                  <label className="block text-xs font-medium text-neutral-400 mb-1 ml-1">Service Type</label>
                  <select 
                    name="service" 
                    value={form.service} 
                    onChange={handleChange}
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:ring-2 focus:ring-tascosa-orange focus:outline-none"
                  >
                    <option>DJ Services</option>
                    <option>Diagnostic & Repair</option>
                  </select>
                </div>
              </div>

              <div className="w-full">
                <label className="block text-xs font-medium text-neutral-400 mb-1 ml-1">Message</label>
                <textarea
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:ring-2 focus:ring-tascosa-orange focus:outline-none"
                  placeholder="Tell us about your event..."
                />
              </div>

              <button
                type="submit"
                disabled={sent}
                className="w-full py-4 bg-tascosa-orange text-black font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {sent ? "Message Sent!" : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
