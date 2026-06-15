import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoUrl from "/logo.png";
import HeroAnimation from "./HeroAnimation";

const BOOKING_URL = "https://calendar.app.google/kdijYkWJyTSL5MA5A";

// ── Social Proof ──────────────────────────────────────────────────────────────
// Trage hier die aktuelle Anzahl der Betriebe ein, die AK-Assistance nutzen.
// null = Platzhalter-Hinweis anzeigen, kein öffentlicher Wert.
const SOCIAL_PROOF_COUNT: number | null = null;
// ─────────────────────────────────────────────────────────────────────────────

// ── Retell Demo ───────────────────────────────────────────────────────────────
// Wird automatisch über den API-Server konfiguriert (RETELL_API_KEY + RETELL_AGENT_ID).
// Solange der Server noch nicht antwortet, zeigt der Button einen Hinweis.
// ─────────────────────────────────────────────────────────────────────────────

function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );
    const elements = document.querySelectorAll(".animate-in");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ── Side Panel ─────────────────────────────────────────── */
const sidePanelContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } },
} as const;
const sidePanelItem = {
  hidden: { opacity: 0, x: 18 },
  show: { opacity: 1, x: 0 },
} as const;

function SidePanel({ open, onClose, darkMode }: { open: boolean; onClose: () => void; darkMode: boolean }) {
  const links = [
    { label: "Das Problem", id: "problem" },
    { label: "Die Lösung", id: "loesung" },
    { label: "Inbetriebnahme", id: "wie-es-funktioniert" },
    { label: "Kundenstimmen", id: "bewertungen" },
    { label: "Live Demo", id: "demo" },
    { label: "Pilot Programm", id: "pilot" },
    { label: "Team", id: "team" },
    { label: "News in der KI-Welt", id: "news" },
    { label: "FAQ", id: "faq" },
    { label: "Kontakt", id: "kontakt" },
  ];

  const scrollTo = (id: string) => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const navbarHeight = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - navbarHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }, 320);
  };

  return (
    <>
      <div className={`side-panel-overlay ${open ? "open" : ""}`} onClick={onClose} />
      <div
        className={`side-panel ${open ? "open" : ""}`}
        style={{
          background: darkMode ? "#0d2d3e" : "#ffffff",
          borderLeft: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        <motion.nav
          className="flex flex-col"
          variants={sidePanelContainer}
          initial="hidden"
          animate={open ? "show" : "hidden"}
        >
          {links.map((l) => (
            <motion.button
              key={l.id}
              variants={sidePanelItem}
              onClick={() => scrollTo(l.id)}
              className="text-left text-xl font-semibold"
              style={{
                color: "var(--foreground)",
                background: "none",
                border: "none",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                padding: "15px 0",
                transition: "color 0.2s ease, padding-left 0.2s ease",
              }}
              onHoverStart={(e) => {
                (e.target as HTMLElement).style.color = "#e8622a";
                (e.target as HTMLElement).style.paddingLeft = "6px";
              }}
              onHoverEnd={(e) => {
                (e.target as HTMLElement).style.color = "var(--foreground)";
                (e.target as HTMLElement).style.paddingLeft = "0px";
              }}
            >
              {l.label}
            </motion.button>
          ))}
        </motion.nav>

        <motion.div
          className="mt-auto pt-8"
          variants={sidePanelItem}
          initial="hidden"
          animate={open ? "show" : "hidden"}
          transition={{ delay: links.length * 0.055 + 0.1 }}
        >
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex w-full items-center justify-center px-6 py-3 rounded-full text-sm btn-orange"
          >
            Termin buchen
          </a>
        </motion.div>
      </div>
    </>
  );
}

/* ── Navigation ─────────────────────────────────────────── */
function NavBar({
  darkMode,
  setDarkMode,
  menuOpen,
  onMenuToggle,
}: {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // The hero animation background turns white at ~72% of its 300vh scroll range
    // = ~2.16 × window.innerHeight. Switch navbar to white slightly before that.
    const onScroll = () => {
      const threshold = window.innerHeight * 2.1;
      setScrolled(window.scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 transition-all duration-300"
        style={{
          zIndex: 200,
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          backgroundColor: scrolled
            ? darkMode ? "rgba(13,45,62,0.93)" : "rgba(255,255,255,0.93)"
            : "transparent",
          borderBottom: scrolled ? "1px solid var(--border)" : "none",
        }}
      >
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="#" className="flex items-center gap-2 sm:gap-3">
              <img
                src={logoUrl}
                alt="AK-Assistance Logo"
                style={{ height: 38, width: "auto", objectFit: "contain", flexShrink: 0 }}
              />
              <span style={{ fontWeight: 700, letterSpacing: "-0.01em", color: "var(--foreground)", fontSize: "clamp(0.9rem, 3.5vw, 1.1rem)", lineHeight: 1, whiteSpace: "nowrap" }}>
                AK-assistance
              </span>
            </a>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                aria-label="Toggle dark/light mode"
              >
                {darkMode ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-sm btn-orange"
            style={{ flexShrink: 0 }}
              >
                Termin buchen
              </a>

              <button
                onClick={onMenuToggle}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: "var(--muted)", color: "var(--foreground)" }}
                aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
              >
                <span className={`hamburger-icon ${menuOpen ? "open" : ""}`}>
                  <span className="hbar top" />
                  <span className="hbar mid" />
                  <span className="hbar bot" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

/* ── Landing Hero ───────────────────────────────────────── */
function LandingHero({ darkMode: _darkMode }: { darkMode: boolean }) {
  return (
    <section
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(80px, 18vw, 140px) 20px 60px",
        textAlign: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 760, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}
      >
        {/* Headline */}
        <h1
          style={{
            margin: 0,
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "clamp(1.85rem, 7vw, 4.2rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
            color: "var(--foreground)",
          }}
        >
          Ihr KI-Assistent für professionelle Kundenkommunikation
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{
            margin: 0,
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "clamp(1rem, 2.2vw, 1.25rem)",
            fontWeight: 400,
            lineHeight: 1.65,
            color: "var(--muted-foreground)",
            maxWidth: 600,
          }}
        >
          Der Assistent beantwortet Kundenanrufe, bucht Termine und entlastet Sie bei der Büroarbeit&nbsp;— automatisch, 24/7.
        </motion.p>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
        >
          {[
            {
              label: "DSGVO-konform",
              path: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
            },
            {
              label: "Made in Germany",
              path: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
            },
          ].map(({ label, path }) => (
            <span
              key={label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 14px",
                borderRadius: 100,
                border: "1px solid var(--border)",
                fontSize: "0.78rem",
                fontWeight: 600,
                fontFamily: "'Segoe UI', sans-serif",
                letterSpacing: "0.02em",
                color: "var(--muted-foreground)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d={path} />
              </svg>
              {label}
            </span>
          ))}
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.52 }}
          style={{
            margin: 0,
            fontSize: "0.85rem",
            fontFamily: "'Segoe UI', sans-serif",
            color: "var(--muted-foreground)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ display: "flex", gap: -4 }}>
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#e8622a">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </span>
          {SOCIAL_PROOF_COUNT
            ? `Bereits über ${SOCIAL_PROOF_COUNT} Betriebe vertrauen AK\u2011Assistance`
            : "Aktuell in der Pilotphase — seien Sie einer der Ersten"}
        </motion.p>
      </motion.div>
    </section>
  );
}

/* ── Hero ───────────────────────────────────────────────── */
function HeroSection({ darkMode }: { darkMode: boolean }) {
  return (
    <>
      {/* Scroll-driven animation — takes up 300vh of scroll space, starts behind navbar */}
      <HeroAnimation />

      {/* CTA buttons below the animation */}
      <motion.section
        className="py-16 px-4 sm:px-6"
        style={{ background: darkMode ? "#0d2d3e" : "#ffffff" }}
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-full text-base btn-orange"
          >
            Kostenloses Gespräch buchen
          </a>
        </div>
      </motion.section>
    </>
  );
}

/* ── Problem ─────────────────────────────────────────────── */
function ProblemSection() {
  const cards = [
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.39 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
      text: "Sie sind beschäftigt — das Telefon klingelt — der Kunde legt auf",
    },
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
      text: "Ein Interessent ruft nach Geschäftsschluss an. Niemand geht ran. Er bucht beim Mitbewerber.",
    },
    {
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      text: "Terminvereinbarungen per Telefon kosten täglich wertvolle Arbeitszeit",
    },
  ];

  return (
    <section id="problem" className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label animate-in">Das Problem</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1" style={{ color: "var(--foreground)" }}>
            Kennen Sie das?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`animate-in delay-${i + 1} card-hover rounded-2xl p-8 flex flex-col items-start gap-5`}
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(232,98,42,0.1)" }}>
                {card.icon}
              </div>
              <p className="text-base leading-relaxed font-medium" style={{ color: "var(--foreground)" }}>
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Lösung ─────────────────────────────────────────────── */
function LösungSection() {
  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      ),
      headline: "Nimmt jeden Anruf sofort an",
      text: "Auf Deutsch, professionell, rund um die Uhr — kein Anruf geht verloren.",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="12" cy="16" r="2" fill="#e8622a" />
        </svg>
      ),
      headline: "Bucht Termine direkt in Ihren Kalender",
      text: "Ohne Ihr Zutun — der Assistent koordiniert Termine automatisch.",
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      headline: "Beantwortet Fragen sofort",
      text: "Zu Verfügbarkeit, Services und mehr — genau so, wie Sie es eingestellt haben.",
    },
  ];

  return (
    <section id="loesung" className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--muted)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <span className="section-label animate-in">Die Lösung</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1" style={{ color: "var(--foreground)" }}>
            Ihr KI-Assistent<br />übernimmt das
          </h2>
        </div>

        <div className="space-y-8">
          {features.map((feat, i) => (
            <div
              key={i}
              className={`animate-in delay-${i + 1} rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6`}
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(232,98,42,0.1)" }}>
                {feat.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 tracking-tight" style={{ color: "var(--foreground)" }}>{feat.headline}</h3>
                <p className="leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{feat.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Wie es funktioniert ────────────────────────────────── */
function WieEsFunktioniertSection() {
  const steps = [
    { num: "01", title: "Kostenloses Gespräch", text: "Wir lernen Ihren Betrieb kennen — Ihre Leistungen und Abläufe." },
    { num: "02", title: "Einrichtung in kurzer Zeit", text: "Kein technisches Wissen nötig. Wir kümmern uns um alles." },
    { num: "03", title: "Ihr Agent übernimmt", text: "Sie konzentrieren sich auf Ihr Kerngeschäft. Ihr KI-Assistent kümmert sich um den Rest." },
  ];

  return (
    <section id="wie-es-funktioniert" className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <span className="section-label animate-in">So einfach geht's</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1" style={{ color: "var(--foreground)" }}>
            In 3 Schritten live
          </h2>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-[52px] left-[calc(16.666%+2rem)] right-[calc(16.666%+2rem)] h-0.5 timeline-connector animate-in delay-1" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((step, i) => (
              <div key={i} className={`animate-in delay-${i + 1} flex flex-col items-center md:items-start text-center md:text-left`}>
                <div
                  className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center mb-6 font-black text-2xl"
                  style={{ background: "linear-gradient(135deg, #e8622a, #d4541e)", color: "white", boxShadow: "0 8px 32px rgba(232,98,42,0.35)" }}
                >
                  {step.num}
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight" style={{ color: "var(--foreground)" }}>{step.title}</h3>
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
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Kundenbewertungen ──────────────────────────────────── */
const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=DEINE_PLACE_ID";

function BewertungenSection() {
  return (
    <section id="bewertungen" className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--muted)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label animate-in">Was unsere Kunden sagen</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1" style={{ color: "var(--foreground)" }}>
            Kundenstimmen
          </h2>
        </div>

        {/* Placeholder */}
        <div
          className="animate-in delay-1 rounded-2xl p-10 sm:p-14 text-center mb-12"
          style={{ background: "var(--card)", border: "1.5px dashed var(--border)" }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(232,98,42,0.1)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-lg font-semibold mb-3" style={{ color: "var(--foreground)" }}>
            Kundenstimmen folgen in Kürze
          </p>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--muted-foreground)", maxWidth: 520, margin: "0 auto" }}>
            Wir befinden uns aktuell in der Pilotphase. Als einer unserer ersten Partner tragen Sie dazu bei, diese Seite mit echten Erfahrungen zu füllen.
          </p>
        </div>

        {/* ProvenExpert Widget + Bewertungs-CTA */}
        <div
          className="animate-in delay-2 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)", padding: "40px 32px", textAlign: "center" }}
        >
          <div
            className="pe-richsnippets"
            data-page-url="https://www.provenexpert.com/de-de/ak-assistance/"
            data-size="large"
          />
          <div style={{ marginTop: 28 }}>
            <p style={{ margin: "0 0 20px", color: "var(--muted-foreground)", fontSize: "0.98rem" }}>
              Zufrieden mit AK-Assistance? Helfen Sie anderen Betrieben mit Ihrer Erfahrung.
            </p>
            <a
              href="https://www.provenexpert.com/de-de/ak-assistance/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base btn-orange"
            >
              Uns auf Proven Expert bewerten
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Demo ───────────────────────────────────────────────── */
function DemoSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch(
        "https://n8n.ak-assistance.de/webhook/api/demo-request",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        }
      );
      if (!res.ok) throw new Error();
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="demo" className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--muted)" }}>
      <div className="max-w-2xl mx-auto text-center">
        <span className="section-label animate-in">Demo</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 mb-6 tracking-tight animate-in delay-1" style={{ color: "var(--foreground)" }}>
          Testen Sie unseren<br />KI-Assistenten
        </h2>
        <p className="text-lg mb-10 max-w-lg mx-auto leading-relaxed animate-in delay-2" style={{ color: "var(--muted-foreground)" }}>
          Geben Sie Ihre E-Mail-Adresse ein und wir schicken Ihnen die Demo direkt zu.
        </p>

        {status === "success" ? (
          <div
            className="animate-in rounded-2xl p-10 flex flex-col items-center gap-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(232,98,42,0.12)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
              Ihre Anfrage ist eingegangen!
            </p>
            <p className="text-base leading-relaxed max-w-xs" style={{ color: "var(--muted-foreground)" }}>
              Vielen Dank — wir schicken Ihnen die Demo in Kürze per E-Mail zu. Schauen Sie auch in Ihren Spam-Ordner.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="animate-in delay-3"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: 440, margin: "0 auto" }}
          >
            <input
              type="email"
              placeholder="Ihre E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: status === "error" ? "1px solid #e53e3e" : "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--foreground)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center justify-center w-full btn-orange rounded-xl py-3.5 text-base font-semibold"
              style={{ opacity: status === "sending" ? 0.7 : 1, cursor: status === "sending" ? "wait" : "pointer" }}
            >
              {status === "sending" ? "Wird gesendet…" : "Demo anfordern"}
            </button>
            {status === "error" && (
              <p className="text-sm" style={{ color: "#e53e3e" }}>
                Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.
              </p>
            )}
          </form>
        )}

        {/*
          N8N WORKFLOW PLATZHALTER — DEMO E-MAIL
          Wenn jemand seine E-Mail eingibt:
          1. POST /api/demo-request empfängt die E-Mail
          2. n8n Workflow wird getriggert
          3. n8n verschickt HTML-E-Mail mit Link zu:
             https://ak-assistance-feedback.netlify.app
          TODO: n8n Webhook URL hier eintragen wenn bereit
        */}
      </div>
    </section>
  );
}

