import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import logoUrl from "/logo.png";
import HeroAnimation from "./HeroAnimation";

const BOOKING_URL = "https://calendar.app.google/RcAojPDZwf15KeAD9";

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
function SidePanel({ open, onClose, darkMode }: { open: boolean; onClose: () => void; darkMode: boolean }) {
  const links = [
    { label: "News in der KI-Welt", href: "#news" },
    { label: "FAQ", href: "#faq" },
    { label: "Pilot Programm", href: "#pilot" },
    { label: "Kontakt", href: "#kontakt" },
  ];

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
        <div className="flex justify-end mb-12">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
            aria-label="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="text-xl font-semibold py-4 border-b transition-colors"
              style={{ color: "var(--foreground)", borderColor: "var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e8622a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground)")}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto pt-8">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full px-6 py-3 rounded-full text-sm btn-orange"
          >
            Termin buchen
          </a>
        </div>
      </div>
    </>
  );
}

/* ── Navigation ─────────────────────────────────────────── */
function NavBar({
  darkMode,
  setDarkMode,
  onMenuOpen,
}: {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  onMenuOpen: () => void;
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
            <a href="#" className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="AK-Assistance"
                style={{ height: 55 }}
              />
              <span style={{ fontWeight: 700, letterSpacing: "-0.01em", color: "var(--foreground)", fontSize: "1.15rem" }}>
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
              >
                Termin buchen
              </a>

              <button
                onClick={onMenuOpen}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: "var(--muted)", color: "var(--foreground)" }}
                aria-label="Open menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

