import React, { useEffect, useRef, useState } from "react";
import DeepavaliShowcase from "./DeepavaliShowcase";

// ---------- helpers ----------
const formatTime = (sec: number) => {
  if (!isFinite(sec)) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// ---------- audio controls (responsive/stacked on mobile) ----------
function AudioControls() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(0.6); // 0..1
  const [curr, setCurr] = useState(0);
  const [dur, setDur] = useState(NaN);

  useEffect(() => {
    const a = new Audio("/audio/ramlofi.mp3");
    a.loop = true;
    a.preload = "auto";

    a.muted = false;
    a.volume = vol;
    a.play()
      .then(() => { setMuted(false); setPlaying(true); })
      .catch(() => {
        a.muted = true;
        a.volume = 0;
        a.play().catch(() => {});
        setMuted(true);
        setPlaying(true);

        const unlock = () => {
          a.muted = false;
          a.volume = vol;
          a.play().catch(() => {});
          setMuted(false);
          window.removeEventListener("pointerdown", unlock);
          window.removeEventListener("keydown", unlock);
          window.removeEventListener("touchstart", unlock);
        };
        window.addEventListener("pointerdown", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
        window.addEventListener("touchstart", unlock, { once: true });
      });

    audioRef.current = a;

    const onMeta = () => { setDur(a.duration); setCurr(a.currentTime || 0); };
    const onTime = () => setCurr(a.currentTime || 0);
    const onEnded = () => setPlaying(false);

    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);

    const onVis = () => { if (!document.hidden) a.play().catch(() => {}); };
    document.addEventListener("visibilitychange", onVis);

    const tick = () => {
      if (audioRef.current) setCurr(audioRef.current.currentTime || 0);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (!audioRef.current) return;
      if (e.key.toLowerCase() === "m") toggleMute();
      else if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight") skip(10);
      else if (e.key === "ArrowLeft") skip(-10);
      else if (e.key === "ArrowUp") changeVol(Math.min(1, (audioRef.current.volume ?? vol) + 0.1));
      else if (e.key === "ArrowDown") changeVol(Math.max(0, (audioRef.current.volume ?? vol) - 0.1));
    };
    window.addEventListener("keydown", onKey);

    return () => {
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("keydown", onKey);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      a.pause();
      a.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play().catch(() => {}); setPlaying(true); }
    else { a.pause(); setPlaying(false); }
  };

  const skip = (deltaSec: number) => {
    const a = audioRef.current;
    if (!a) return;
    const duration = isFinite(a.duration) ? a.duration : Infinity;
    const target = Math.max(
      0,
      Math.min(isFinite(duration) ? duration : a.currentTime + deltaSec + 1, a.currentTime + deltaSec)
    );
    // @ts-ignore fastSeek where available
    if (typeof a.fastSeek === "function") a.fastSeek(target); else a.currentTime = target;
    if (a.paused) { a.play().catch(() => {}); setPlaying(true); }
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setMuted(a.muted);
    if (!a.muted) {
      a.volume = vol;
      if (a.paused) a.play().catch(() => {});
    }
  };

  const changeVol = (v: number) => {
    setVol(v);
    const a = audioRef.current;
    if (!a) return;
    a.volume = v;
    if (a.muted && v > 0) {
      a.muted = false;
      setMuted(false);
      a.play().catch(() => {});
    }
  };

  // --- UI: stacked on mobile, inline on ≥sm ---
  return (
    <div
      className="fixed inset-x-2 sm:inset-x-4 z-50"
      style={{ bottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto w-full max-w-full sm:max-w-5xl rounded-xl sm:rounded-2xl md:rounded-full border border-white/10 bg-black/60 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur shadow-lg">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3">
          {/* Transport row */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={togglePlay}
              className="rounded-full bg-amber-400/90 text-black text-sm font-semibold px-3 py-1.5 hover:scale-105"
              aria-label={playing ? "Pause audio" : "Play audio"}
              title={playing ? "Pause" : "Play"}
            >
              {playing ? "Pause ⏸" : "Play ▶️"}
            </button>
            <button
              onClick={() => skip(-10)}
              className="rounded-full bg-white/15 text-white text-sm font-semibold px-3 py-1.5 hover:scale-105"
              aria-label="Back 10 seconds"
              title="Back 10s (←)"
            >
              ⏪ -10s
            </button>
            <button
              onClick={() => skip(10)}
              className="rounded-full bg-white/15 text-white text-sm font-semibold px-3 py-1.5 hover:scale-105"
              aria-label="Forward 10 seconds"
              title="Forward 10s (→)"
            >
              ⏩ +10s
            </button>
          </div>

          {/* Volume row (mobile: second line) */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleMute}
              className="rounded-full bg-amber-400/90 text-black text-sm font-semibold px-3 py-1.5 hover:scale-105"
              aria-label={muted ? "Unmute" : "Mute"}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? "Unmute 🔊" : "Mute 🔇"}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">Vol</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(vol * 100)}
                onInput={(e) => changeVol(parseInt((e.target as HTMLInputElement).value, 10) / 100)}
                className="accent-amber-400 w-32 sm:w-40 md:w-48"
                aria-label="Volume"
                title="Volume"
              />
            </div>
          </div>

          {/* Time (mobile: bottom centered) */}
          <div className="flex items-center justify-center text-white/80">
            <span className="text-[11px] sm:text-xs tabular-nums">
              {formatTime(curr)} <span className="text-white/50">/</span> {formatTime(dur)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    // Full viewport, prevent scroll; audio is fixed; content uses available height.
    <div className="h-[100svh] bg-black text-white overflow-hidden">
      <div className="mx-auto h-full max-w-7xl px-2 sm:px-4 flex flex-col">
        <div className="pt-1 md:pt-3" />
        <div className="flex-1 min-h-0">
          <DeepavaliShowcase autoPlay fireworks showGreeting />
        </div>
      </div>
      <AudioControls />
    </div>
  );
}
