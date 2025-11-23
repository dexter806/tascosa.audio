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
      ...(name === "service" ? { package: "" } : {}) // reset package if service changes
    }));
  }

  // Preselect service/package and scroll to contact form
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur border-b border-neutral-800/60 bg-neutral-950/70">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-tascosa-orange to-rose-500 shadow-lg" />
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
                <p className="mt-5 text-neutral-300 text-lg max-w-prose">
                  Tascosa Audio provides professional DJ services
                  and troubleshooting &amp; setup support across the Texas Panhandle and beyond.
                </p>
                <div className="mt-8 flex gap-3">
                  <a href="#services" className="rounded-2xl px-5 py-3 bg-tascosa-orange text-black font-semibold shadow hover:bg-tascosa-orange">
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

              {/* Right image */}
              <div className="relative">
                <div className="aspect-[4/3] rounded-3xl border border-neutral-800 bg-neutral-900 shadow-xl overflow-hidden">
                  <img
                    src="/Lights.jpg" /* ensure exact filename & placed in /public */
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

        {/* SERVICES */}
        <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl md:text-4xl font-bold">Services</h2>
          <p className="mt-2 text-neutral-300">Pick what fits your need.</p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "DJ Services",
                desc: "Weddings, Private Parties, School Events.",
                items: ["Wireless mics", "Dance lighting", "MC Services"],
                href: "#dj-packages"
              },
              // {
              //   title: "PA Rentals",
              //   desc: "Birthdays, quinceañeras, reunions—bring the party.",
              //   items: ["Portable sound systems", "Mixers & microphones", "Delivery, setup, & tear down"],
              //   href: "#rentals"
              // },
              {
                title: "Diagnostic, Repair, Education",
                desc: "Get your system diagnosed, fixed, and learn how to keep it running.",
                items: ["On-site diagnostics & repair", "System setup & walkthrough", "Feedback & wiring fixes"],
                href: "#diagnostic"
              }
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow flex flex-col"
              >
                <div>
                  <h3 className="text-xl font-semibold">{card.title}</h3>
                  <p className="mt-2 text-neutral-300">{card.desc}</p>
                  <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc list-inside">
                    {card.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <a
                  href={card.href}
                  className="mt-6 inline-block rounded-xl px-4 py-2 bg-tascosa-orange text-black font-medium hover:bg-tascosa-orange"
                >
                  Go To Service
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-800">
          {/* DJ Services Header */}
          <div id="dj-packages">
            <h2 className="text-3xl md:text-4xl font-bold">DJ Services</h2>
            <p className="mt-2 text-neutral-300">
              Transparent base packages. All packages run until 12:00&nbsp;AM. Per-hour add-on available for the 6-hour package only.
            </p>
          </div>

          {/* DJ Packages Grid */}
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
              }
            ].map((p) => (
              <div
                key={p.tier}
                className={`rounded-3xl border ${
                  p.highlight ? "border-tascosa-orange" : "border-neutral-800"
                } bg-neutral-900 p-6 shadow-lg flex flex-col`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold">{p.tier}</h3>
                  <span className={`text-2xl font-extrabold ${p.highlight ? "text-tascosa-orange" : ""}`}>
                    {p.price}
                  </span>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc list-inside">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => jumpToContactWith("DJ Services", p.tier)}
                  className={`mt-6 inline-block rounded-xl px-4 py-2 ${
                    p.highlight
                      ? "bg-tascosa-orange text-black hover:bg-tascosa-orange"
                      : "border border-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  Choose
                </button>
              </div>
            ))}
          </div>

          {/* Diagnostic Header */}
          <div id="diagnostic" className="mt-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Diagnostic, Repair & Education</h2>
            <p className="mt-2 text-neutral-300">
              On-site troubleshooting, system optimization, and hands-on learning for venues, churches, and individuals.
            </p>
          </div>

          {/* Diagnostic Card */}
          <div className="mt-8 flex justify-center">
            <div className="rounded-3xl border border-tascosa-orange bg-neutral-900 p-8 shadow-xl max-w-md text-center">
              <h3 className="text-2xl font-semibold text-tascosa-orange">Audio System Service</h3>
              <p className="mt-2 text-lg font-bold text-white">
                $100 per hour - first two hours <br />
                $50 per hour after two hours <br />
                (2-hour minimum)
              </p>
              <p className="mt-4 text-neutral-300 text-sm leading-relaxed">
                Comprehensive service covering diagnostics, small repairs, and personalized education. Perfect for improving
                your live sound setup or learning best practices for managing your own system.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc list-inside text-left inline-block">
                <li>On-site system diagnostics &amp; minor repairs</li>
                <li>Signal flow &amp; feedback troubleshooting</li>
                <li>Equipment setup &amp; wiring organization</li>
                <li>1-on-1 audio education &amp; best practices</li>
              </ul>
              <button
                type="button"
                onClick={() => jumpToContactWith("Diagnostic, Repair & Education")}
                className="mt-6 inline-block rounded-xl px-5 py-3 bg-tascosa-orange text-black font-semibold hover:bg-tascosa-orange"
              >
                Schedule Service
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs text-neutral-500 text-center">
            Travel fees may apply for locations outside Amarillo city limits.
          </p>
        </section>

        {/* ABOUT */}
        <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-800">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">About Tascosa Audio</h2>
              <p className="mt-4 text-neutral-300 leading-relaxed">
                We’re a proud, owner-operated audio company born and raised in Amarillo, Texas.
                Serving the Panhandle with years of event experience, we provide everything from crowd-reading
                DJs and full wedding receptions to parties, reunions, and community events.
                Already have your own gear? Our on-site troubleshooting and setup support will keep your sound running smoothly.
                With dependable equipment, clear communication, and local roots you can trust, Tascosa Audio makes audio solutions simple for every occasion.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc list-inside">
                <li>Knowledgeable staff for any situation</li>
                <li>Transparent pricing—no surprises</li>
                <li>On-time setup &amp; professional appearance</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 aspect-square overflow-hidden">
              <img
                src="/Party 2025.jpg" /* consider renaming to 'party-2025.jpg' (no space) */
                alt="DJ booth and lighting at a party"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-neutral-800">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Request a Quote</h2>
              <p className="mt-2 text-neutral-300">Tell us about your event. We’ll reply within 24 hours.</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    aria-label="Your name"
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                  />
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    inputMode="email"
                    required
                    placeholder="Email"
                    aria-label="Email"
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone"
                    aria-label="Phone"
                    inputMode="tel"
                    pattern="^[0-9()*#+.\\-\\s]{7,}$"
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                  />
                </div>

                {/* Service select */}
                <select
                  name="service"
                  value={form.service}
                  onChange={handleChange}
                  aria-label="Service"
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                >
                  <option>DJ Services</option>
                  <option>Diagnostic, Repair & Education</option>
                  {/* <option>Audio Rentals</option> */}
                </select>

                {/* Package select - only when DJ Services */}
                {form.service === "DJ Services" && (
                  <div className="mt-2">
                    <select
                      name="package"
                      value={form.package}
                      onChange={handleChange}
                      required
                      aria-label="DJ Package"
                      className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                    >
                      <option value="">Choose a DJ package…</option>
                      {DJ_PACKAGES.map(label => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Event details, venue, hours, special requests..."
                  aria-label="Event details"
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tascosa-orange"
                />

                <button
                  type="submit"
                  className="rounded-2xl px-5 py-3 bg-tascosa-orange text-black font-semibold shadow hover:bg-tascosa-orange disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={sent}
                >
                  {sent ? "Opening your email app..." : "Send Inquiry"}
                </button>

                {sent && (
                  <p className="text-sm text-emerald-400">
                    Thanks! Your email app should open with the details pre-filled.
                  </p>
                )}
              </form>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
              <h3 className="text-xl font-semibold">Business Info</h3>
              <ul className="mt-4 space-y-2 text-sm text-neutral-300">
                <li><strong>Service area:</strong> Amarillo, Lubbock, Texas Panhandle, Oklahoma, and New Mexico</li>
                <li><strong>Email:</strong> info@tascosaaudio.com</li>
                <li><strong>Hours:</strong> By appointment</li>
              </ul>
              <div className="mt-6 text-sm text-neutral-400" />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
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
