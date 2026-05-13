import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const logoImage = "/logo.png";

const WINDOWS = [
  {
    url: "/imports/excel1.jpg",
    bg: "#f0f4e8",
    label: "Excel",
    title: "Excel - Datenanalyse.xlsx",
    startX: -280,
    startY: -100,
    width: 520,
    height: 340,
  },
  {
    url: "/imports/word.png",
    bg: "#e8f0fb",
    label: "Word",
    title: "Dokument1 - Word",
    startX: 240,
    startY: -80,
    width: 460,
    height: 320,
  },
  {
    url: "/imports/datev.gif",
    bg: "#fdf5e6",
    label: "DATEV",
    title: "DATEV - Prüfungsbericht",
    startX: -300,
    startY: 160,
    width: 500,
    height: 360,
  },
  {
    url: "/imports/docs.png",
    bg: "#fce4ec",
    label: "Google Docs",
    title: "Google Docs - Bericht",
    startX: 260,
    startY: 180,
    width: 480,
    height: 340,
  },
  {
    url: "/imports/kalender.png",
    bg: "#f5f0f8",
    label: "Kalender",
    title: "Kalender - März 2025",
    startX: 20,
    startY: -120,
    width: 540,
    height: 360,
  },
  {
    url: "/imports/excel2.jpg",
    bg: "#e0f4fa",
    label: "Tabelle",
    title: "Pivot-Tabelle.xlsx",
    startX: -60,
    startY: 190,
    width: 460,
    height: 320,
  },
];

const TOTAL = WINDOWS.length;
type WinData = (typeof WINDOWS)[number];

function WindowContent({ win }: { win: WinData }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: win.bg }}>
      <img
        src={win.url}
        alt={win.title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top left",
          display: "block",
        }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

function WindowItem({
  win,
  index,
  scrollYProgress,
}: {
  win: WinData;
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const x = useTransform(
    scrollYProgress,
    [0.28, 0.40, 0.52],
    [win.startX, win.startX * 0.3, 0]
  );
  const y = useTransform(
    scrollYProgress,
    [0.28, 0.40, 0.52],
    [win.startY, win.startY * 0.3, 80]
  );
  const scale = useTransform(
    scrollYProgress,
    [0.28, 0.40, 0.52],
    [1, 0.82, 0.66]
  );
  const fadeStart = 0.54 + (index / TOTAL) * 0.04;
  const fadeEnd = fadeStart + 0.04;
  const opacity = useTransform(
    scrollYProgress,
    [0.28, fadeStart, fadeEnd],
    [1, 1, 0]
  );

  return (
    <motion.div
      style={{
        x,
        y,
        scale,
        opacity,
        position: "absolute",
        left: "50%",
        top: "45%",
        translateX: "-50%",
        translateY: "-50%",
        width: win.width,
        height: win.height,
        zIndex: 10 + index,
        willChange: "transform, opacity",
      }}
      className="origin-center"
    >
      {/* Windows-style window chrome */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.2)",
          border: "1px solid rgba(0,0,0,0.18)",
        }}
      >
        {/* Windows title bar */}
        <div
          style={{
            height: "32px",
            background: "#f3f3f3",
            borderBottom: "1px solid #d0d0d0",
            display: "flex",
            alignItems: "center",
            paddingLeft: "12px",
            flexShrink: 0,
          }}
        >
          {/* App icon placeholder */}
          <div style={{
            width: 16, height: 16, marginRight: 6, flexShrink: 0,
            background: "#0078d4", borderRadius: "2px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 8, height: 8, border: "1.5px solid white", borderRadius: "1px" }} />
          </div>

          {/* Title */}
          <span style={{
            flex: 1,
            fontSize: "12px",
            fontWeight: 400,
            color: "#1a1a1a",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontFamily: "'Segoe UI', sans-serif",
          }}>
            {win.title}
          </span>

          {/* Windows control buttons */}
          <div style={{ display: "flex", height: "100%", flexShrink: 0 }}>
            {/* Minimize */}
            <div style={{
              width: 46, height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 10, height: 1, background: "#333" }} />
            </div>
            {/* Maximize */}
            <div style={{
              width: 46, height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 10, height: 10, border: "1px solid #333", borderRadius: "1px" }} />
            </div>
            {/* Close */}
            <div style={{
              width: 46, height: "100%",
              background: "#c42b1c",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <line x1="1" y1="1" x2="9" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="9" y1="1" x2="1" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* App content — fills remaining height */}
        <div style={{ width: "100%", height: "calc(100% - 32px)", overflow: "hidden" }}>
          <WindowContent win={win} />
        </div>
      </div>
    </motion.div>
  );
}

function ProblemLabel({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.28, 0.29, 0.48, 0.58], [1, 1, 1, 0]);
  return (
    <motion.div
      style={{
        opacity,
        position: "absolute",
        top: "50%",
        left: "50%",
        translateX: "-50%",
        translateY: "-50%",
        zIndex: 70,
        willChange: "opacity",
        textAlign: "center",
        pointerEvents: "none",
        width: "100%",
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "#000000",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(4px)",
          padding: "6px 24px 8px",
          borderRadius: "8px",
          textDecoration: "underline",
          textUnderlineOffset: "8px",
          textDecorationThickness: "3px",
          textDecorationColor: "rgba(0,0,0,0.5)",
        }}
      >
        Das Problem:
      </span>
    </motion.div>
  );
}

function SolutionLabel({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.76, 0.83], [0, 1]);
  return (
    <motion.div
      style={{
        opacity,
        position: "absolute",
        top: "24%",
        left: "50%",
        translateX: "-50%",
        zIndex: 70,
        willChange: "opacity",
        textAlign: "center",
        pointerEvents: "none",
        width: "100%",
      }}
    >
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--foreground)",
            lineHeight: 1,
          }}
        >
          Die Lösung
        </span>
        {/* Durchgehende Linie */}
        <div style={{
          width: "100%",
          height: "4px",
          background: "#e8622a",
          borderRadius: "2px",
        }} />
      </div>
    </motion.div>
  );
}

