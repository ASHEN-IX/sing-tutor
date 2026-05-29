import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Music, FileText, ChevronLeft, Check, Loader2, X, Sparkles } from "lucide-react";
import { uploadSong, processSong, waitForProcessingCompletion } from "../../services/songService";

interface UploadSongPageProps {
  onNavigate: (page: string, songId?: string) => void;
}

type UploadStep = "form" | "uploading" | "processing" | "done" | "error";

export function UploadSongPage({ onNavigate }: UploadSongPageProps) {
  const [step, setStep] = useState<UploadStep>("form");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [language, setLanguage] = useState("en");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [songId, setSongId] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!audioFile || !lyricsFile || !title || !artist) return;

    try {
      setStep("uploading");
      setProgress(10);

      const uploadResult = await uploadSong({
        audio: audioFile,
        lyrics: lyricsFile,
        title,
        artist,
        language,
        difficulty,
      });

      setSongId(uploadResult.song_id);
      setProgress(30);
      setStep("processing");

      await processSong(uploadResult.song_id);
      setProgress(50);

      await waitForProcessingCompletion(uploadResult.song_id, {
        interval: 2000,
        timeout: 300000,
      });

      setProgress(100);
      setStep("done");
    } catch (err: any) {
      setError(err?.message || "Upload failed");
      setStep("error");
    }
  }, [audioFile, lyricsFile, title, artist, language, difficulty]);

  const difficulties = [
    { value: "beginner", label: "Beginner", color: "#3CFFA0" },
    { value: "intermediate", label: "Intermediate", color: "#9D5CFF" },
    { value: "advanced", label: "Advanced", color: "#FF3CAC" },
  ] as const;

  return (
    <div className="min-h-screen pt-20 pb-12 px-6" style={{ background: "#0B0F1A" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[-100px] right-[10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(157,92,255,0.1) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[20%] left-[-100px] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,60,172,0.08) 0%, transparent 70%)" }}
        />
      </div>

      <div className="max-w-2xl mx-auto relative">
        {/* Back */}
        <button
          onClick={() => onNavigate("library")}
          className="flex items-center gap-1.5 text-sm mb-6"
          style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <ChevronLeft size={16} /> Back to Library
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
              color: "#E8E0FF",
              letterSpacing: "-0.02em",
            }}
          >
            Upload New Song 🎵
          </h1>
          <p style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Add your own songs to practice with AI coaching
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* === FORM === */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Title */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Song Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Blinding Lights"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(157, 92, 255, 0.2)",
                    color: "#E8E0FF",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
              </div>

              {/* Artist */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Artist
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. The Weeknd"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(157, 92, 255, 0.2)",
                    color: "#E8E0FF",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {difficulties.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: difficulty === d.value ? `${d.color}20` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${difficulty === d.value ? `${d.color}60` : "rgba(255,255,255,0.08)"}`,
                        color: difficulty === d.value ? d.color : "#7B7FA8",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(157, 92, 255, 0.2)",
                    color: "#E8E0FF",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>

              {/* Audio File */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Audio File
                </label>
                <label
                  className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: audioFile ? "rgba(60, 255, 160, 0.06)" : "rgba(255,255,255,0.03)",
                    border: `2px dashed ${audioFile ? "#3CFFA060" : "rgba(157, 92, 255, 0.2)"}`,
                  }}
                >
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  />
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: audioFile ? "rgba(60,255,160,0.15)" : "rgba(157,92,255,0.15)" }}
                  >
                    {audioFile ? <Check size={22} style={{ color: "#3CFFA0" }} /> : <Music size={22} style={{ color: "#9D5CFF" }} />}
                  </div>
                  <p className="text-sm" style={{ color: audioFile ? "#3CFFA0" : "#7B7FA8" }}>
                    {audioFile ? audioFile.name : "Drop audio file or click to browse"}
                  </p>
                  <p className="text-xs" style={{ color: "#7B7FA8" }}>
                    MP3, WAV, M4A, OGG — Max 100MB
                  </p>
                </label>
              </div>

              {/* Lyrics File */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Lyrics File
                </label>
                <label
                  className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: lyricsFile ? "rgba(60, 255, 160, 0.06)" : "rgba(255,255,255,0.03)",
                    border: `2px dashed ${lyricsFile ? "#3CFFA060" : "rgba(157, 92, 255, 0.2)"}`,
                  }}
                >
                  <input
                    type="file"
                    accept=".txt,.lrc"
                    className="hidden"
                    onChange={(e) => setLyricsFile(e.target.files?.[0] || null)}
                  />
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: lyricsFile ? "rgba(60,255,160,0.15)" : "rgba(255,60,172,0.15)" }}
                  >
                    {lyricsFile ? <Check size={22} style={{ color: "#3CFFA0" }} /> : <FileText size={22} style={{ color: "#FF3CAC" }} />}
                  </div>
                  <p className="text-sm" style={{ color: lyricsFile ? "#3CFFA0" : "#7B7FA8" }}>
                    {lyricsFile ? lyricsFile.name : "Drop lyrics file or click to browse"}
                  </p>
                  <p className="text-xs" style={{ color: "#7B7FA8" }}>
                    TXT or LRC format
                  </p>
                </label>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!audioFile || !lyricsFile || !title || !artist}
                className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-opacity"
                style={{
                  background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                  boxShadow: "0 8px 32px rgba(157, 92, 255, 0.4)",
                  fontFamily: "'Space Grotesk', sans-serif",
                  opacity: !audioFile || !lyricsFile || !title || !artist ? 0.4 : 1,
                }}
              >
                <Upload size={18} /> Upload & Process Song
              </motion.button>
            </motion.div>
          )}

          {/* === UPLOADING / PROCESSING === */}
          {(step === "uploading" || step === "processing") && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center py-16"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: "linear-gradient(135deg, rgba(157,92,255,0.2), rgba(255,60,172,0.2))",
                  border: "2px solid rgba(157, 92, 255, 0.4)",
                }}
              >
                <Loader2 size={32} style={{ color: "#9D5CFF" }} />
              </motion.div>
              <h2
                className="mb-2"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.4rem",
                  color: "#E8E0FF",
                }}
              >
                {step === "uploading" ? "Uploading files..." : "Processing with AI..."}
              </h2>
              <p className="text-sm mb-8" style={{ color: "#7B7FA8" }}>
                {step === "uploading"
                  ? "Sending your audio and lyrics to the server"
                  : "Extracting melody, beats, and aligning lyrics — this may take a minute"}
              </p>
              {/* Progress bar */}
              <div className="w-full max-w-sm h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  style={{ background: "linear-gradient(90deg, #9D5CFF, #FF3CAC)" }}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
                {progress}% complete
              </p>
            </motion.div>
          )}

          {/* === DONE === */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: "linear-gradient(135deg, #3CFFA0, #00D4FF)",
                  boxShadow: "0 0 40px rgba(60, 255, 160, 0.4)",
                }}
              >
                <Sparkles size={32} className="text-white" />
              </motion.div>
              <h2
                className="mb-2"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.8rem",
                  color: "#E8E0FF",
                }}
              >
                Song Ready! 🎉
              </h2>
              <p className="text-sm mb-8" style={{ color: "#7B7FA8" }}>
                "{title}" by {artist} has been processed and is ready to practice
              </p>
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate("learning", songId)}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                    boxShadow: "0 8px 32px rgba(157, 92, 255, 0.45)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Start Learning →
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate("library")}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#E8E0FF",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Back to Library
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* === ERROR === */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-16"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{ background: "rgba(255,60,172,0.15)", border: "2px solid rgba(255,60,172,0.4)" }}
              >
                <X size={32} style={{ color: "#FF3CAC" }} />
              </div>
              <h2
                className="mb-2"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.4rem",
                  color: "#E8E0FF",
                }}
              >
                Something went wrong
              </h2>
              <p className="text-sm mb-8" style={{ color: "#FF3CAC" }}>{error}</p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setStep("form"); setError(""); }}
                className="px-8 py-3 rounded-xl font-semibold"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#E8E0FF",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Try Again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
