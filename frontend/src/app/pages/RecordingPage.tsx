import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Square, ChevronLeft, Loader2 } from "lucide-react";
import { usePitchAnalysis } from "../../hooks/usePitchAnalysis";
import { apiService } from "../../services/api";
import { SongMetadata } from "../../types/api";
import { PitchAnalysisResponse } from "../../types/pitch";

interface RecordingPageProps {
  onNavigate: (page: string, songId?: string) => void;
  songId?: string | null;
  onAnalysisComplete: (analysis: PitchAnalysisResponse | null) => void;
}

export function RecordingPage({ onNavigate, songId, onAnalysisComplete }: RecordingPageProps) {
  const [song, setSong] = useState<SongMetadata | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [waveValues, setWaveValues] = useState<number[]>(Array(40).fill(4));
  const [confidence, setConfidence] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const { analysis, loading: analysisLoading, error: analysisError, analyzePitch, resetAnalysis } = usePitchAnalysis();

  useEffect(() => {
    if (!songId) return;

    let cancelled = false;
    const currentSongId = songId;

    async function loadSong() {
      try {
        const data = await apiService.getSong(currentSongId);
        if (!cancelled) setSong(data);
      } catch {
        if (!cancelled) setSong(null);
      }
    }

    loadSong();

    return () => {
      cancelled = true;
    };
  }, [songId]);

  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      waveRef.current = setInterval(() => {
        setWaveValues(
          Array.from({ length: 40 }, (_, i) =>
            i % 3 === 0 ? Math.random() * 30 + 5 : Math.random() * 20 + 2
          )
        );
        setConfidence(65 + Math.random() * 30);
      }, 120);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
      setWaveValues(Array(40).fill(4));
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      resetAnalysis();
      onAnalysisComplete(null);
      setRecordingError("");
      setElapsed(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/wav" });
        const result = await analyzePitch(blob);
        onAnalysisComplete(result);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        onNavigate("results", songId || undefined);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
      setRecordingError("Failed to start recording. Check microphone permissions.");
    }
  };

  const handleStop = () => {
    setRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const pageError = recordingError || analysisError;
  const currentConfidence = recording ? confidence : analysis?.pitch_data[0]?.confidence ? analysis.pitch_data[0].confidence * 100 : 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center pt-16 px-4"
      style={{ background: "#0B0F1A" }}
    >
      {/* Background pulse when recording */}
      <AnimatePresence>
        {recording && (
          <motion.div
            className="fixed inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: "radial-gradient(ellipse at 50% 60%, rgba(255,60,172,0.06) 0%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg">
        {/* Back */}
        <button
          type="button"
          onClick={() => onNavigate("learning")}
          className="flex items-center gap-1.5 text-sm mb-8"
          style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <ChevronLeft size={16} aria-hidden="true" /> Back to learning
        </button>

        {/* Title */}
        <div className="text-center mb-12">
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "2rem",
              color: "#E8E0FF",
              letterSpacing: "-0.02em",
            }}
          >
            {analysisLoading ? "Analyzing..." : recording ? "Recording..." : "Ready to Sing?"}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#7B7FA8" }}>
            {analysisLoading
              ? "Sending your recording to the pitch analysis API"
              : recording
              ? "Sing along with the melody — we're analyzing your voice live"
              : `Tap the mic and sing ${song?.title || "your song"}`}
          </p>
        </div>

        {/* Waveform visualizer */}
        <div
          className="rounded-2xl p-5 mb-8 flex items-end justify-center gap-1 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            height: "100px",
          }}
        >
          {waveValues.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: `${h}px` }}
              transition={{ duration: 0.1 }}
              className="rounded-full flex-shrink-0"
              style={{
                width: "3px",
                background: recording
                  ? `linear-gradient(180deg, #FF3CAC, #9D5CFF)`
                  : "rgba(255,255,255,0.1)",
                minHeight: "4px",
              }}
            />
          ))}
        </div>

        {/* Confidence meter */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: "#7B7FA8" }}>Pitch Confidence</span>
            <span
              className="text-xs font-bold"
              style={{
                color: confidence > 80 ? "#3CFFA0" : confidence > 60 ? "#9D5CFF" : "#FF3CAC",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {recording || analysis ? `${Math.round(currentConfidence)}%` : "—"}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              animate={{ width: recording || analysis ? `${currentConfidence}%` : "0%" }}
              transition={{ duration: 0.15 }}
              className="h-full rounded-full"
              style={{
                background:
                  confidence > 80
                    ? "linear-gradient(90deg, #3CFFA0, #00D4FF)"
                    : "linear-gradient(90deg, #9D5CFF, #FF3CAC)",
              }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-8">
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "2.5rem",
              color: recording ? "#FF3CAC" : "#7B7FA8",
              letterSpacing: "0.05em",
            }}
          >
            {fmt(elapsed)}
          </span>
        </div>

        {/* Mic button */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {/* Pulse rings */}
            {recording && (
              <>
                {[1, 2, 3].map((n) => (
                  <motion.div
                    key={n}
                    className="absolute inset-0 rounded-full border"
                    style={{ borderColor: "rgba(255,60,172,0.4)" }}
                    animate={{ scale: [1, 1 + n * 0.4], opacity: [0.6, 0] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: n * 0.4,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={() => {
                if (recording) {
                  handleStop();
                } else if (!analysisLoading) {
                  startRecording();
                } else {
                  return;
                }
              }}
              disabled={analysisLoading}
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: recording
                  ? "linear-gradient(135deg, #FF3CAC, #9D5CFF)"
                  : "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                boxShadow: recording
                  ? "0 0 60px rgba(255,60,172,0.6)"
                  : "0 0 40px rgba(157,92,255,0.5)",
              }}
              aria-label={recording ? "Stop recording" : "Start recording"}
            >
              {analysisLoading ? (
                <Loader2 size={32} className="text-white animate-spin" />
              ) : recording ? (
                <Square size={32} fill="white" className="text-white" />
              ) : (
                <Mic size={36} className="text-white" />
              )}
            </motion.button>
          </div>

          <p className="text-xs text-center" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {recording ? "Tap to stop and see your results" : "Tap to start recording"}
          </p>
        </div>

        {pageError && (
          <div
            className="mt-6 rounded-2xl p-4 text-center text-sm"
            style={{ background: "rgba(255,60,172,0.1)", border: "1px solid rgba(255,60,172,0.3)", color: "#FF8ACD" }}
            role="alert"
            aria-live="polite"
          >
            {pageError}
          </div>
        )}

        {/* Tips */}
        <div
          className="mt-10 grid grid-cols-3 gap-3"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {[
            { emoji: "🎤", tip: "Sing clearly" },
            { emoji: "🔇", tip: "Quiet room" },
            { emoji: "📏", tip: "6 inches away" },
          ].map((t) => (
            <div
              key={t.tip}
              className="flex flex-col items-center gap-1 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <span className="text-lg">{t.emoji}</span>
              <span className="text-xs text-center" style={{ color: "#7B7FA8" }}>
                {t.tip}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
