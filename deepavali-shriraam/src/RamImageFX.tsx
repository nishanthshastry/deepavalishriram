import { useEffect, useRef, useState } from "react";

/**
 * RamImageFX — cinematic FX per slide (heat shimmer, bloom, embers, light sweep, pop fireworks).
 */

type FireworkPt = { x: string; y: string; delay?: number };
type FXOptions = {
  bloom?: number;
  shimmerScale?: number;
  vignetteStrength?: number;
  showSweep?: boolean;
  emberCount?: number;
  hueMin?: number;
  hueMax?: number;
  fireworks?: FireworkPt[];
};

type Props = {
  src: string;
  caption?: string;
  fireworks?: boolean;
  sparkles?: boolean;
  options?: FXOptions;
};

const W = 1280;
const H = 720;

export default function RamImageFX({
  src,
  caption = "जय श्री राम",
  fireworks = true,
  sparkles = true,
  options = {},
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bloom = options.bloom ?? 6;
  const shimmerScale = options.shimmerScale ?? 8;
  const vignetteStrength = options.vignetteStrength ?? 1;
  const emberCount = options.emberCount ?? 80;
  const hueMin = options.hueMin ?? 35;
  const hueMax = options.hueMax ?? 60;
  const sweepOn = options.showSweep ?? false;

  // Embers / sparkles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let run = true;
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
    };
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

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

    const draw = () => {
      if (!run) return;
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";

      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.a -= 0.0008;
        if (p.y < -10 * DPR || p.a <= 0.02) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10 * DPR;
          p.a = 0.4 + Math.random() * 0.6;
          p.vx = (Math.random() - 0.5) * 0.08 * DPR;
          p.vy = (-0.12 - Math.random() * 0.2) * DPR;
          p.r = (1 + Math.random() * 1.8) * DPR;
          p.hue = randHue();
        }
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8 * DPR);
        grad.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${0.8 * p.a})`);
        grad.addColorStop(1, `hsla(${p.hue}, 100%, 40%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 * DPR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `hsla(${p.hue},100%,85%,${0.8 * p.a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    draw();
    return () => {
      run = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [emberCount, hueMin, hueMax]);

  // Parallax tilt
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      el.style.setProperty("--tiltX", `${dy * -6}deg`);
      el.style.setProperty("--tiltY", `${dx * 6}deg`);
      el.style.setProperty("--parX", `${dx * 8}px`);
      el.style.setProperty("--parY", `${dy * 8}px`);
    };
    const onLeave = () => {
      el.style.setProperty("--tiltX", `0deg`);
      el.style.setProperty("--tiltY", `0deg`);
      el.style.setProperty("--parX", `0px`);
      el.style.setProperty("--parY", `0px`);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      {/* Frame */}
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_80px_rgba(255,170,0,0.25)]"
        style={{ height: "72vh", perspective: "900px", transformStyle: "preserve-3d" }}
      >
        {/* God-ray / vignette background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              `radial-gradient(60% 60% at 45% 35%, rgba(255,174,0,${0.22*vignetteStrength}) 0%, rgba(255,136,0,${0.10*vignetteStrength}) 45%, rgba(0,0,0,0) 65%)`,
            mixBlendMode: "screen",
            transform: "translateZ(-40px)",
          }}
        />

        {/* Heat-shimmer + bloom image stack */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          style={{ transform: "rotateX(var(--tiltX)) rotateY(var(--tiltY))" }}
        >
          <defs>
            <filter id="heat" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="2" seed="3" result="noise">
                <animate attributeName="baseFrequency" dur="8s" values="0.006 0.012; 0.008 0.016; 0.006 0.012" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={shimmerScale} xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={bloom} result="b1" />
              <feMerge>
                <feMergeNode in="b1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <image href={src} x="0" y="0" width={W} height={H} filter="url(#heat)" />
          <image href={src} x="0" y="0" width={W} height={H} style={{ mixBlendMode: "screen", opacity: 0.85 }} filter="url(#bloom)" />

          {options.showSweep && <g style={{ mixBlendMode: "screen" }}><rect x="0" y="0" width={W} height={H} fill="transparent" /><Sweep /></g>}
        </svg>

        {/* Halo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(35% 35% at 48% 40%, rgba(255,220,160,.25) 0%, rgba(255,160,50,.18) 35%, rgba(0,0,0,0) 70%)",
            filter: "blur(16px)",
            mixBlendMode: "screen",
            transform: "translateZ(-30px)",
          }}
        />

        {/* Embers */}
        {sparkles && <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ transform: "translateZ(10px)" }} />}

        {/* Firework pops */}
        {fireworks && (
          <div className="pointer-events-none absolute inset-0">
            {(options.fireworks ?? [
              { x: "15%", y: "22%", delay: 0.2 },
              { x: "78%", y: "25%", delay: 0.6 },
              { x: "62%", y: "14%", delay: 1.0 },
            ]).map((p, i) => <Pop key={i} x={p.x} y={p.y} delay={p.delay} />)}
          </div>
        )}

        {/* Caption chip */}
        <div className="absolute bottom-4 left-0 right-0 text-center" style={{ transform: "translateZ(20px)" }}>
          <div
            className="mx-auto inline-block rounded-full border border-amber-400/60 px-4 py-1.5 text-amber-200/95 backdrop-blur-sm"
            style={{ textShadow: "0 0 12px rgba(255,190,80,.7)" }}
          >
            {caption}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sweep() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0, dir = 1;
    const step = () => {
      raf = requestAnimationFrame(step);
      setT((p) => {
        let n = p + 0.005 * dir;
        if (n > 1 || n < 0) { dir *= -1; n = Math.max(0, Math.min(1, n)); }
        return n;
      });
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, []);
  const x = 200 + t * (W - 400);
  return (
    <g opacity={0.6}>
      <linearGradient id="sweepGrad" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="45%" stopColor="rgba(255,220,160,0.10)" />
        <stop offset="50%" stopColor="rgba(255,240,210,0.28)" />
        <stop offset="55%" stopColor="rgba(255,200,120,0.10)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <rect x={x - 180} y="0" width="360" height={H} fill="url(#sweepGrad)" />
    </g>
  );
}

function Pop({ x, y, delay = 0 }: { x: string; y: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t = 0, raf = 0;
    const go = () => {
      raf = requestAnimationFrame(go);
      t += 1 / 60;
      const phase = (t + (delay || 0) * 2) % 2.8;
      const s = phase < 0.3 ? phase / 0.3 : phase < 1.2 ? 1 : Math.max(0, 1.8 - phase);
      el.style.transform = `translate(-50%,-50%) scale(${s})`;
      el.style.opacity = `${s}`;
    };
    go();
    return () => cancelAnimationFrame(raf);
  }, [delay]);
  return (
    <div ref={ref} className="absolute" style={{ left: x, top: y }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const x2 = 60 + Math.cos(a) * 40;
          const y2 = 60 + Math.sin(a) * 40;
          return <line key={i} x1="60" y1="60" x2={x2} y2={y2} stroke="rgba(255,220,150,.95)" strokeWidth="2" strokeLinecap="round" />;
        })}
      </svg>
    </div>
  );
}
