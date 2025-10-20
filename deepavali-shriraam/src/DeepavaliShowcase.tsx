import React, { useEffect, useRef, useState } from "react";
import RamImageFX from "./RamImageFX";

type Slide = { src: string; caption: string };

const DEFAULT_SLIDES: Slide[] = [
  { src: "/assets/ram1.jpg", caption: "जय श्री राम" },
  { src: "/assets/ram2.jpg", caption: "श्री राम" },
  { src: "/assets/ram3.jpg", caption: "राम" },
  { src: "/assets/hanuman.jpg", caption: "जय बजरंगबली" },
];

type Props = {
  slides?: Slide[];
  autoPlay?: boolean;
  intervalMs?: number;
  fireworks?: boolean;
  sparkles?: boolean;
  showGreeting?: boolean;
};

// ---------------- Rotating multilingual greeting ----------------
const GREETINGS: string[] = [
  "Happy Deepavali",               // English
  "दीपोत्सव मंगलमयः",              // Sanskrit
  "ಶುಭ ದೀಪಾವಳಿ",                // Kannada
  "शुभ दीपावली",                  // Hindi
  "শুভ দীপাবলি",                  // Bengali
  "શુભ દિવાળી",                  // Gujarati
  "ശുഭ ദീപാവലി",                // Malayalam
  "శుభ దీపావళి",                  // Telugu
  "தீபாவளி நல்வாழ்த்துக்கள்",       // Tamil
  "ਦਿਵਾਲੀ ਦੀਆਂ ਮੁਬਾਰਕਾਂ",           // Punjabi
  "ଶୁଭ ଦୀପାବଳୀ",                 // Odia
  "दीपावली की शुभकामनाएँ",         // Hindi (alt)
];

const useInterval = (cb: () => void, delay: number | null) => {
  const saved = useRef(cb);
  useEffect(() => void (saved.current = cb), [cb]);
  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
};

const Dots: React.FC<{ count: number; index: number; onPick: (i: number) => void }> = ({
  count,
  index,
  onPick,
}) => {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onPick(i)}
          className={`h-2.5 w-2.5 rounded-full transition-all ${
            i === index ? "scale-125 bg-amber-400" : "bg-white/70"
          }`}
        />
      ))}
    </div>
  );
};

// Fading rotating greeting (dependency-free)
const RotatingGreeting: React.FC<{ intervalMs?: number }> = ({ intervalMs = 3200 }) => {
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(true);

  useInterval(() => {
    // quick cross-fade: fade out, switch text, fade in
    setFade(false);
    setTimeout(() => {
      setI((p) => (p + 1) % GREETINGS.length);
      setFade(true);
    }, 220);
  }, intervalMs);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 px-4 text-center">
      <h2
        className="font-extrabold tracking-wide text-white"
        style={{
          fontSize: "clamp(22px,4vw,46px)",
          textShadow: "0 0 14px rgba(255,210,120,.6)",
          transition: "opacity .22s ease",
          opacity: fade ? 1 : 0,
        }}
      >
        {/* Keep English + rotating local greeting */}
        {GREETINGS[i]}
      </h2>
    </div>
  );
};

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative mx-auto h-[72vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_60px_rgba(255,170,0,0.2)]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#111_0%,#000_45%)]" />
    {children}
  </div>
);

const Controls: React.FC<{ onPrev: () => void; onNext: () => void }> = ({ onPrev, onNext }) => (
  <div className="absolute inset-y-0 z-20 flex w-full items-center justify-between px-2">
    <button
      onClick={onPrev}
      className="rounded-full border border-amber-400/60 bg-black/30 p-2 text-white/90 backdrop-blur-sm hover:scale-105"
      aria-label="Previous"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    <button
      onClick={onNext}
      className="rounded-full border border-amber-400/60 bg-black/30 p-2 text-white/90 backdrop-blur-sm hover:scale-105"
      aria-label="Next"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  </div>
);

export default function DeepavaliShowcase({
  slides = DEFAULT_SLIDES,
  autoPlay = true,
  intervalMs = 5200,
  fireworks = true,
  sparkles = true,
  showGreeting = true,
}: Props) {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  const next = () => setIndex((p) => (p + 1) % total);
  const prev = () => setIndex((p) => (p - 1 + total) % total);

  useInterval(() => {
    if (autoPlay) next();
  }, autoPlay ? intervalMs : null);

  const slide = slides[index];

  return (
    <div className="w-full select-none">
      <Frame>
        {/* The FX component renders the layered effects over the image */}
        <RamImageFX
          key={slide.src} // forces a soft re-mount for clean transitions
          src={slide.src}
          caption={slide.caption}
          fireworks={fireworks}
          sparkles={sparkles}
        />
        <Controls onPrev={prev} onNext={next} />
        <Dots count={total} index={index} onPick={setIndex} />
        {showGreeting && <RotatingGreeting intervalMs={3200} />}
      </Frame>

      <div className="mt-2 text-center text-xs text-white/50">
        Built with ❤ using React + TypeScript (image FX)
      </div>
    </div>
  );
}