/* ── Pilot Programm ──────────────────────────────────────── */
function PilotSection() {
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState({ company: "", name: "", email: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState({ company: "", name: "", email: "", phone: "" });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const errors = { company: "", name: "", email: "", phone: "" };
    let valid = true;
    if (!fields.company.trim()) { errors.company = "Bitte geben Sie Ihren Unternehmensnamen ein."; valid = false; }
    if (!fields.name.trim()) { errors.name = "Bitte geben Sie Ihren Namen ein."; valid = false; }
    if (!fields.email.trim()) {
      errors.email = "Bitte geben Sie Ihre E-Mail-Adresse ein."; valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein."; valid = false;
    }
    if (!fields.phone.trim()) { errors.phone = "Bitte geben Sie Ihre Telefonnummer ein."; valid = false; }
    setFieldErrors(errors);
    if (!privacyAccepted) { setPrivacyError("Bitte stimmen Sie der Datenschutzerklärung zu."); valid = false; }
    else setPrivacyError("");
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Fehler beim Speichern");
      setStatus("success");
      setFields({ company: "", name: "", email: "", phone: "" });
      setPrivacyAccepted(false);
    } catch (_err) {
      setStatus("error");
      setErrorMsg("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt.");
    }
  }

  return (
    <section id="pilot" className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label animate-in">Exklusiv</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1" style={{ color: "var(--foreground)" }}>
            Pilot Programm
          </h2>
          <p className="mt-5 text-lg max-w-2xl mx-auto animate-in delay-2" style={{ color: "var(--muted-foreground)" }}>
            Wir suchen eine begrenzte Anzahl an Partnerbetrieben, die gemeinsam mit uns die Zukunft der Kundenkommunikation gestalten.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
          {[
            { title: "Persönliche Betreuung", text: "Direkte Zusammenarbeit mit unserem Team während der Einrichtungsphase." },
            { title: "Früher Zugang", text: "Als Pilot-Partner erhalten Sie als Erste neue Funktionen und Verbesserungen." },
            { title: "Keine Verpflichtung", text: "Testen Sie den Assistenten ohne langfristige Bindung." },
            { title: "Direktes Feedback", text: "Ihre Erfahrungen fließen direkt in die Produktentwicklung ein." },
          ].map((item, i) => (
            <div
              key={i}
              className={`animate-in delay-${(i % 2) + 1} rounded-2xl p-7 card-hover`}
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="w-2 h-2 rounded-full mb-4" style={{ background: "#e8622a" }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Application Form */}
        <div
          className="animate-in delay-3 rounded-2xl p-8 sm:p-10 max-w-2xl mx-auto"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {status === "success" ? (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(232,98,42,0.12)" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
                Vielen Dank!
              </h3>
              <p className="text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Ihre Bewerbung wurde eingereicht. Eine Bestätigung wurde an Ihre E-Mail-Adresse gesendet.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
                Jetzt bewerben
              </h3>
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Unternehmensname */}
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      Unternehmensname *
                    </label>
                    <input
                      id="company" name="company" type="text" value={fields.company} onChange={handleChange}
                      placeholder="Muster GmbH" aria-describedby={fieldErrors.company ? "err-company" : undefined}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${fieldErrors.company ? "#e53e3e" : "var(--border)"}`, background: "var(--background)", color: "var(--foreground)", fontSize: "0.95rem", outline: "none" }}
                    />
                    {fieldErrors.company && <p id="err-company" role="alert" className="text-xs mt-1" style={{ color: "#e53e3e" }}>{fieldErrors.company}</p>}
                  </div>
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      Vor- &amp; Nachname *
                    </label>
                    <input
                      id="name" name="name" type="text" value={fields.name} onChange={handleChange}
                      placeholder="Max Mustermann" aria-describedby={fieldErrors.name ? "err-name" : undefined}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${fieldErrors.name ? "#e53e3e" : "var(--border)"}`, background: "var(--background)", color: "var(--foreground)", fontSize: "0.95rem", outline: "none" }}
                    />
                    {fieldErrors.name && <p id="err-name" role="alert" className="text-xs mt-1" style={{ color: "#e53e3e" }}>{fieldErrors.name}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  {/* E-Mail */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      E-Mail-Adresse *
                    </label>
                    <input
                      id="email" name="email" type="email" value={fields.email} onChange={handleChange}
                      placeholder="max@musterfirma.de" aria-describedby={fieldErrors.email ? "err-email" : undefined}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${fieldErrors.email ? "#e53e3e" : "var(--border)"}`, background: "var(--background)", color: "var(--foreground)", fontSize: "0.95rem", outline: "none" }}
                    />
                    {fieldErrors.email && <p id="err-email" role="alert" className="text-xs mt-1" style={{ color: "#e53e3e" }}>{fieldErrors.email}</p>}
                  </div>
                  {/* Telefon */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      Telefonnummer *
                    </label>
                    <input
                      id="phone" name="phone" type="tel" value={fields.phone} onChange={handleChange}
                      placeholder="+49 123 456789" aria-describedby={fieldErrors.phone ? "err-phone" : undefined}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1px solid ${fieldErrors.phone ? "#e53e3e" : "var(--border)"}`, background: "var(--background)", color: "var(--foreground)", fontSize: "0.95rem", outline: "none" }}
                    />
                    {fieldErrors.phone && <p id="err-phone" role="alert" className="text-xs mt-1" style={{ color: "#e53e3e" }}>{fieldErrors.phone}</p>}
                  </div>
                </div>

                {/* DSGVO Checkbox */}
                <div className="mb-5">
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => { setPrivacyAccepted(e.target.checked); if (e.target.checked) setPrivacyError(""); }}
                      aria-describedby={privacyError ? "err-privacy" : undefined}
                      style={{ marginTop: 3, accentColor: "#e8622a", width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
                      <a href="#datenschutz" style={{ color: "#e8622a", textDecoration: "underline" }}>Datenschutzerklärung</a>{" "}
                      zu. *
                    </span>
                  </label>
                  {privacyError && <p id="err-privacy" role="alert" className="text-xs mt-1.5" style={{ color: "#e53e3e" }}>{privacyError}</p>}
                </div>

                {status === "error" && (
                  <p className="text-sm mb-4" style={{ color: "#e53e3e" }}>{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="flex w-full items-center justify-center btn-orange rounded-xl py-3.5 text-base font-semibold"
                  style={{ opacity: status === "sending" ? 0.7 : 1, cursor: status === "sending" ? "wait" : "pointer" }}
                >
                  {status === "sending" ? "Wird gesendet…" : "Bewerbung einreichen"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Unser Team ──────────────────────────────────────────── */
function TeamSection() {
  const values = [
    { icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", label: "Expertise", text: "Tiefes Fachwissen in KI, Automatisierung und den Anforderungen des deutschen Handwerks." },
    { icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", label: "Kundennähe", text: "Wir arbeiten eng mit unseren Partnerbetrieben zusammen und entwickeln Lösungen, die wirklich funktionieren." },
    { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "Vertrauen", text: "DSGVO-konform, Made in Germany — Ihre Daten bleiben sicher und in guten Händen." },
  ];

  const team = [
    { name: "Moritz Koch", title: "Co-Founder & KI-Strategie" },
    { name: "Gabriel Adam", title: "Co-Founder & Technologie" },
  ];

  return (
    <section id="team" className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--muted)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label animate-in">Das Team</span>
          <h2 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight animate-in delay-1" style={{ color: "var(--foreground)" }}>
            Hinter AK-Assistance
          </h2>
        </div>

        {/* Team Member Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {team.map((member, i) => (
            <div
              key={i}
              className={`animate-in delay-${i + 1} rounded-2xl p-8 flex flex-col items-center text-center gap-5`}
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              {/* FOTO MORITZ PLATZHALTER / FOTO GABRIEL PLATZHALTER */}
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "var(--muted)",
                  border: "2px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>{member.name}</h3>
                <p className="text-sm font-semibold" style={{ color: "#e8622a" }}>{member.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Unsere Geschichte */}
        <div
          className="animate-in delay-3 rounded-2xl p-8 mb-8"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid #e8622a",
          }}
        >
          <h3 className="text-xl font-bold mb-5" style={{ color: "var(--foreground)" }}>Unsere Geschichte</h3>
          <div className="text-sm leading-relaxed flex flex-col gap-4" style={{ color: "var(--muted-foreground)" }}>
            <p>
              AK-Assistance entstand aus einer persönlichen Erfahrung — und einer gemeinsamen Überzeugung.
            </p>
            <p>
              Wir haben aus nächster Nähe erlebt, was es bedeutet, einen Betrieb zu führen. Moritz' Mutter leitet ein Unternehmen und ist jeden Tag eine außergewöhnliche Unternehmerin. Aber statt sich auf das zu konzentrieren, was sie wirklich kann, verliert sie täglich wertvolle Zeit an Telefonate, Terminkoordination und bürokratische Abläufe, die längst automatisiert sein könnten.
            </p>
            <p>Dieses Bild hat uns nicht losgelassen.</p>
            <p>
              Wir kennen uns seit Jahren — verbunden durch eine echte Freundschaft und eine gemeinsame Leidenschaft für das, was Künstliche Intelligenz heute schon möglich macht. Als wir anfingen, uns ernsthaft damit zu beschäftigen, war uns schnell klar: Die Technologie existiert bereits. Was fehlt, ist jemand der sie dorthin bringt, wo sie wirklich gebraucht wird.
            </p>
            <p>
              Dienstleister aller Art sind das Rückgrat unserer Gesellschaft. Und trotzdem verbringen viele Unternehmer einen Großteil ihrer Zeit nicht mit dem, was sie großartig macht — sondern mit Aufgaben, die moderne Technologie heute längst übernehmen kann.
            </p>
            <p>
              Wir verkaufen kein simples Produkt. Wir gehen gemeinsam mit unseren Kunden einen Weg — persönlich, verlässlich und auf Augenhöhe. Jeder Betrieb ist anders, jeder Inhaber hat andere Bedürfnisse. Das nehmen wir ernst.
            </p>
            <p>
              Unsere Vision: In fünf Jahren haben wir Hunderten von Unternehmen in ganz Deutschland geholfen, effizienter zu arbeiten — damit sie sich wieder auf das konzentrieren können, was sie wirklich können.
            </p>
            <p className="pt-2 font-semibold" style={{ color: "var(--foreground)" }}>
              Moritz Koch &amp; Gabriel Adam — Gründer, AK-Assistance
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <div
              key={i}
              className={`animate-in delay-${i + 1} rounded-2xl p-7 flex flex-col gap-4`}
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(232,98,42,0.12)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={v.icon} />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold mb-1" style={{ color: "var(--foreground)" }}>{v.label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── News ────────────────────────────────────────────────── */

/*
  N8N WORKFLOW PLATZHALTER — BLOG POSTS
  n8n schickt wöchentlich neue Blogposts per POST an /api/blog
  Format (wenn bekannt):
  {
    id: number,
    date: string,
    category: string,
    title: string,
    excerpt: string,
    readTime: string,
    imageUrl?: string,
    link?: string
  }
  TODO: n8n Webhook hier anschließen wenn Format bekannt ist
*/
const BLOG_POSTS: {
  id: number;
  date: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  imageUrl?: string;
  link?: string;
}[] = [
  // → Hier werden automatisch neue Blog-Posts eingefügt ←
];

function BlogCard({ post }: { post: (typeof BLOG_POSTS)[number] }) {
  return (
    <article
      className="card-hover flex flex-col rounded-2xl overflow-hidden"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
    >
      {/* Cover-Bild oder Fallback-Verlauf */}
      <div
        style={{
          height: 160,
          flexShrink: 0,
          background: post.imageUrl
            ? `url(${post.imageUrl}) center/cover no-repeat`
            : "linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #42a5f5 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!post.imageUrl && (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        )}
      </div>

      {/* Inhalt */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(232,98,42,0.12)", color: "#e8622a" }}
          >
            {post.category}
          </span>
          <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            {post.date} · {post.readTime} Lesezeit
          </span>
        </div>
        <h3 className="text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>
          {post.title}
        </h3>
        <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--foreground-muted)" }}>
          {post.excerpt}
        </p>
        <a
          href={post.link ?? "#news"}
          target={post.link ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="text-sm font-semibold flex items-center gap-1 mt-1"
          style={{ color: "#e8622a" }}
        >
          Weiterlesen
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </article>
  );
}

function NewsSection() {
  const [apiPosts, setApiPosts] = useState<typeof BLOG_POSTS>([]);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data: { posts?: typeof BLOG_POSTS }) => {
        if (Array.isArray(data.posts)) setApiPosts(data.posts);
      })
      .catch(() => {/* silent — Fallback auf BLOG_POSTS */});
  }, []);

  const allPosts = [...apiPosts, ...BLOG_POSTS];
  const hasPosts = allPosts.length > 0;

  return (
    <section id="news" className="py-20 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
            style={{ background: "rgba(232,98,42,0.12)", color: "#e8622a" }}
          >
            Blog
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
            News in der KI-Welt
          </h2>
          <p className="text-base" style={{ color: "var(--muted-foreground)", maxWidth: 520 }}>
            Aktuelle Entwicklungen, Praxistipps und Branchentrends rund um Künstliche Intelligenz — speziell für Unternehmen und Dienstleister.
          </p>
        </div>

        {hasPosts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl flex flex-col items-center justify-center text-center py-14 px-8 gap-5"
            style={{ border: "1.5px dashed var(--border)", background: "var(--muted)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(232,98,42,0.1)" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-base mb-2" style={{ color: "var(--foreground)" }}>
                Beiträge folgen in Kürze
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)", maxWidth: 440 }}>
                Wir veröffentlichen regelmäßig neue Artikel rund um KI und Digitalisierung.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────── */
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    { q: "Für welche Betriebe ist AK-Assistance geeignet?", a: "Für alle Unternehmen und Dienstleister, die regelmäßig Anrufe erhalten und Termine vereinbaren." },
    { q: "Muss ich technisches Wissen mitbringen?", a: "Nein. Wir übernehmen die gesamte Einrichtung. Sie brauchen nichts zu installieren oder zu konfigurieren." },
    { q: "Was passiert, wenn der Assistent eine Frage nicht beantworten kann?", a: "Der Assistent leitet den Anruf weiter oder hinterlässt eine Nachricht. Kein Anruf geht verloren." },
    { q: "Wie lange dauert die Einrichtung?", a: "Wir kümmern uns um den gesamten Einrichtungsprozess. Nach dem ersten Gespräch stimmen wir alles gemeinsam ab und gehen erst live, wenn Sie vollständig zufrieden sind." },
    { q: "Kann ich den Assistenten jederzeit anpassen?", a: "Ja. Wenn sich Ihre Leistungen oder Öffnungszeiten ändern, passen wir den Assistenten entsprechend an." },
    { q: "Kostet das erste Gespräch etwas?", a: "Nein. Das erste Gespräch ist völlig kostenlos und unverbindlich." },
  ];

  return (
    <section id="faq" className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label animate-in">FAQ</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tight animate-in delay-1" style={{ color: "var(--foreground)" }}>
            Häufige Fragen
          </h2>
        </div>

        <div>
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item animate-in">
              <button
                className="w-full flex items-center justify-between py-5 text-left gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-base sm:text-lg" style={{ color: "var(--foreground)" }}>{faq.q}</span>
                <div
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    background: open === i ? "rgba(232,98,42,0.12)" : "var(--muted)",
                    color: open === i ? "#e8622a" : "var(--muted-foreground)",
                    transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: open === i ? "300px" : "0", opacity: open === i ? 1 : 0 }}
              >
                <p className="pb-5 leading-relaxed text-sm sm:text-base" style={{ color: "var(--muted-foreground)" }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section
      id="kontakt"
      className="py-24 sm:py-32 px-4 sm:px-6"
      style={{ background: "#0d2d3e" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <span className="section-label animate-in">Jetzt starten</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 mb-6 tracking-tight animate-in delay-1" style={{ color: "#ffffff" }}>
          Bereit für Ihren<br />KI-Assistenten?
        </h2>
        <p className="text-lg mb-12 max-w-xl mx-auto leading-relaxed animate-in delay-2" style={{ color: "#a0b4c0" }}>
          Kein langer Onboarding-Prozess, kein technisches Vorwissen nötig. Buchen Sie ein kostenloses Gespräch und sehen Sie, wie Ihr KI-Assistent Ihren Betrieb entlasten kann.
        </p>
        <div className="animate-in delay-3">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-lg btn-orange"
          >
            Kostenloses Gespräch buchen
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Cookie Banner ───────────────────────────────────────── */
function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("ak_cookie_choice")) setVisible(true);
  }, []);
  if (!visible) return null;
  const choose = (choice: "accepted" | "rejected") => {
    localStorage.setItem("ak_cookie_choice", choice);
    setVisible(false);
  };
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie-Einstellungen"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
        padding: "20px 24px", background: "#0d2d3e", color: "#fff",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.3)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <p style={{ margin: 0, flex: 1, fontSize: "0.88rem", lineHeight: 1.65, minWidth: 240 }}>
        Wir verwenden technisch notwendige Cookies. Weitere Informationen finden Sie in unserer{" "}
        <a href="#datenschutz" style={{ color: "#e8622a", textDecoration: "underline" }} onClick={() => setVisible(false)}>
          Datenschutzerklärung
        </a>.
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => choose("rejected")}
          style={{ padding: "9px 20px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600 }}
        >
          Ablehnen
        </button>
        <button
          onClick={() => choose("accepted")}
          className="inline-flex items-center justify-center btn-orange"
          style={{ padding: "9px 20px", borderRadius: 100, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", border: "none" }}
        >
          Akzeptieren
        </button>
      </div>
    </div>
  );
}

/* ── Impressum ───────────────────────────────────────────── */
function ImpressumSection() {
  const h3: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8622a", marginBottom: 8, marginTop: 28 };
  const p: React.CSSProperties = { color: "var(--muted-foreground)", lineHeight: 1.75, fontSize: "0.95rem" };
  return (
    <section id="impressum" style={{ background: "var(--background)", borderTop: "1px solid var(--border)", padding: "80px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--foreground)", marginBottom: 24 }}>Impressum</h2>

        <p style={h3}>Angaben gemäß § 5 DDG</p>
        <p style={p}>
          Gabriel Adam &amp; Moritz Koch<br />
          Gervinusstraße 14<br />
          90491 Nürnberg
        </p>

        <p style={h3}>Kontakt</p>
        <p style={p}>
          Telefon: 0163 6905809 (Gabriel Adam)<br />
          Telefon: 0173 7983151 (Moritz Koch)<br />
          E-Mail:{" "}
          <a href="mailto:gabrieladam@ak-assistance.de" style={{ color: "#e8622a", textDecoration: "underline" }}>
            gabrieladam@ak-assistance.de
          </a>
        </p>

        <p style={h3}>Inhaltlich Verantwortliche gemäß § 18 Abs. 2 MStV</p>
        <p style={p}>
          Gabriel Adam &amp; Moritz Koch, Gervinusstraße 14, 90491 Nürnberg
        </p>

        <p style={h3}>Hinweis zur Umsatzsteuer</p>
        <p style={p}>
          Die Umsatzsteuer-Identifikationsnummer wird nach Gewerbeanmeldung ergänzt.
        </p>
      </div>
    </section>
  );
}

/* ── Datenschutz ─────────────────────────────────────────── */
function DatenschutzSection() {
  const h2s: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 800, color: "var(--foreground)", marginTop: 36, marginBottom: 8 };
  const h3s: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 700, color: "var(--foreground)", marginTop: 20, marginBottom: 6 };
  const ps: React.CSSProperties = { color: "var(--muted-foreground)", lineHeight: 1.75, fontSize: "0.93rem", marginBottom: 10 };
  const ul: React.CSSProperties = { color: "var(--muted-foreground)", lineHeight: 1.75, fontSize: "0.93rem", paddingLeft: 20, marginBottom: 10 };
  return (
    <section id="datenschutz" style={{ background: "var(--muted)", borderTop: "1px solid var(--border)", padding: "80px 24px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--foreground)", marginBottom: 24 }}>Datenschutzerklärung</h2>

        <h3 style={h2s}>1. Datenschutz auf einen Blick</h3>
        <h4 style={h3s}>Allgemeine Hinweise</h4>
        <p style={ps}>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.</p>

        <h4 style={h3s}>Datenerfassung auf dieser Website</h4>
        <p style={ps}><strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.</p>
        <p style={ps}><strong>Wie erfassen wir Ihre Daten?</strong><br />Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben. Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).</p>
        <p style={ps}><strong>Wofür nutzen wir Ihre Daten?</strong><br />Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.</p>
        <p style={ps}><strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong><br />Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.</p>

        <h3 style={h2s}>2. Hosting</h3>
        <h4 style={h3s}>Hetzner</h4>
        <p style={ps}>Anbieter ist die Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen. Details entnehmen Sie der Datenschutzerklärung von Hetzner: <a href="https://www.hetzner.com/de/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{ color: "#e8622a" }}>https://www.hetzner.com/de/legal/privacy-policy/</a>.</p>
        <p style={ps}>Die Verwendung von Hetzner erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer möglichst zuverlässigen Darstellung unserer Website.</p>

        <h3 style={h2s}>3. Allgemeine Hinweise und Pflichtinformationen</h3>
        <h4 style={h3s}>Datenschutz</h4>
        <p style={ps}>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>

        <h4 style={h3s}>Hinweis zur verantwortlichen Stelle</h4>
        <p style={ps}>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
          Gabriel Adam &amp; Moritz Koch<br />
          Gervinusstraße 14, 90491 Nürnberg<br />
          Telefon: 0163 6905809 / 0173 7983151<br />
          E-Mail: <a href="mailto:gabrieladam@ak-assistance.de" style={{ color: "#e8622a" }}>gabrieladam@ak-assistance.de</a>
        </p>

        <h4 style={h3s}>Speicherdauer</h4>
        <p style={ps}>Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben.</p>

        <h4 style={h3s}>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h4>
        <p style={ps}>Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.</p>

        <h4 style={h3s}>Beschwerderecht bei der zuständigen Aufsichtsbehörde</h4>
        <p style={ps}>Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu.</p>

        <h4 style={h3s}>Recht auf Datenübertragbarkeit</h4>
        <p style={ps}>Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen.</p>

        <h4 style={h3s}>Auskunft, Berichtigung und Löschung</h4>
        <p style={ps}>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten.</p>

        <h4 style={h3s}>Recht auf Einschränkung der Verarbeitung</h4>
        <p style={ps}>Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Das Recht besteht in folgenden Fällen:</p>
        <ul style={ul}>
          <li>Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten Daten bestreiten.</li>
          <li>Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht.</li>
          <li>Wenn wir Ihre Daten nicht mehr benötigen, Sie sie jedoch zur Geltendmachung von Rechtsansprüchen benötigen.</li>
          <li>Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben.</li>
        </ul>

        <h3 style={h2s}>4. Datenerfassung auf dieser Website</h3>
        <h4 style={h3s}>Cookies</h4>
        <p style={ps}>Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert. Session-Cookies werden nach Ende Ihres Besuchs automatisch gelöscht.</p>
        <p style={ps}>Notwendige Cookies werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert. Der Websitebetreiber hat ein berechtigtes Interesse an der Speicherung von notwendigen Cookies zur technisch fehlerfreien und optimierten Bereitstellung seiner Dienste.</p>

        <h4 style={h3s}>Kontaktformular</h4>
        <p style={ps}>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO.</p>

        <h4 style={h3s}>Anfrage per E-Mail oder Telefon</h4>
        <p style={ps}>Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.</p>

        <p style={{ ...ps, marginTop: 32, fontSize: "0.82rem" }}>Quelle: <a href="https://www.e-recht24.de" target="_blank" rel="noopener noreferrer" style={{ color: "#e8622a" }}>e-recht24.de</a></p>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="py-10 px-4 sm:px-6" style={{ background: "#0d2d3e", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoUrl} alt="AK-Assistance Logo" style={{ height: 44 }} loading="lazy" />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: "#a0b4c0" }}>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#pilot" className="hover:text-white transition-colors">Pilot Programm</a>
            <a href="#kontakt" className="hover:text-white transition-colors">Kontakt</a>
            <a href="#impressum" className="hover:text-white transition-colors">Impressum</a>
            <a href="#datenschutz" className="hover:text-white transition-colors">Datenschutz</a>
            <a href="https://www.instagram.com/ak.assistance/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
            <a href="https://www.provenexpert.com/de-de/ak-assistance/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Proven Expert</a>
          </div>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm btn-orange"
          >
            Termin buchen
          </a>
        </div>
        <div className="mt-8 pt-6 text-center text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "#a0b4c0" }}>
          <p>© {new Date().getFullYear()} AK-Assistance. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}


/* ── App ─────────────────────────────────────────────────── */
export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const root = document.getElementById("root");
    if (root) root.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  useScrollAnimation();

  return (
    <>
      <SidePanel open={menuOpen} onClose={() => setMenuOpen(false)} darkMode={darkMode} />
      <NavBar darkMode={darkMode} setDarkMode={setDarkMode} menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((v) => !v)} />
      <LandingHero darkMode={darkMode} />
      <HeroSection darkMode={darkMode} />
      <ProblemSection />
      <LösungSection />
      <WieEsFunktioniertSection />
      <BewertungenSection />
      <DemoSection />
      <PilotSection />
      <TeamSection />
      <NewsSection />
      <FAQSection />
      <CTASection />
      <ImpressumSection />
      <DatenschutzSection />
      <Footer />

      {/* Floating "Bewerten Sie uns" tab — desktop only */}
      <div
        className="hidden md:block"
        style={{ position: "fixed", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 300 }}
      >
        <a
          href="https://www.provenexpert.com/de-de/ak-assistance/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="AK-Assistance auf Proven Expert bewerten"
          style={{
            display: "block",
            background: "#e8622a",
            color: "white",
            textDecoration: "none",
            padding: "14px 10px",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            borderRadius: "0 8px 8px 0",
            boxShadow: "2px 0 16px rgba(232,98,42,0.35)",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            whiteSpace: "nowrap",
          }}
        >
          ★ Bewerten Sie uns
        </a>
      </div>

      <CookieBanner />
    </>
  );
}
