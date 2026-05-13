import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const logoImage = "/logo.png";

const WINDOWS = [
  {
    url: "/imports/excel1.png",
    bg: "#e8f5e9",
    label: "Excel",
    title: "Excel - Datenanalyse.xlsx",
    startX: -240,
    startY: -80,
    width: 500,
    height: 350,
  },
  {
    url: "/imports/word.png",
    bg: "#e3f2fd",
    label: "Word",
    title: "Dokument1 - Word",
    startX: 220,
    startY: -60,
    width: 450,
    height: 320,
  },
  {
    url: "/imports/datev.png",
    bg: "#fff3e0",
    label: "DATEV",
    title: "DATEV - Prüfungsbericht",
    startX: -260,
    startY: 180,
    width: 480,
    height: 340,
  },
  {
    url: "/imports/docs.png",
    bg: "#fce4ec",
    label: "Google Docs",
    title: "Google Docs - Bericht",
    startX: 250,
    startY: 190,
    width: 520,
    height: 360,
  },
  {
    url: "/imports/kalender.png",
    bg: "#f3e5f5",
    label: "Kalender",
    title: "Kalender - März 2025",
    startX: 30,
    startY: -100,
    width: 420,
    height: 300,
  },
  {
    url: "/imports/excel2.png",
    bg: "#e0f7fa",
    label: "Excel 2",
    title: "Excel - Pivot-Tabelle.xlsx",
    startX: -80,
    startY: 200,
    width: 460,
    height: 330,
  },
];

const TOTAL = WINDOWS.length;

type WinData = (typeof WINDOWS)[number];

function WindowContent({ win }: { win: WinData }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: win.bg }}
    >
      <img
        src={win.url}
        alt={win.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      <span
        className="absolute text-lg font-bold"
        style={{ color: "rgba(0,0,0,0.25)", pointerEvents: "none" }}
      >
        {win.label}
      </span>
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
    [win.startY, win.startY * 0.3, 100, 100]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.4, 0.7, 0.9],
    [1, 0.8, 0.65, 0.65]
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
      <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-300">
        <div className="h-8 bg-white border-b border-gray-200 flex items-center justify-between px-3">
          <span className="text-xs text-gray-700 truncate">{win.title}</span>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <div className="w-3 h-3 rounded-full bg-red-500" />
          </div>
        </div>
        <div className="relative w-full h-[calc(100%-2rem)]">
          <WindowContent win={win} />
        </div>
      </div>
    </motion.div>
  );
}

function LogoItem({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.5, 0.7], [0, 1]);
  const y = useTransform(scrollYProgress, [0.5, 0.7, 0.9], [600, 100, 100]);

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
        zIndex: 50,
      }}
    >
      <img
        src={logoImage}
        alt="AK ASSISTANCE Logo"
        className="w-80 h-80 rounded-2xl shadow-2xl"
      />
    </motion.div>
  );
}

function TaskbarItem({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-12 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700/50 z-50"
      style={{ opacity }}
    >
      <div className="flex items-center h-full px-2 gap-1">
        <div className="w-12 h-9 bg-blue-600 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white" />
        </div>
        <div className="flex-1" />
        <div className="text-white text-xs px-3">12:34</div>
      </div>
    </motion.div>
  );
}

function BlueBgItem({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0, 0.5, 0.7], [1, 1, 0]);
  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"
      style={{ opacity }}
    />
  );
}

function WhiteBgItem({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0.5, 0.7], [0, 1]);
  return (
    <motion.div className="absolute inset-0 bg-white" style={{ opacity }} />
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
      <div className="sticky top-0 h-screen overflow-hidden">
        <BlueBgItem scrollYProgress={scrollYProgress} />
        <WhiteBgItem scrollYProgress={scrollYProgress} />

        <div className="relative w-full h-full">
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
