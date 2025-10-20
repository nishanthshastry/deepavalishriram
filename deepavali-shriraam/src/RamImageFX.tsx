import { useEffect, useRef } from "react";

/**
 * RamImageFX (no-blur edition)
 * - Removes the Gaussian-blur “bloom” layer entirely for a crisp, bright image.
 * - Keeps embers, optional sweep sheen, fireworks, vignette (tunable), caption pill.
 */

type FireworkPt = { x: string; y: string; delay?: number };
type FXOptions = {
  shimmerScale?: number;       // sweep intensity (1-12)
  vignetteStrength?: number;   // 0..1 (edge darkening; set 0 for none)
  showSweep?: boolean;         // animated light sweep
  emberCount?: number;         // # of floating embers
  hueMin?: number;             // ember hue range start
  hueMax?: number;             // ember hue range end
  fireworks?: FireworkPt[];    // custom fireworks positions
};

type Props = {
  src: string;
  caption?: string;
  fireworks?: boolean;
  sparkles?: boolean;
  options?: FXOptions;
};

export default function RamImageFX({
  src,
  caption = "जय श्री राम",
  fireworks = true,
  sparkles = true,
  options = {},
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tunables (no bloom here)
  const shimmerScale = options.shimmerScale ?? 8;
  const vignetteStrength = Math.max(0, Math.min(1, options.vignetteStrength ?? 0.6));
  const emberCount = options.emberCount ?? 80;
  const hueMin = options.hueMin ?? 35;
  const hueMax = options.hueMax ?? 60;
  const sweepOn = options.showSweep ?? false;

  /* ---------------- Embers canvas (prod-safe sizing) ---------------- */
  useEffect(() => {
    if (!sparkles) return;

    const host = frameRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let run = true;

    const DPR = Math.min(2, window.devicePixelRatio || 1);

    const setSize = () => {
      const r = host.getBoundingClientRect();
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      canvas.width = Math.max(1, Math.floor(r.width * DPR));
      canvas.height = Math.max(1, Math.floor(r.height * DPR));
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(host);

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; hue: number };
    const N = emberCount;
    const randHue = () => hueMin + Math.random() * (hueMax - hueMin);
    const ps: P[] = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.08 * DPR,
      vy: (-0.12 - Math.random() * 0.2) * DPR,
      r: (1 + Math.random() * 1.8) * DPR,
      a: 0.3 + Math.random() * 0.6,
      hue: randHue(),
    }));

    const tick = () => {
      if (!run) return;
      raf = requestAnimationFrame(tick);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";

      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        p.a -= 0.0008;

        if (p.y < -10 * DPR || p.a <= 0.02) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10 * DPR;
          p.a = 0.4 + Math.random() * 0.6;
          p.vx = (Math.random() - 0.5) * 0.08 * DPR;
          p.vy = (-0.12 - Math.random() * 0.2) * DPR;
          p.r = (1 + Math.random() * 1.8) * DPR;
          p.hue = randHue();
        }

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8 * DPR);
        g.addColorStop(0, `hsla(${p.hue},100%,72%,${0.8 * p.a})`);
        g.addColorStop(1, `hsla(${p.hue},100%,40%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 * DPR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${p.hue},100%,88%,${0.75 * p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    };

    tick();
    return () => {
      run = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [sparkles, emberCount, hueMin, hueMax]);

  /* ---------------- Subtle parallax tilt ---------------- */
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      el.style.setProperty("--tiltX", `${dy * -6}deg`);
      el.style.setProperty("--tiltY", `${dx * 6}deg`);
    };
    const onLeave = () => {
      el.style.setProperty("--tiltX", `0deg`);
      el.style.setProperty("--tiltY", `0deg`);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const fwPts: FireworkPt[] =
    options.fireworks && options.fireworks.length
      ? options.fireworks
      : [
          { x: "22%", y: "24%", delay: 0.2 },
          { x: "78%", y: "26%", delay: 0.7 },
        ];

  return (
    <div className="relative h-full w-full">
      {/* main frame */}
      <div
        ref={frameRef}
        className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
        style={{
          transform: "perspective(900px) rotateX(var(--tiltX,0deg)) rotateY(var(--tiltY,0deg))",
          transformStyle: "preserve-3d",
          boxShadow: "0 0 60px rgba(255,170,0,0.22)",
        }}
      >
        {/* Base (crisp) image */}
        <img
          src={src}
          alt={caption}
          className="absolute inset-0 h-full w-full object-contain"
          style={{
            zIndex: 3,
            // keep it bright WITHOUT blur
            filter: "brightness(1.08) contrast(1.04) saturate(1.1)",
          }}
          loading="eager"
        />

        {/* Optional sweep sheen (no blur involved) */}
        {sweepOn && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              zIndex: 4,
              background:
                "linear-gradient(75deg, transparent 20%, rgba(255,230,170,0.16) 40%, rgba(255,255,255,0.22) 50%, rgba(255,230,170,0.16) 60%, transparent 80%)",
              mixBlendMode: "screen",
              animation: `ram-sweep ${Math.max(2.5, 8 - shimmerScale * 0.5)}s linear infinite`,
            }}
          />
        )}

        {/* Embers */}
        {sparkles && (
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0"
            style={{ zIndex: 5 }}
          />
        )}

        {/* Fireworks */}
        {fireworks && (
          <div className="pointer-events-none absolute inset-0" style={{ zIndex: 6 }}>
            {fwPts.map((p, i) => (
              <Firework key={i} x={p.x} y={p.y} delay={p.delay ?? 0} />
            ))}
          </div>
        )}

        {/* Warm vignette (set vignetteStrength: 0 to disable) */}
        {vignetteStrength > 0 && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              zIndex: 7,
              background:
                `radial-gradient(60% 70% at 50% 45%, rgba(255,210,150,0.10) 0%, rgba(0,0,0,0) 55%),
                 radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,${0.35 * vignetteStrength}) 65%, rgba(0,0,0,${0.75 * vignetteStrength}) 100%)`,
              mixBlendMode: "multiply",
            }}
          />
        )}

        {/* Caption pill (no backdrop-blur; pure rgba background) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[8] flex justify-center">
          <span
            className="rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide text-amber-200"
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,200,120,0.55)",
              boxShadow: "0 0 18px rgba(255,190,120,0.32)",
            }}
          >
            {caption}
          </span>
        </div>

        {/* Letterbox background gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 1,
            background: "radial-gradient(circle at 20% 20%, #111 0%, #000 45%)",
          }}
        />
      </div>

      {/* Local keyframes */}
      <style>{`
        @keyframes ram-sweep {
          0%   { transform: translateX(-120%) skewX(-12deg); }
          100% { transform: translateX(120%)  skewX(-12deg); }
        }
        @keyframes ram-firework {
          0%   { transform: scale(0); opacity: 0.95; }
          70%  { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        @keyframes ram-spark-line {
          0%   { transform: scaleX(0); opacity: 1; }
          100% { transform: scaleX(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Firework element ---------------- */
function Firework({ x, y, delay = 0 }: { x: string; y: string; delay?: number }) {
  const LINES = 14;
  const lines = Array.from({ length: LINES }, (_, i) => i);

  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: 2,
        height: 2,
        transform: "translate(-50%, -50%)",
        animation: "ram-firework 1.6s ease-out infinite",
        animationDelay: `${delay}s`,
        filter: "drop-shadow(0 0 6px rgba(255,230,160,0.9))",
      }}
    >
      {lines.map((i) => {
        const ang = (i / LINES) * Math.PI * 2;
        const rot = (ang * 180) / Math.PI;
        return (
          <span
            key={i}
            className="absolute origin-left"
            style={{
              left: 0,
              top: 0,
              height: 2,
              width: 62,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,190,120,0.0))",
              transform: `rotate(${rot}deg)`,
              animation: "ram-spark-line 1.1s ease-out infinite",
              animationDelay: `${delay + 0.05 * (i % 3)}s`,
              willChange: "transform, opacity",
            }}
          />
        );
      })}
    </div>
  );
}