function LogoItem({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.64, 0.75], [0, 1]);
  const y = useTransform(scrollYProgress, [0.64, 0.75, 0.86], [500, 80, 80]);

  return (
    <motion.div
      style={{
        opacity,
        y,
        position: "absolute",
        left: "50%",
        top: "45%",
        translateX: "-50%",
        translateY: "-50%",
        zIndex: 60,
        willChange: "transform, opacity",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <img
        src={logoImage}
        alt="AK ASSISTANCE Logo"
        style={{
          width: 280,
          height: 280,
          borderRadius: "24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          flexShrink: 0,
        }}
      />
    </motion.div>
  );
}


function DasProblemIntro({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const bgOpacity = useTransform(scrollYProgress, [0, 0.20, 0.28], [1, 1, 0]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.14, 0.23], [1, 1, 0]);
  const textY = useTransform(scrollYProgress, [0.14, 0.28], [0, -24]);

  return (
    <motion.div
      style={{
        opacity: bgOpacity,
        position: "absolute",
        inset: 0,
        background: "#ffffff",
        zIndex: 80,
        willChange: "opacity",
        pointerEvents: "none",
      }}
    >
      <motion.div
        style={{
          opacity: textOpacity,
          y: textY,
          position: "absolute",
          top: "50%",
          left: "50%",
          translateX: "-50%",
          translateY: "-50%",
          textAlign: "center",
          willChange: "transform, opacity",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: "clamp(2.8rem, 7vw, 5rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "#0d2d3e",
            lineHeight: 1.05,
          }}
        >
          Das Problem
        </h2>
        {/* Orange underline */}
        <div
          style={{
            marginTop: 14,
            height: 5,
            borderRadius: 3,
            background: "#e8622a",
            width: "60%",
            marginInline: "auto",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

function BlueBg({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.28, 0.64, 0.75], [1, 1, 0]);
  return (
    <motion.div
      style={{
        opacity,
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #1565c0 0%, #1976d2 40%, #42a5f5 100%)",
        willChange: "opacity",
      }}
    />
  );
}

function WhiteBg({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.64, 0.75], [0, 1]);
  return (
    <motion.div
      style={{ opacity, position: "absolute", inset: 0, background: "#ffffff", willChange: "opacity" }}
    />
  );
}

export default function HeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef} style={{ height: "360vh", position: "relative" }}>
      {/* Preload all images to prevent jank on first scroll-in */}
      <div style={{ display: "none" }} aria-hidden="true">
        {WINDOWS.map((win) => (
          <img key={win.url} src={win.url} alt="" />
        ))}
        <img src={logoImage} alt="" />
      </div>

      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          transform: "translateZ(0)",
        }}
      >
        <BlueBg scrollYProgress={scrollYProgress} />
        <WhiteBg scrollYProgress={scrollYProgress} />
        <DasProblemIntro scrollYProgress={scrollYProgress} />

        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <SolutionLabel scrollYProgress={scrollYProgress} />
          {WINDOWS.map((win, index) => (
            <WindowItem
              key={index}
              win={win}
              index={index}
              scrollYProgress={scrollYProgress}
            />
          ))}

          <LogoItem scrollYProgress={scrollYProgress} />
        </div>
      </div>
    </div>
  );
}
