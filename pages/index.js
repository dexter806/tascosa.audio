import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
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
      `Event Date: ${form.date}`,
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
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 shadow-lg" />
            <span className="text-lg font-semibold tracking-wide">Tascosa Audio</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
            <a href="#services" className="hover:text-white">Service
