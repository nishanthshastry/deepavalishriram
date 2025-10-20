import React, { useEffect, useRef, useState } from "react";
import RamImageFX from "./RamImageFX";

type Slide = { src: string; caption: string; options?: any };

const DEFAULT_SLIDES: Slide[] = [
  { src: "/assets/ram1.jpg", caption: "जय श्री राम", options: { bloom: 10, shimmerScale: 10, showSweep: true, emberCount: 110 } },
  { src: "/assets/ram2.jpg", caption: "श्री राम",     options: { bloom: 12, shimmerScale: 6,  emberCount: 130, hueMin: 25, hueMax: 45 } },
  { src: "/assets/ram3.jpg", caption: "राम",          options: { bloom: 8,  shimmerScale: 12, emberCount: 90,  fireworks: [{ x: "65%", y: "20%", delay: 0.4 }] } },
  { src: "/assets/hanuman.jpg", caption: "जय बजरंगबली", options: { bloom: 9, shimmerScale: 8, emberCount: 80, vignetteStrength: 0.8 } },
  { src: "/assets/ram4.jpg", caption: "श्री राम • लक्ष्मण • हनुमान", options: { bloom: 7, shimmerScale: 6, emberCount: 70, fireworks: [{ x: "20%", y: "18%", delay: 0.2 }, { x: "80%", y: "22%", delay: 0.8 }], vignetteStrength: 0.7 } },
  { src: "/assets/ramsetu.jpg", caption: "जय श्री राम • सेतु निर्माण", options: { bloom: 11, shimmerScale: 5, emberCount: 140, hueMin: 30, hueMax: 55, showSweep: true } },
  { src: "/assets/ramsitawedding.jpg", caption: "सीता-राम विवाह", options: { bloom: 10, shimmerScale: 4, emberCount: 120, hueMin: 28, hueMax: 50 } },
  { src: "/assets/srljh.jpg", caption: "श्री राम • लक्ष्मण • जानकी • हनुमान", options: { bloom: 9, shimmerScale: 7, emberCount: 100 } },
];

type Props = {
  slides?: Slide[];
  autoPlay?: boolean;
  intervalMs?: number;
  fireworks?: boolean;
  sparkles?: boolean;
  showGreeting?: boolean;
};

// ---- Rotating multilingual greeting ----
const GREETINGS: string[] = [
  "Happy Deepavali",
  "शुभ दीपावली", "दीपोत्सव मंगलमयः",
  "শুভ দীপাবলি",
  "શુભ દિવાળી",
  "ಶುಭ ದೀಪಾವಳಿ",
  "ശുഭ ദീപാവലി",
  "శుభ దీపావళి",
  "தீபாவளி நல்வாழ்த்துக்கள்",
  "ਦਿਵਾਲੀ ਦੀਆਂ ਮੁਬਾਰਕਾਂ",
  "ଶୁଭ ଦୀପାବଳୀ",
  "दीपावली की शुभकामनाएँ",
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
}) => (
  <div className="flex items-center justify-center gap-2">
    {Array.from({ length: count }, (_, i) => (
      <button
        key={i}
        aria-label={`Go to slide ${i + 1}`}
        onClick={() => onPick(i)}
        className={`rounded-full transition-all h-2 w-2 sm:h-2.5 sm:w-2.5 ${
          i === index ? "scale-125 bg-amber-400" : "bg-white/70"
        }`}
      />
    ))}
  </div>
);

const RotatingGreeting: React.FC<{ intervalMs?: number }> = ({ intervalMs = 3200 }) => {
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(true);
  useInterval(() => {
    setFade(false);
    setTimeout(() => { setI((p) => (p + 1) % GREETINGS.length); setFade(true); }, 220);
  }, intervalMs);

  return (
    <h2
      className="font-extrabold tracking-wide text-white animate-fade-in"
      style={{
        fontSize: "clamp(22px,5vw,54px)",
        WebkitTextStroke: "0.5px rgba(0,0,0,.35)",
        textShadow: "0 0 14px rgba(255,210,120,.8), 0 0 30px rgba(255,170,50,.35)",
        transition: "opacity .3s ease",
        opacity: fade ? 1 : 0,
      }}
    >
      {GREETINGS[i]}
    </h2>
  );
};

// Frame: taller on phones so the caption chip inside RamImageFX never gets clipped;
// still shorter on larger screens so the fixed audio bar doesn’t cause page scroll.
const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="
      relative mx-auto w-full max-w-6xl overflow-hidden
      rounded-xl sm:rounded-2xl border border-white/10 bg-black
      shadow-[0_0_60px_rgba(255,170,0,0.2)]
      h-[70vh] xs:h-[68vh] sm:h-[64vh] md:h-[66vh] lg:h-[68vh]
      flex items-center justify-center
    "
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#111_0%,#000_45%)]" />
    {children}
  </div>
);

const Controls: React.FC<{ onPrev: () => void; onNext: () => void }> = ({ onPrev, onNext }) => (
  <div className="pointer-events-none absolute inset-y-0 z-20 flex w-full items-center justify-between px-2">
    <button
      onClick={onPrev}
      className="pointer-events-auto rounded-full border border-amber-400/60 bg-black/30 p-2 sm:p-2.5 text-white/90 backdrop-blur-sm hover:scale-105"
      aria-label="Previous"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
    <button
      onClick={onNext}
      className="pointer-events-auto rounded-full border border-amber-400/60 bg-black/30 p-2 sm:p-2.5 text-white/90 backdrop-blur-sm hover:scale-105"
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
  useInterval(() => { if (autoPlay) next(); }, autoPlay ? intervalMs : null);

  const slide = slides[index];

  return (
    <div className="w-full select-none">
      {/* Greeting ABOVE the frame */}
      {showGreeting && (
        <div className="sticky top-0 z-40 mb-2 sm:mb-3">
          <div className="mx-auto max-w-6xl px-2 sm:px-3 text-center">
            <RotatingGreeting intervalMs={3200} />
          </div>
        </div>
      )}

      {/* Main Image Showcase */}
      <Frame>
        <RamImageFX
          key={slide.src}
          {...({ src: slide.src, caption: slide.caption, fireworks, sparkles, options: slide.options } as any)}
        />
        <Controls onPrev={prev} onNext={next} />
      </Frame>

      {/* Dots OUTSIDE the frame (tight spacing on mobile) */}
      <div className="mt-1 sm:mt-2 mb-1 px-2">
        <Dots count={total} index={index} onPick={setIndex} />
      </div>

      {/* Footer text: compact on phones */}
      <div className="mt-0.5 sm:mt-2 text-center text-[10px] sm:text-xs text-white/50 px-3">
        Built using React + TypeScript (image FX)
      </div>
    </div>
  );
}
