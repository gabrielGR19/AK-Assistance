import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const logoImage = "/logo-transparent.png";

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
    [0, 0.4, 0.7, 1],
    [win.startX, win.startX * 0.3, 0, 0]
  );
  const y = useTransform(
    scrollYProgress,
    [0, 0.4, 0.7, 0.9],
    [win.startY, win.startY * 0.3, 80, 80]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.4, 0.7, 0.9],
    [1, 0.82, 0.66, 0.66]
  );
  const fadeStart = 0.75 + (index / TOTAL) * 0.1;
  const fadeEnd = fadeStart + 0.08;
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

function LogoItem({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.5, 0.72], [0, 1]);
  const y = useTransform(scrollYProgress, [0.5, 0.72, 0.9], [500, 80, 80]);
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

function TaskbarItem({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  return (
    <motion.div
      style={{
        opacity,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 44,
        background: "rgba(30,30,30,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        paddingLeft: 8,
        gap: 4,
      }}
    >
      <div style={{ width: 44, height: 36, background: "#0078d4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 18, height: 18, border: "2px solid white" }} />
      </div>
      <div style={{ flex: 1 }} />
      <span style={{ color: "white", fontSize: 11, paddingRight: 12, fontFamily: "sans-serif" }}>12:34</span>
    </motion.div>
  );
}

function BlueBg({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0, 0.5, 0.72], [1, 1, 0]);
  return (
    <motion.div
      style={{
        opacity,
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #1565c0 0%, #1976d2 40%, #42a5f5 100%)",
      }}
    />
  );
}

function WhiteBg({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.5, 0.72], [0, 1]);
  return (
    <motion.div
      style={{ opacity, position: "absolute", inset: 0, background: "#ffffff" }}
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
    <div ref={containerRef} style={{ height: "300vh", position: "relative" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <BlueBg scrollYProgress={scrollYProgress} />
        <WhiteBg scrollYProgress={scrollYProgress} />

        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <TaskbarItem scrollYProgress={scrollYProgress} />

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
