import { useEffect, useRef, useState } from "react";
import DeepavaliShowcase from "./DeepavaliShowcase";

/* helpers */
// const formatTime = (sec: number) => {
//   if (!isFinite(sec)) return "--:--";
//   const m = Math.floor(sec / 60);
//   const s = Math.floor(sec % 60);
//   return `${m}:${s.toString().padStart(2, "0")}`;
// };

/* audio controls – compact on mobile, aligned on desktop */
function AudioControls() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(0.6);
  const [curr, setCurr] = useState(0);
  const [dur, setDur] = useState(NaN);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const a = new Audio("audio/ramlofi.mp3");
    a.loop = true;
    a.preload = "auto";
    a.muted = false;
    a.volume = vol;

    a.play()
      .then(() => {
        setMuted(false);
        setPlaying(true);
      })
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

    const onMeta = () => {
      setDur(a.duration);
      setCurr(a.currentTime || 0);
    };
    const onTime = () => setCurr(a.currentTime || 0);
    const onEnded = () => setPlaying(false);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnded);

    const tick = () => {
      if (audioRef.current)
        setCurr(audioRef.current.currentTime || 0);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Hide the hint after 10 seconds
    const timer = setTimeout(() => setShowHint(false), 10000);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      a.pause();
      a.src = "";
      audioRef.current = null;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => {});
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const skip = (d: number) => {
    const a = audioRef.current;
    if (!a) return;
    const duration = isFinite(a.duration) ? a.duration : Infinity;
    const target = Math.max(
      0,
      Math.min(isFinite(duration) ? duration : a.currentTime + d + 1, a.currentTime + d)
    );
    // @ts-ignore
    if (typeof a.fastSeek === "function") a.fastSeek(target);
    else a.currentTime = target;
    if (a.paused) {
      a.play().catch(() => {});
      setPlaying(true);
    }
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

  const formatTime = (sec: number) => {
    if (!isFinite(sec)) return "--:--";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-x-3 sm:inset-x-4 bottom-5 sm:bottom-6 z-50">
      <div className="mx-auto max-w-[680px] sm:max-w-5xl rounded-2xl border border-white/10 bg-black/70 px-3 py-2 sm:px-4 sm:py-3 backdrop-blur shadow-lg">
        {/* Top row: transport (left) & volume (right) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={togglePlay}
              className="rounded-full bg-amber-400/90 text-black text-sm font-semibold px-3 py-1.5 hover:scale-105"
            >
              {playing ? "Pause ⏸" : "Play ▶️"}
            </button>
            <button
              onClick={() => skip(-10)}
              className="rounded-full bg-white/15 text-white text-sm font-semibold px-3 py-1.5 hover:scale-105"
            >
              ⏪ -10s
            </button>
            <button
              onClick={() => skip(10)}
              className="rounded-full bg-white/15 text-white text-sm font-semibold px-3 py-1.5 hover:scale-105"
            >
              ⏩ +10s
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="rounded-full bg-amber-400/90 text-black text-sm font-semibold px-3 py-1.5 hover:scale-105"
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
                onInput={(e) =>
                  changeVol(parseInt((e.target as HTMLInputElement).value, 10) / 100)
                }
                className="accent-amber-400"
                style={{ width: 140 }}
              />
            </div>
          </div>
        </div>

        {/* Bottom row: time (always centered) + mobile volume */}
        <div className="mt-1 flex flex-col items-center gap-2 sm:mt-2">
          <div className="text-[11px] sm:text-xs text-white/80 tabular-nums">
            {formatTime(curr)} <span className="text-white/50">/</span> {formatTime(dur)}
          </div>
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleMute}
              className="rounded-full bg-amber-400/90 text-black text-xs font-semibold px-3 py-1"
            >
              {muted ? "Unmute 🔊" : "Mute 🔇"}
            </button>
            <span className="text-[11px] text-white/70">Vol</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(vol * 100)}
              onInput={(e) =>
                changeVol(parseInt((e.target as HTMLInputElement).value, 10) / 100)
              }
              className="accent-amber-400"
              style={{ width: 130 }}
            />
          </div>
        </div>
      </div>

      {/* Message (appears then fades out) */}
      {showHint && (
        <div
          className="mt-3 text-center text-[11px] sm:text-xs text-amber-300/90 animate-fadein"
          style={{ animation: "fadeout 1s ease-in 8s forwards" }}
        >
          🎵 If the music doesn’t start automatically, please press the{" "}
          <span className="font-semibold">▶️ Play</span> or{" "}
          <span className="font-semibold">⏸ Pause</span> button.
        </div>
      )}

      {/* Scoped keyframes for fade */}
      <style>{`
        @keyframes fadeout {
          to { opacity: 0; transform: translateY(4px); }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white grid place-items-center">
      <DeepavaliShowcase autoPlay fireworks showGreeting />
      <AudioControls />
    </div>
  );
}
