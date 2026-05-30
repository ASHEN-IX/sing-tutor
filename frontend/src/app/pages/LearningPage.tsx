import { useState, useEffect, useMemo, useRef } from "react";
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
import { API_BASE_URL } from "../../services/api";
import { getReference } from "../../services/songService";
import { SongReference } from "../../types/songReference";

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

const LYRICS_SYNC_THRESHOLD = 0.05;

function frequencyToMidi(frequency: number) {
  return 69 + 12 * Math.log2(frequency / 440);
}

function lyricLines(reference: SongReference | null) {
  if (!reference?.lyrics.length && !reference?.lyric_lines?.length) return lyrics;

  if (reference?.lyric_lines?.length) {
    return reference.lyric_lines.map((line) => ({
      text: line.text,
      time: line.start,
    }));
  }

  const lines: { text: string; time: number }[] = [];
  const wordsPerLine = 6;

  for (let i = 0; i < reference.lyrics.length; i += wordsPerLine) {
    const chunk = reference.lyrics.slice(i, i + wordsPerLine);
    lines.push({
      text: chunk.map((item) => item.word).join(" "),
      time: chunk[0]?.start ?? 0,
    });
  }

  return lines.length ? lines : lyrics;
}

function findCurrentLyricIndex(elapsed: number, lines: Array<{ time: number }>) {
  if (!lines.length) return 0;
  let left = 0;
  let right = lines.length - 1;
  let result = 0;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (lines[mid].time <= elapsed) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

export function LearningPage({ onNavigate, songId }: LearningPageProps) {
  const [reference, setReference] = useState<SongReference | null>(null);
  const [loading, setLoading] = useState(Boolean(songId));
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [hintIdx, setHintIdx] = useState(0);
  const [currentLyricIdx, setCurrentLyricIdx] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef(0);
  const lastLyricUpdateRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const totalDuration = audioDuration || reference?.duration || 40;

  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    if (!songId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const currentSongId = songId;

    async function loadReference() {
      try {
        setLoading(true);
        setError("");
        const data = await getReference(currentSongId);
        if (!cancelled) {
          setReference(data);
          setElapsed(0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load song reference");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReference();

    return () => {
      cancelled = true;
    };
  }, [songId]);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      return;
    }
    const offset = elapsedRef.current;
    startRef.current = performance.now() - offset * 1000;
    void audioRef.current?.play();
    const tick = (now: number) => {
      const t = audioRef.current?.currentTime ?? (now - startRef.current) / 1000;
      setElapsed(Math.min(t, totalDuration));
      if (t < totalDuration) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setHintIdx((i) => (i + 1) % hints.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const displayLyrics = useMemo(() => lyricLines(reference), [reference]);
  useEffect(() => {
    setCurrentLyricIdx(0);
    lastLyricUpdateRef.current = 0;
  }, [reference]);
  useEffect(() => {
    const computedLyricIdx = findCurrentLyricIndex(elapsed, displayLyrics);
    if (
      computedLyricIdx !== currentLyricIdx &&
      elapsed - lastLyricUpdateRef.current >= LYRICS_SYNC_THRESHOLD
    ) {
      setCurrentLyricIdx(computedLyricIdx);
      lastLyricUpdateRef.current = elapsed;
    }
  }, [elapsed, displayLyrics, currentLyricIdx]);
  const progress = elapsed / totalDuration;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const seekTo = (nextElapsed: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, nextElapsed));
    setElapsed(clamped);
    if (audioRef.current) audioRef.current.currentTime = clamped;
  };

  const hint = hints[hintIdx];
  const HintIcon = hint.icon;
  const referencePitch = reference?.pitch_data
    .map((point) => point.midi || frequencyToMidi(point.frequency))
    .filter((value) => Number.isFinite(value));

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center" style={{ background: "#0B0F1A" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#9D5CFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 flex flex-col" style={{ background: "#0B0F1A" }}>
      {songId && (
        <audio
          ref={audioRef}
          src={`${API_BASE_URL}/api/songs/${songId}/audio`}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(event) => setAudioDuration(event.currentTarget.duration)}
        />
      )}
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
            type="button"
            onClick={() => onNavigate("library")}
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <ChevronLeft size={16} aria-hidden="true" /> Back
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
                {reference?.title || "Blinding Lights"}
              </p>
              <p className="text-xs" style={{ color: "#7B7FA8" }}>
                {reference ? `${reference.artist} • ${reference.difficulty}` : "The Weeknd • Intermediate"}
              </p>
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
              seekTo(pct * totalDuration);
            }}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(totalDuration)}
            aria-valuenow={Math.round(elapsed)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                seekTo(elapsed + 5);
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                seekTo(elapsed - 5);
              }
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
              <MelodyCurve isPlaying={isPlaying} referencePitch={referencePitch} height={180} />
            </div>
          </div>
        </div>

        {error && (
          <div
            className="rounded-2xl p-4 text-sm"
            style={{ background: "rgba(255,60,172,0.1)", border: "1px solid rgba(255,60,172,0.3)", color: "#FF8ACD" }}
          >
            {error}
          </div>
        )}

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
              {displayLyrics[currentLyricIdx]?.text}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {displayLyrics[Math.min(currentLyricIdx + 1, displayLyrics.length - 1)]?.text}
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
              <Volume2 size={16} style={{ color: "#7B7FA8" }} aria-hidden="true" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 accent-purple-500"
              style={{ accentColor: "#9D5CFF" }}
                aria-label="Volume"
              />
            </div>

          {/* Playback */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => seekTo(elapsed - 5)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
              aria-label="Skip back 5 seconds"
            >
              <SkipBack size={18} style={{ color: "#E8E0FF" }} aria-hidden="true" />
            </button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                boxShadow: "0 0 30px rgba(157, 92, 255, 0.5)",
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={22} fill="white" className="text-white" aria-hidden="true" />
              ) : (
                <Play size={22} fill="white" className="text-white ml-0.5" aria-hidden="true" />
              )}
            </motion.button>
            <button
              type="button"
              onClick={() => seekTo(elapsed + 5)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
              aria-label="Skip forward 5 seconds"
            >
              <SkipForward size={18} style={{ color: "#E8E0FF" }} aria-hidden="true" />
            </button>
          </div>

          {/* Record */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => onNavigate("recording", songId || undefined)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(255, 60, 172, 0.12)",
              border: "1px solid rgba(255, 60, 172, 0.3)",
              color: "#FF3CAC",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            aria-label="Record your singing"
          >
            <Mic size={16} aria-hidden="true" />
            Record
          </motion.button>
        </div>
      </div>
    </div>
  );
}
