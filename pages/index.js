import { useState } from "react";

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
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const subject = "Tascosa Audio Inquiry";
    const bodyLines = [
      "Hello Tascosa Audio,",
      "",
      "New inquiry:",
      "",
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Service: ${form.service}`,
      ...(form.package ? [`Package: ${form.package}`] : []),
      `Details: ${form.message}`
    ];
    const body = encodeURIComponent(bodyLines.join("\n"));
    const to = "info@tascosaaudio.com";
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.open(mailto, "_self");
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-tascosa-orange selection:text-black">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur border-b border-neutral-800/60 bg-neutral-950/70">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/TA Logo.png" alt="Logo" className="h-9 w-auto object-contain" />
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
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,100,0,0.06),transparent_60%)]" />
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
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-3xl border border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden">
                  <img src="/Lights.jpg" alt="Setup" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Services</h2>
            <p className="mt-4 text-neutral-300 text-lg">Professional audio solutions tailored to your event.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 flex flex-col justify-between hover:border-tascosa-orange/50 transition-all">
              <div>
                <h3 className="text-2xl font-bold">DJ Services</h3>
                <p className="mt-2 text-neutral-400 text-sm">Weddings, Private Parties, and School Events.</p>
                <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-tascosa-orange"></span>Professional MC Services</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-tascosa-orange"></span>Dance Lighting</li>
                </ul>
              </div>
              <a href="#dj-packages" className="mt-8 text-center rounded-xl py-3 bg-neutral-800 hover:bg-tascosa-orange hover:text-black font-bold transition-all">Explore Packages</a>
            </div>
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 flex flex-col justify-between hover:border-tascosa-orange/50 transition-all">
              <div>
                <h3 className="text-2xl font-bold">Diagnostic & Repair</h3>
                <p className="mt-2 text-neutral-400 text-sm">Get your system fixed and learn how to run it.</p>
                <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-tascosa-orange"></span>On-site Diagnostics</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-tascosa-orange"></span>System Walkthroughs</li>
                </ul>
              </div>
              <a href="#diagnostic" className="mt-8 text-center rounded-xl py-3 bg-neutral-800 hover:bg-tascosa-orange hover:text-black font-bold transition-all">Learn More</a>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-800">
          <div id="dj-packages" className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">DJ Services</h2>
            <p className="mt-4 text-neutral-300">Transparent base packages until 12:00 AM.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { t: "Private Party", p: "$600", f: ["DJ Service", "Dinner Music", "Dance lighting"] },
              { t: "Wedding Reception", p: "$900", f: ["Up to 4 hours", "Reception Music", "Wireless mic"] },
              { t: "Wedding Full Service", p: "$1250", f: ["Up to 6 hours", "Ceremony Music", "Full setup"], h: true }
            ].map((pkg) => (
              <div key={pkg.t} className={`p-8 rounded-3xl border ${pkg.h ? 'border-tascosa-orange bg-neutral-900' : 'border-neutral-800'} flex flex-col`}>
                <h3 className="text-xl font-bold">{pkg.t}
