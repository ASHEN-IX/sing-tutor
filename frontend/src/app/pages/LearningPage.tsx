import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Mic,
  ChevronLeft,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { MelodyCurve } from "../components/MelodyCurve";

interface LearningPageProps {
  onNavigate: (page: string, songId?: string) => void;
  songId?: string | null;
}

const lyrics = [
  { text: "I've been tryna call", time: 0 },
  { text: "I've been on my own for long enough", time: 4 },
  { text: "Maybe you can show me how to love, maybe", time: 8 },
  { text: "I'm going through withdrawals", time: 12 },
  { text: "You don't even have to do too much", time: 16 },
  { text: "You can turn me on with just a touch, baby", time: 20 },
  { text: "I look around and", time: 24 },
  { text: "Sin is the only thing that I'm feeling, aah", time: 28 },
  { text: "I said ooh, I'm blinding lights", time: 32 },
  { text: "I can't sleep until I feel your touch", time: 36 },
];

const hints = [
  { icon: ArrowUp, text: "Raise your voice here", color: "#9D5CFF" },
  { icon: Minus, text: "Hold the note steady", color: "#00D4FF" },
  { icon: ArrowDown, text: "Drop slightly lower", color: "#FF3CAC" },
  { icon: ArrowUp, text: "Gentle rise on the vowel", color: "#3CFFA0" },
];

export function LearningPage({ onNavigate, songId }: LearningPageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(80);
  const [hintIdx, setHintIdx] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const totalDuration = 40;

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const offset = elapsed;
    startRef.current = performance.now() - offset * 1000;
    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000;
      setElapsed(Math.min(t, totalDuration));
      if (t < totalDuration) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setHintIdx((i) => (i + 1) % hints.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentLyricIdx = lyrics.reduce((acc, l, i) => (elapsed >= l.time ? i : acc), 0);
  const progress = elapsed / totalDuration;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const hint = hints[hintIdx];
  const HintIcon = hint.icon;

  return (
    <div className="min-h-screen pt-16 flex flex-col" style={{ background: "#0B0F1A" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[400px]"
          style={{ background: "radial-gradient(ellipse, rgba(157,92,255,0.07) 0%, transparent 70%)" }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6 gap-4">
        {/* Back + song info */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate("library")}
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-3 flex-1">
            <img
              src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=48&h=48&fit=crop&auto=format"
              alt="Song cover"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div>
              <p
                className="font-bold text-sm"
                style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Blinding Lights
              </p>
              <p className="text-xs" style={{ color: "#7B7FA8" }}>The Weeknd • Intermediate</p>
            </div>
            <div
              className="ml-auto px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(157, 92, 255, 0.12)",
                color: "#9D5CFF",
                border: "1px solid rgba(157, 92, 255, 0.25)",
              }}
            >
              78% complete
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="flex items-center gap-3"
          style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px" }}
        >
          <span>{fmt(elapsed)}</span>
          <div
            className="flex-1 h-1.5 rounded-full cursor-pointer relative"
            style={{ background: "rgba(255,255,255,0.1)" }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              setElapsed(pct * totalDuration);
            }}
          >
            <div
              className="h-full rounded-full transition-none"
              style={{
                width: `${progress * 100}%`,
                background: "linear-gradient(90deg, #9D5CFF, #FF3CAC)",
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
              style={{
                left: `${progress * 100}%`,
                transform: "translate(-50%, -50%)",
                background: "#9D5CFF",
                boxShadow: "0 0 8px rgba(157,92,255,0.8)",
              }}
            />
          </div>
          <span>{fmt(totalDuration)}</span>
        </div>

        {/* Main visualization area */}
        <div
          className="rounded-3xl p-5 flex-1"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(157, 92, 255, 0.15)",
            minHeight: "220px",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold" style={{ color: "#7B7FA8" }}>
              MELODY GUIDANCE
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#9D5CFF" }} />
                <span className="text-xs" style={{ color: "#7B7FA8" }}>Reference</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#00D4FF" }} />
                <span className="text-xs" style={{ color: "#7B7FA8" }}>Your voice</span>
              </div>
            </div>
          </div>

          {/* Pitch labels */}
          <div className="flex gap-2 items-stretch">
            <div className="flex flex-col justify-between py-1" style={{ width: "40px" }}>
              {["High", "", "Mid", "", "Low"].map((l, i) => (
                <span key={i} className="text-xs" style={{ color: "#7B7FA8" }}>
                  {l}
                </span>
              ))}
            </div>
            <div className="flex-1">
              <MelodyCurve isPlaying={isPlaying} height={180} />
            </div>
          </div>
        </div>

        {/* Lyrics */}
        <div
          className="rounded-2xl p-4 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentLyricIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="font-bold mb-1"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1.15rem",
                background: "linear-gradient(90deg, #9D5CFF, #FF3CAC)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {lyrics[currentLyricIdx]?.text}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {lyrics[Math.min(currentLyricIdx + 1, lyrics.length - 1)]?.text}
          </p>
        </div>

        {/* Coaching hint */}
        <AnimatePresence mode="wait">
          <motion.div
            key={hintIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{
              background: `${hint.color}10`,
              border: `1px solid ${hint.color}30`,
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${hint.color}20` }}
            >
              <HintIcon size={16} style={{ color: hint.color }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: hint.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                AI Coaching Hint
              </p>
              <p className="text-sm" style={{ color: "#E8E0FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {hint.text}
              </p>
            </div>
            <Lightbulb size={14} className="ml-auto" style={{ color: hint.color, opacity: 0.5 }} />
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 size={16} style={{ color: "#7B7FA8" }} />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 accent-purple-500"
              style={{ accentColor: "#9D5CFF" }}
            />
          </div>

          {/* Playback */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setElapsed(Math.max(0, elapsed - 5))}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <SkipBack size={18} style={{ color: "#E8E0FF" }} />
            </button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                boxShadow: "0 0 30px rgba(157, 92, 255, 0.5)",
              }}
            >
              {isPlaying ? (
                <Pause size={22} fill="white" className="text-white" />
              ) : (
                <Play size={22} fill="white" className="text-white ml-0.5" />
              )}
            </motion.button>
            <button
              onClick={() => setElapsed(Math.min(totalDuration, elapsed + 5))}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <SkipForward size={18} style={{ color: "#E8E0FF" }} />
            </button>
          </div>

          {/* Record */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate("recording")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(255, 60, 172, 0.12)",
              border: "1px solid rgba(255, 60, 172, 0.3)",
              color: "#FF3CAC",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <Mic size={16} />
            Record
          </motion.button>
        </div>
      </div>
    </div>
  );
}