/* ── Landing Hero ───────────────────────────────────────── */
function LandingHero() {
  return (
    <section
      style={{
        height: "100vh",
        background: "linear-gradient(135deg, #1565c0 0%, #1976d2 40%, #42a5f5 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.10) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, zIndex: 1, textAlign: "center", padding: "0 24px" }}
      >
        {/* Logo */}
        <img
          src="/logo.png"
          alt="AK-Assistance Logo"
          style={{
            width: 120,
            height: 120,
            borderRadius: "22px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.30)",
          }}
        />

        {/* Name */}
        <div>
          <h1 style={{
            margin: 0,
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "clamp(2.6rem, 7vw, 5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#ffffff",
            lineHeight: 1.05,
            textShadow: "0 2px 24px rgba(0,0,0,0.18)",
          }}>
            AK-Assistance
          </h1>
        </div>

        {/* Catchphrase */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            margin: 0,
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "clamp(1.1rem, 3vw, 1.7rem)",
            fontWeight: 600,
            color: "rgba(255,255,255,0.88)",
            letterSpacing: "-0.01em",
          }}
        >
          100&nbsp;% Arbeit &nbsp;·&nbsp; 0&nbsp;% Verwaltung
        </motion.p>
      </motion.div>

      {/* Scroll-down arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        style={{
          position: "absolute",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          color: "rgba(255,255,255,0.65)",
          fontSize: "0.75rem",
          fontFamily: "'Segoe UI', sans-serif",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <span>Scrollen</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
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
            className="w-full sm:w-auto px-8 py-4 rounded-full text-base btn-orange"
          >
            Kostenloses Gespräch buchen
          </a>
          <button
            className="w-full sm:w-auto px-8 py-4 rounded-full text-base flex items-center justify-center gap-2"
            style={{
              background: darkMode ? "transparent" : "#e8622a",
              border: darkMode ? "1.5px solid rgba(255,255,255,0.6)" : "none",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Demo anhören
          </button>
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
    <section className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--background)" }}>
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
    <section className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--muted)" }}>
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
    <section className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--background)" }}>
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

/* ── Demo ───────────────────────────────────────────────── */
function DemoSection() {
  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--muted)" }}>
      <div className="max-w-3xl mx-auto text-center">
        <span className="section-label animate-in">Live testen</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 mb-6 tracking-tight animate-in delay-1" style={{ color: "var(--foreground)" }}>
          Testen Sie unseren<br />KI-Assistenten
        </h2>
        <p className="text-lg mb-12 max-w-xl mx-auto leading-relaxed animate-in delay-2" style={{ color: "var(--muted-foreground)" }}>
          Sprechen Sie direkt mit unserem KI-Assistenten und testen Sie die Fähigkeiten
        </p>

        <div className="animate-in delay-2 w-full max-w-md mx-auto rounded-2xl img-placeholder mb-12" style={{ height: "200px" }}>
          <span>[ Bild: Demo Screenshot ]</span>
        </div>

        <div className="animate-in delay-3 flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
            <div className="wave-ring" />
            <div className="wave-ring" />
            <div className="wave-ring" />
            <button
              className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center btn-orange"
              style={{ fontSize: 0 }}
              onClick={() => {
                /* RETELL AI DEMO AGENT - insert Retell AI agent ID here: */
                /* retellWebClient.startCall({ agentId: "YOUR_AGENT_ID_HERE" }) */
                alert("Retell AI Demo — Agent ID noch nicht konfiguriert.");
              }}
              aria-label="Demo starten"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
          <button
            className="px-10 py-4 rounded-full text-base btn-orange"
            onClick={() => {
              /* RETELL AI DEMO AGENT - insert Retell AI agent ID here: */
              /* retellWebClient.startCall({ agentId: "YOUR_AGENT_ID_HERE" }) */
              alert("Retell AI Demo — Agent ID noch nicht konfiguriert.");
            }}
          >
            Demo starten
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Pilot Programm ──────────────────────────────────────── */
function PilotSection() {
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const accessKey = import.meta.env.VITE_WEB3FORMS_KEY as string;

    const body = {
      access_key: accessKey,
      subject: `Neue Pilot-Bewerbung: ${fields.company}`,
      from_name: fields.name,
      replyto: fields.email,
      message: `Neue Bewerbung eingegangen:\n\nUnternehmen: ${fields.company}\nName: ${fields.name}\nE-Mail: ${fields.email}\nTelefon: ${fields.phone}`,
    };

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { success: boolean };
      if (!data.success) throw new Error("Submission failed");
      setStatus("success");
      setFields({ company: "", name: "", email: "", phone: "" });
    } catch (err) {
      console.error("Web3Forms error:", err);
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
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Unternehmensname *
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      required
                      value={fields.company}
                      onChange={handleChange}
                      placeholder="Muster GmbH"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                        color: "var(--foreground)",
                        fontSize: "0.95rem",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Vor- & Nachname *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={fields.name}
                      onChange={handleChange}
                      placeholder="Max Mustermann"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                        color: "var(--foreground)",
                        fontSize: "0.95rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      E-Mail-Adresse *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={fields.email}
                      onChange={handleChange}
                      placeholder="max@musterfirma.de"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                        color: "var(--foreground)",
                        fontSize: "0.95rem",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Telefonnummer *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={fields.phone}
                      onChange={handleChange}
                      placeholder="+49 123 456789"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                        background: "var(--background)",
                        color: "var(--foreground)",
                        fontSize: "0.95rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {status === "error" && (
                  <p className="text-sm mb-4" style={{ color: "#e53e3e" }}>
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full btn-orange rounded-xl py-3.5 text-base font-semibold"
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
  const members = [
    { name: "Team Mitglied 1", role: "Gründer & KI-Spezialist" },
    { name: "Team Mitglied 2", role: "Kundenbetreuung & Onboarding" },
  ];

  return (
    <section className="py-24 sm:py-32 px-4 sm:px-6" style={{ background: "var(--muted)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="section-label animate-in">Das Team</span>
          <h2 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight animate-in delay-1" style={{ color: "var(--foreground)" }}>
            Unser Team
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {members.map((m, i) => (
            <div
              key={i}
              className={`animate-in delay-${i + 1} rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5`}
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="img-placeholder shrink-0" style={{ width: 90, height: 90, borderRadius: "50%", fontSize: "0.75rem" }}>
                [ Foto ]
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{m.name}</h3>
                <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── News ────────────────────────────────────────────────── */

// ╔══════════════════════════════════════════════════════════════╗
// ║  AUTOMATISIERUNG: Blog-Posts hier eintragen                 ║
// ║  Jeder Eintrag hat: id, date, category, title,              ║
// ║  excerpt, readTime, imageUrl (optional), link (optional)    ║
// ╚══════════════════════════════════════════════════════════════╝
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
  const hasPosts = BLOG_POSTS.length > 0;

  return (
    <section id="news" className="py-20 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
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
          <p className="text-base" style={{ color: "var(--foreground-muted)", maxWidth: 520 }}>
            Aktuelle Entwicklungen, Praxistipps und Branchentrends rund um Künstliche Intelligenz — speziell für Unternehmen und Dienstleister.
          </p>
        </div>

        {hasPosts ? (
          /* Blog-Post Grid — wird befüllt sobald BLOG_POSTS Einträge enthält */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BLOG_POSTS.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          /* Platzhalter — wird ersetzt sobald erste Beiträge vorhanden sind */
          <div
            className="rounded-2xl flex flex-col items-center justify-center text-center py-16 px-8 gap-4"
            style={{ border: "1.5px dashed var(--border)", background: "var(--muted)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(232,98,42,0.1)" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="1.8">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-base mb-1" style={{ color: "var(--foreground)" }}>
                Beiträge folgen in Kürze
              </p>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                Hier werden regelmäßig neue Artikel rund um KI, Automatisierung und den digitalen Wandel im Handwerk veröffentlicht.
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
    { q: "Wie lange dauert die Einrichtung?", a: "In der Regel ist Ihr KI-Assistent innerhalb weniger Tage nach dem ersten Gespräch einsatzbereit." },
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
          Buchen Sie ein kostenloses Gespräch. Kein Risiko, keine Verpflichtung.
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

/* ── Footer ──────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="py-10 px-4 sm:px-6" style={{ background: "#0d2d3e", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoUrl} alt="AK-Assistance" style={{ height: 44 }} />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: "#a0b4c0" }}>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#pilot" className="hover:text-white transition-colors">Pilot Programm</a>
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
        <div className="mt-8 pt-6 text-center text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "#a0b4c0" }}>
          <p>© {new Date().getFullYear()} AK-Assistance. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Chatbot Widget ──────────────────────────────────────── */
function ChatbotWidget() {
  return (
    <button
      className="chatbot-btn"
      aria-label="KI-Assistent starten"
      onClick={() => {
        /* RETELL AI CHATBOT WIDGET - insert agent ID: YOUR_AGENT_ID_HERE */
        /* retellWebClient.startCall({ agentId: "YOUR_AGENT_ID_HERE" }) */
        alert("Retell AI — Agent ID noch nicht konfiguriert.");
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.39 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    </button>
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
      <NavBar darkMode={darkMode} setDarkMode={setDarkMode} onMenuOpen={() => setMenuOpen(true)} />
      <LandingHero />
      <HeroSection darkMode={darkMode} />
      <ProblemSection />
      <LösungSection />
      <WieEsFunktioniertSection />
      <DemoSection />
      <PilotSection />
      <TeamSection />
      <NewsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <ChatbotWidget />
    </>
  );
}
