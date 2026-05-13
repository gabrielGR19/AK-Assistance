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
    [0, 0.4, 0.62, 1],
    [win.startX, win.startX * 0.3, 0, 0]
  );
  const y = useTransform(
    scrollYProgress,
    [0, 0.4, 0.62, 0.8],
    [win.startY, win.startY * 0.3, 80, 80]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.4, 0.62, 0.8],
    [1, 0.82, 0.66, 0.66]
  );
  const fadeStart = 0.66 + (index / TOTAL) * 0.07;
  const fadeEnd = fadeStart + 0.06;
  const opacity = useTransform(
    scrollYProgress,
    [0, fadeStart, fadeEnd],
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
      {/* macOS-style window chrome */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.2)",
          border: "1px solid rgba(0,0,0,0.18)",
        }}
      >
        {/* macOS title bar */}
        <div
          style={{
            height: "28px",
            background: "linear-gradient(180deg, #ececec 0%, #d8d8d8 100%)",
            borderBottom: "1px solid #bbb",
            display: "flex",
            alignItems: "center",
            paddingLeft: "10px",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", border: "0.5px solid #e0443e" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e", border: "0.5px solid #dea123" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c940", border: "0.5px solid #1aab29" }} />
          <span
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "11px",
              fontWeight: 500,
              color: "#444",
              marginRight: "40px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontFamily: "-apple-system, sans-serif",
            }}
          >
            {win.title}
          </span>
        </div>

        {/* App content — fills remaining height */}
        <div style={{ width: "100%", height: "calc(100% - 28px)", overflow: "hidden" }}>
          <WindowContent win={win} />
        </div>
      </div>
    </motion.div>
  );
}

function ProblemLabel({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0, 0.02, 0.28, 0.42], [1, 1, 1, 0]);
  return (
    <motion.div
      style={{
        opacity,
        position: "absolute",
        top: "14%",
        left: "50%",
        translateX: "-50%",
        zIndex: 70,
        willChange: "opacity",
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "rgba(255,255,255,0.92)",
          textShadow: "0 2px 12px rgba(0,0,0,0.25)",
        }}
      >
        The Problem:
      </span>
    </motion.div>
  );
}

function SolutionLabel({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.66, 0.76], [0, 1]);
  return (
    <motion.div
      style={{
        opacity,
        position: "absolute",
        top: "22%",
        left: "50%",
        translateX: "-50%",
        zIndex: 70,
        willChange: "opacity",
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--foreground)",
          textShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        The Solution:
      </span>
    </motion.div>
  );
}

function LogoItem({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.5, 0.65], [0, 1]);
  const y = useTransform(scrollYProgress, [0.5, 0.65, 0.8], [500, 80, 80]);
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
        }}
      />
    </motion.div>
  );
}


function BlueBg({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0, 0.5, 0.65], [1, 1, 0]);
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
  const opacity = useTransform(scrollYProgress, [0.5, 0.65], [0, 1]);
  return (
    <motion.div
      style={{ opacity, position: "absolute", inset: 0, background: "var(--background)", willChange: "opacity" }}
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
    <div ref={containerRef} style={{ height: "260vh", position: "relative" }}>
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

        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <ProblemLabel scrollYProgress={scrollYProgress} />
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
