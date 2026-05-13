import { useState, useEffect, useRef } from "react";
import logoUrl from "/logo.png";

const BOOKING_URL = "https://calendar.app.google/RcAojPDZwf15KeAD9";

function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    const elements = document.querySelectorAll(".animate-in");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function NavBar({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (v: boolean) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Vorteile", href: "#vorteile" },
    { label: "Wie es funktioniert", href: "#wie-es-funktioniert" },
    { label: "FAQ", href: "#faq" },
    { label: "Kontakt", href: "#kontakt" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        backgroundColor: scrolled
          ? darkMode ? "rgba(13,45,62,0.92)" : "rgba(240,246,250,0.92)"
          : "transparent",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <a href="#" className="flex items-center">
            <img src={logoUrl} alt="AK-Assistance" height={45} style={{ height: 45 }} />
          </a>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: "var(--muted-foreground)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: "var(--muted)",
                color: "var(--muted-foreground)",
              }}
              aria-label="Toggle dark/light mode"
            >
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm btn-orange"
            >
              Termin buchen
            </a>

            <button
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--muted)", color: "var(--foreground)" }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden px-4 pb-4 pt-2"
          style={{
            background: darkMode ? "rgba(13,45,62,0.97)" : "rgba(240,246,250,0.97)",
            backdropFilter: "blur(20px)",
          }}
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-base font-medium border-b"
              style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}
            >
              {link.label}
            </a>
          ))}
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center px-5 py-3 rounded-full text-sm btn-orange"
          >
            Termin buchen
          </a>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  const floatingIcons = [
    { cls: "hero-float", top: "12%", left: "8%", size: 52, opacity: 0.18 },
    { cls: "hero-float-2", top: "20%", right: "7%", size: 44, opacity: 0.14 },
    { cls: "hero-float-3", top: "55%", left: "5%", size: 38, opacity: 0.12 },
    { cls: "hero-float-4", bottom: "20%", right: "10%", size: 56, opacity: 0.16 },
    { cls: "hero-float-5", top: "35%", left: "18%", size: 32, opacity: 0.10 },
    { cls: "hero-float-6", top: "70%", right: "20%", size: 40, opacity: 0.13 },
  ];

  const icons = [
    // Document
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="32" height="40" rx="3" stroke="#e8622a" strokeWidth="2.5" fill="none"/>
      <line x1="16" y1="16" x2="32" y2="16" stroke="#e8622a" strokeWidth="2.5"/>
      <line x1="16" y1="24" x2="32" y2="24" stroke="#e8622a" strokeWidth="2.5"/>
      <line x1="16" y1="32" x2="24" y2="32" stroke="#e8622a" strokeWidth="2.5"/>
    </svg>,
    // Excel table
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="40" height="40" rx="3" stroke="#a0b4c0" strokeWidth="2.5" fill="none"/>
      <line x1="4" y1="16" x2="44" y2="16" stroke="#a0b4c0" strokeWidth="2"/>
      <line x1="4" y1="28" x2="44" y2="28" stroke="#a0b4c0" strokeWidth="2"/>
      <line x1="20" y1="16" x2="20" y2="44" stroke="#a0b4c0" strokeWidth="2"/>
      <line x1="32" y1="16" x2="32" y2="44" stroke="#a0b4c0" strokeWidth="2"/>
    </svg>,
    // Error window
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="40" height="32" rx="4" stroke="#e8622a" strokeWidth="2.5" fill="none"/>
      <circle cx="24" cy="26" r="7" stroke="#e8622a" strokeWidth="2.5"/>
      <line x1="21" y1="23" x2="27" y2="29" stroke="#e8622a" strokeWidth="2.5"/>
      <line x1="27" y1="23" x2="21" y2="29" stroke="#e8622a" strokeWidth="2.5"/>
    </svg>,
    // Ringing phone
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 8C10 8 14 12 14 20C14 28 10 32 10 32" stroke="#a0b4c0" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M36 16C38 18.5 39 22 39 24C39 26 38 28.5 36 31" stroke="#a0b4c0" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="18" y="10" width="12" height="28" rx="3" stroke="#a0b4c0" strokeWidth="2.5" fill="none"/>
      <circle cx="24" cy="34" r="2" fill="#a0b4c0"/>
    </svg>,
    // Clock
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" stroke="#e8622a" strokeWidth="2.5" fill="none"/>
      <polyline points="24 12 24 24 32 30" stroke="#e8622a" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>,
    // Calendar
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="36" height="32" rx="4" stroke="#a0b4c0" strokeWidth="2.5" fill="none"/>
      <line x1="6" y1="20" x2="42" y2="20" stroke="#a0b4c0" strokeWidth="2"/>
      <line x1="16" y1="6" x2="16" y2="14" stroke="#a0b4c0" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="32" y1="6" x2="32" y2="14" stroke="#a0b4c0" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="14" y="26" width="6" height="6" rx="1" fill="#a0b4c0"/>
      <rect x="28" y="26" width="6" height="6" rx="1" fill="#a0b4c0"/>
    </svg>,
  ];

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ paddingTop: "80px" }}
    >
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0d2d3e 0%, #0a2231 50%, #0f3347 100%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(232,98,42,0.08) 0%, transparent 70%)" }} />

      {floatingIcons.map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos.cls} pointer-events-none select-none`}
          style={{
            top: pos.top,
            bottom: pos.bottom,
            left: pos.left,
            right: pos.right,
            width: pos.size,
            height: pos.size,
            opacity: pos.opacity,
          }}
        >
          {icons[i]}
        </div>
      ))}

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="animate-in mb-6">
          <span className="section-label">Ihr Problem:</span>
        </div>

        <div className="animate-in delay-1 mb-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight" style={{ color: "var(--muted-foreground)" }}>
            Kein Anruf bleibt<br />unbeantwortet
          </h1>
        </div>

        <div className="animate-in delay-2 my-8">
          <div className="w-16 h-1 mx-auto rounded-full" style={{ background: "var(--primary)" }} />
        </div>

        <div className="animate-in delay-2 mb-4">
          <span className="section-label">Unsere Lösung:</span>
        </div>

        <div className="animate-in delay-3 mb-6">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
            Ihr{" "}
            <span className="orange-gradient-text">KI-Assistent</span>
            <br />übernimmt das
          </h2>
        </div>

        <div className="animate-in delay-3 mb-12">
          <p className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Rund um die Uhr erreichbar — damit Ihre Kunden immer jemanden erreichen, egal ob Sie auf der Baustelle sind oder Feierabend haben.
          </p>
        </div>

        <div className="animate-in delay-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-full text-base btn-orange"
          >
            Kostenloses Gespräch buchen
          </a>
          <button className="w-full sm:w-auto px-8 py-4 rounded-full text-base btn-outline flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Demo anhören
          </button>
        </div>
        {/* HERO ANIMATION - LottieFiles integration planned */}
      </div>

      <a
        href="#problem"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        style={{ color: "var(--muted-foreground)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <polyline points="19 12 12 19 5 12"/>
        </svg>
      </a>
    </section>
  );
}

function ProblemSection() {
  const cards = [
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.39 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
      text: "Sie sind auf der Baustelle — das Telefon klingelt — der Kunde legt auf",
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      ),
      text: "Ein Interessent ruft nach Feierabend an. Niemand geht ran. Er bucht beim Mitbewerber.",
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      text: "Terminvereinbarungen per Telefon kosten täglich wertvolle Arbeitszeit",
    },
  ];

  return (
    <section id="problem" className="py-24 sm:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label animate-in">Das Problem</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1">
            Kennen Sie das?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`animate-in delay-${i + 1} card-hover rounded-2xl p-8 flex flex-col items-start gap-5`}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(232,98,42,0.12)" }}
              >
                {card.icon}
              </div>
              <p className="text-lg leading-relaxed font-medium" style={{ color: "var(--foreground)" }}>
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LösungSection() {
  const features = [
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      ),
      headline: "Nimmt jeden Anruf sofort an",
      text: "Auf Deutsch, professionell, rund um die Uhr — kein Anruf geht verloren, egal wann Ihre Kunden anrufen.",
    },
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <circle cx="12" cy="16" r="2" fill="#e8622a"/>
        </svg>
      ),
      headline: "Bucht Termine direkt in Ihren Kalender",
      text: "Ohne Ihr Zutun — der Assistent koordiniert Termine, schickt Bestätigungen und hält Ihren Kalender aktuell.",
    },
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      headline: "Beantwortet Fragen sofort",
      text: "Zu Preisen, Verfügbarkeit und Services — genau so, wie Sie es eingestellt haben. Immer höflich, immer korrekt.",
    },
  ];

  return (
    <section
      id="vorteile"
      className="py-24 sm:py-32 px-4 sm:px-6"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <span className="section-label animate-in">Die Lösung</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1">
            Ihr KI-Assistent<br />übernimmt das
          </h2>
          <p className="mt-5 text-lg max-w-2xl mx-auto animate-in delay-2" style={{ color: "var(--muted-foreground)" }}>
            Speziell entwickelt für das Handwerk — einfach einzurichten, sofort einsatzbereit.
          </p>
        </div>

        <div className="space-y-12 md:space-y-20">
          {features.map((feat, i) => (
            <div
              key={i}
              className={`animate-in delay-${i + 1} flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-10 md:gap-16`}
            >
              <div className="flex-1">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                  style={{ background: "rgba(232,98,42,0.12)" }}
                >
                  {feat.icon}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
                  {feat.headline}
                </h3>
                <p className="text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {feat.text}
                </p>
              </div>
              <div
                className="flex-1 w-full rounded-3xl p-8 sm:p-10"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  minHeight: "200px",
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#e8622a" }} />
                  <div className="w-3 h-3 rounded-full opacity-50" style={{ background: "var(--muted-foreground)" }} />
                  <div className="w-3 h-3 rounded-full opacity-30" style={{ background: "var(--muted-foreground)" }} />
                </div>
                <div className="space-y-3">
                  {i === 0 && (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(232,98,42,0.2)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.39 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </div>
                        <div className="rounded-2xl rounded-tl-none px-4 py-3 text-sm" style={{ background: "var(--muted)", color: "var(--foreground)", maxWidth: "80%" }}>
                          Guten Tag! Sie rufen bei Maler Müller an. Wie kann ich Ihnen helfen?
                        </div>
                      </div>
                      <div className="flex items-start gap-3 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(160,180,192,0.2)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0b4c0" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div className="rounded-2xl rounded-tr-none px-4 py-3 text-sm" style={{ background: "rgba(232,98,42,0.15)", color: "var(--foreground)", maxWidth: "80%" }}>
                          Ich hätte gerne einen Termin für nächste Woche...
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(232,98,42,0.2)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.39 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </div>
                        <div className="rounded-2xl rounded-tl-none px-4 py-3 text-sm" style={{ background: "var(--muted)", color: "var(--foreground)", maxWidth: "80%" }}>
                          Perfekt! Ich buche Sie für Dienstag, 10 Uhr ein. Bestätigung kommt per SMS.
                        </div>
                      </div>
                    </>
                  )}
                  {i === 1 && (
                    <div className="space-y-2">
                      {["Mo 09:00 — Max M.", "Di 10:00 — Neue Anfrage ✓", "Di 14:30 — Sabine K.", "Mi 08:00 — Freie Zeit", "Do 11:00 — Neue Anfrage ✓"].map((item, j) => (
                        <div key={j} className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={{ background: item.includes("✓") ? "rgba(232,98,42,0.1)" : "var(--muted)", border: item.includes("✓") ? "1px solid rgba(232,98,42,0.25)" : "1px solid transparent" }}>
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.includes("✓") ? "#e8622a" : "rgba(160,180,192,0.4)" }} />
                          <span className="text-sm" style={{ color: item.includes("✓") ? "#e8622a" : "var(--muted-foreground)" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {i === 2 && (
                    <div className="space-y-3">
                      {[
                        { q: "Wie viel kostet ein Haarschnitt?", a: "Ein Herrenhaarschnitt beginnt ab 25 €. Für Damen ab 35 €." },
                        { q: "Haben Sie nächste Woche Termine?", a: "Ja! Dienstag und Donnerstag sind noch Plätze frei." },
                      ].map((item, j) => (
                        <div key={j} className="rounded-xl p-4" style={{ background: "var(--muted)" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>Kundenanfrage</p>
                          <p className="text-sm mb-2" style={{ color: "var(--foreground)" }}>{item.q}</p>
                          <div className="rounded-lg px-3 py-2" style={{ background: "rgba(232,98,42,0.1)", borderLeft: "3px solid #e8622a" }}>
                            <p className="text-sm" style={{ color: "var(--foreground)" }}>{item.a}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WieEsFunktioniertSection() {
  const steps = [
    {
      num: "01",
      title: "Kostenloses Gespräch",
      text: "Wir lernen Ihren Betrieb kennen — Ihre Leistungen, Kunden und Abläufe.",
    },
    {
      num: "02",
      title: "Einrichtung in kurzer Zeit",
      text: "Kein technisches Wissen nötig. Wir kümmern uns um alles — von der Einrichtung bis zum ersten Anruf.",
    },
    {
      num: "03",
      title: "Ihr Agent übernimmt",
      text: "Sie konzentrieren sich aufs Handwerk. Ihr KI-Assistent kümmert sich um den Rest.",
    },
  ];

  return (
    <section id="wie-es-funktioniert" className="py-24 sm:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <span className="section-label animate-in">So einfach geht's</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1">
            In 3 Schritten live
          </h2>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-[52px] left-[calc(16.666%+2rem)] right-[calc(16.666%+2rem)] h-0.5 timeline-line animate-in delay-1" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((step, i) => (
              <div key={i} className={`animate-in delay-${i + 1} flex flex-col items-center md:items-start text-center md:text-left`}>
                <div
                  className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center mb-6 font-black text-2xl"
                  style={{
                    background: "linear-gradient(135deg, #e8622a, #d4541e)",
                    color: "white",
                    boxShadow: "0 8px 32px rgba(232,98,42,0.4)",
                  }}
                >
                  {step.num}
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">{step.title}</h3>
                <p className="leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-16 animate-in">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base btn-orange"
          >
            Jetzt starten — kostenlos
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

function VorteileSection() {
  const items = [
    { icon: "🕐", label: "24/7 erreichbar", text: "Rund um die Uhr — auch am Wochenende und an Feiertagen." },
    { icon: "🇩🇪", label: "Auf Deutsch", text: "Natürliche, freundliche Sprache — keine Roboter-Stimme." },
    { icon: "⚡", label: "Sofort aktiv", text: "Kein Ausfall, keine Warteschleife — der Anruf wird sofort angenommen." },
    { icon: "📅", label: "Automatische Termine", text: "Direkte Kalender-Integration — ohne manuelle Nacharbeit." },
    { icon: "🔧", label: "Kein Technikwissen nötig", text: "Wir richten alles ein — Sie müssen nichts installieren oder konfigurieren." },
    { icon: "📊", label: "Volle Kontrolle", text: "Sie sehen jederzeit, welche Anrufe eingegangen sind und was besprochen wurde." },
  ];

  return (
    <section
      className="py-24 sm:py-32 px-4 sm:px-6"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label animate-in">Vorteile</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1">
            Warum AK-Assistance?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className={`animate-in delay-${(i % 3) + 1} card-hover rounded-2xl p-6`}
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-bold mb-2">{item.label}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "Für welche Betriebe ist AK-Assistance geeignet?",
      a: "Für alle Handwerksbetriebe und Dienstleister, die regelmäßig Anrufe erhalten — Reinigungsfirmen, Friseursalons, Kosmetikstudios, Fahrschulen, Maler, Elektriker und viele mehr.",
    },
    {
      q: "Muss ich technisches Wissen mitbringen?",
      a: "Nein. Wir übernehmen die gesamte Einrichtung. Sie brauchen nichts zu installieren oder zu konfigurieren. Nach dem Gespräch läuft alles automatisch.",
    },
    {
      q: "Was passiert, wenn der Assistent eine Frage nicht beantworten kann?",
      a: "Der Assistent leitet den Anruf an Sie weiter oder hinterlässt eine Nachricht, die Sie sobald wie möglich abhören können. Kein Anruf geht verloren.",
    },
    {
      q: "Wie lange dauert die Einrichtung?",
      a: "In der Regel ist Ihr KI-Assistent innerhalb weniger Tage nach dem ersten Gespräch einsatzbereit.",
    },
    {
      q: "Kann ich den Assistenten jederzeit anpassen?",
      a: "Ja. Wenn sich Ihre Leistungen, Preise oder Öffnungszeiten ändern, passen wir den Assistenten entsprechend an.",
    },
    {
      q: "Kostet das erste Gespräch etwas?",
      a: "Nein. Das erste Gespräch ist völlig kostenlos und unverbindlich. Wir lernen Ihren Betrieb kennen und erklären, wie AK-Assistance für Sie funktionieren kann.",
    },
  ];

  return (
    <section id="faq" className="py-24 sm:py-32 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label animate-in">FAQ</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1">
            Häufige Fragen
          </h2>
        </div>

        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item animate-in" style={{ borderColor: "var(--border)" }}>
              <button
                className="w-full flex items-center justify-between py-6 text-left gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-base sm:text-lg">{faq.q}</span>
                <div
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    background: open === i ? "rgba(232,98,42,0.15)" : "var(--muted)",
                    color: open === i ? "#e8622a" : "var(--muted-foreground)",
                    transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: open === i ? "300px" : "0", opacity: open === i ? 1 : 0 }}
              >
                <p className="pb-6 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section
      id="kontakt"
      className="py-24 sm:py-32 px-4 sm:px-6"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <span className="section-label animate-in">Jetzt starten</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 mb-6 tracking-tight animate-in delay-1">
          Bereit für Ihren<br />
          <span className="orange-gradient-text">KI-Assistenten?</span>
        </h2>
        <p className="text-lg mb-12 max-w-xl mx-auto leading-relaxed animate-in delay-2" style={{ color: "var(--muted-foreground)" }}>
          Buchen Sie ein kostenloses Gespräch. Kein Risiko, keine Verpflichtung — nur ein ehrliches Gespräch darüber, wie wir Ihnen helfen können.
        </p>
        <div className="animate-in delay-3">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-lg btn-orange"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Kostenloses Gespräch buchen
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer({ darkMode }: { darkMode: boolean }) {
  return (
    <footer className="py-12 px-4 sm:px-6" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="AK-Assistance" height={40} style={{ height: 40 }} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <a href="#vorteile" className="hover:text-white transition-colors">Vorteile</a>
            <a href="#wie-es-funktioniert" className="hover:text-white transition-colors">Wie es funktioniert</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#kontakt" className="hover:text-white transition-colors">Kontakt</a>
          </div>

          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-full text-sm btn-orange"
          >
            Termin buchen
          </a>
        </div>

        <div className="mt-8 pt-8 text-center text-sm" style={{ borderTop: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
          <p>© {new Date().getFullYear()} AK-Assistance. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("light", !darkMode);
  }, [darkMode]);

  useScrollAnimation();

  return (
    <div style={{ minHeight: "100vh" }}>
      <NavBar darkMode={darkMode} setDarkMode={setDarkMode} />
      <HeroSection />
      <ProblemSection />
      <LösungSection />
      <WieEsFunktioniertSection />
      <VorteileSection />
      <FAQSection />
      <CTASection />
      <Footer darkMode={darkMode} />
    </div>
  );
}
