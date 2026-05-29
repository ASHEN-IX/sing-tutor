import { motion } from "motion/react";
import { Trophy, RotateCcw, ChevronRight, Star, Zap, Target, Activity } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { MelodyCurve } from "../components/MelodyCurve";
import { PitchAnalysisResponse } from "../../types/pitch";

interface ResultsPageProps {
  onNavigate: (page: string, songId?: string) => void;
  songId?: string | null;
  analysis?: PitchAnalysisResponse | null;
}

const userPitch = [
  48, 51, 54, 62, 60, 66, 61, 59, 53, 53, 49, 47, 52, 53, 61, 63,
  72, 67, 66, 59, 57, 54, 53, 56, 57, 63, 63, 69, 69, 67, 63, 61,
  54, 51, 48, 47, 46, 47, 51, 50, 56, 56, 61, 62, 64, 63, 57, 56,
];

const radarData = [
  { skill: "Pitch", value: 91 },
  { skill: "Timing", value: 84 },
  { skill: "Stability", value: 78 },
  { skill: "Breath", value: 72 },
  { skill: "Expression", value: 85 },
];

const segmentData = [
  { segment: "Verse 1", score: 88 },
  { segment: "Pre-chorus", score: 94 },
  { segment: "Chorus", score: 91 },
  { segment: "Verse 2", score: 85 },
  { segment: "Bridge", score: 79 },
  { segment: "Outro", score: 96 },
];

const achievements = [
  { icon: "🎯", title: "Perfect Chorus", desc: "94% accuracy on the chorus" },
  { icon: "🔥", title: "Streak Keeper", desc: "13-day streak maintained!" },
  { icon: "⬆️", title: "Personal Best", desc: "Highest score on this song" },
];

function frequencyToMidi(frequency: number) {
  return 69 + 12 * Math.log2(frequency / 440);
}

export function ResultsPage({ onNavigate, songId, analysis }: ResultsPageProps) {
  const confidenceScore = analysis?.pitch_data.length
    ? Math.round(
        (analysis.pitch_data.reduce((sum, point) => sum + point.confidence, 0) / analysis.pitch_data.length) * 100
      )
    : 87;
  const overallScore = Math.min(100, Math.max(0, confidenceScore));
  const analyzedPitch = analysis?.pitch_data
    .map((point) => frequencyToMidi(point.frequency))
    .filter((value) => Number.isFinite(value));
  const comparisonPitch = analyzedPitch?.length ? analyzedPitch.slice(0, 80) : userPitch;

  return (
    <div className="min-h-screen pt-20 pb-12 px-6" style={{ background: "#0B0F1A" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{
              background: "rgba(157, 92, 255, 0.12)",
              border: "1px solid rgba(157, 92, 255, 0.25)",
            }}
          >
            <Trophy size={14} style={{ color: "#9D5CFF" }} />
            <span className="text-sm font-semibold" style={{ color: "#9D5CFF" }}>
              Performance Complete
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#E8E0FF",
              letterSpacing: "-0.02em",
            }}
          >
            Performance Results
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7B7FA8" }}>
            {analysis ? `${analysis.num_points} pitch points • ${analysis.duration.toFixed(1)}s analyzed` : "Demo performance summary"}
          </p>
        </motion.div>

        {/* Overall score hero */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
              <motion.circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke="url(#scoreCircle)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 60}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - overallScore / 100) }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              />
              <defs>
                <linearGradient id="scoreCircle" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9D5CFF" />
                  <stop offset="100%" stopColor="#FF3CAC" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 800,
                  fontSize: "2.8rem",
                  background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1,
                }}
              >
                {overallScore}
              </motion.p>
              <p className="text-xs" style={{ color: "#7B7FA8" }}>/ 100</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {[...Array(Math.round((overallScore / 100) * 5))].map((_, i) => (
              <Star key={i} size={18} fill="#FFD700" style={{ color: "#FFD700" }} />
            ))}
          </div>
          <p className="text-sm mt-2 font-semibold" style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}>
            {overallScore >= 90 ? "Incredible!" : overallScore >= 80 ? "Great Performance!" : "Good Effort!"}
          </p>
          <p className="text-xs" style={{ color: "#7B7FA8" }}>
            +120 XP earned 🎉
          </p>
        </motion.div>

        {/* Score breakdown cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Target, label: "Pitch Accuracy", value: "91%", color: "#9D5CFF" },
            { icon: Activity, label: "Timing", value: "84%", color: "#FF3CAC" },
            { icon: Zap, label: "Stability", value: "78%", color: "#00D4FF" },
            { icon: Star, label: "Expression", value: "85%", color: "#3CFFA0" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="p-4 rounded-2xl text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${stat.color}25`,
                }}
              >
                <Icon size={18} className="mx-auto mb-2" style={{ color: stat.color }} />
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.5rem",
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-xs mt-1" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Melody comparison */}
          <div
            className="p-5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm font-bold mb-4" style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}>
              Melody Comparison
            </p>
            <MelodyCurve height={130} showUserOverlay userPitch={comparisonPitch} />
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: "#9D5CFF" }} />
                <span className="text-xs" style={{ color: "#7B7FA8" }}>Reference</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: "#00D4FF" }} />
                <span className="text-xs" style={{ color: "#7B7FA8" }}>Your voice</span>
              </div>
            </div>
          </div>

          {/* Radar chart */}
          <div
            className="p-5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm font-bold mb-4" style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}>
              Skill Radar
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#7B7FA8", fontSize: 11, fontFamily: "'Space Grotesk', sans-serif" }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#9D5CFF"
                  fill="#9D5CFF"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment breakdown */}
        <div
          className="p-5 rounded-2xl mb-8"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm font-bold mb-4" style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}>
            Segment Breakdown
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={segmentData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="segGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF3CAC" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF3CAC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="segment" tick={{ fill: "#7B7FA8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7B7FA8", fontSize: 10 }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip
                contentStyle={{
                  background: "#12182a",
                  border: "1px solid rgba(255,60,172,0.3)",
                  borderRadius: "12px",
                  color: "#E8E0FF",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value}%`, "Score"]}
              />
              <Area type="monotone" dataKey="score" stroke="#FF3CAC" strokeWidth={2} fill="url(#segGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Feedback */}
        <div
          className="p-5 rounded-2xl mb-8"
          style={{
            background: "linear-gradient(135deg, rgba(157,92,255,0.08), rgba(255,60,172,0.06))",
            border: "1px solid rgba(157, 92, 255, 0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🤖</span>
            <p className="text-sm font-bold" style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}>
              AI Coaching Feedback
            </p>
          </div>
          <div className="space-y-3">
            {[
              {
                type: "strength",
                text: "Your pitch accuracy on the chorus is exceptional — especially the sustained high notes. You're holding them with great control.",
              },
              {
                type: "improve",
                text: "Work on the bridge section — your pitch dipped below the reference line. Try singing it slowly first, then build up speed.",
              },
              {
                type: "strength",
                text: "Your timing is very consistent. You're landing on the beat almost perfectly throughout the song.",
              },
            ].map((fb, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-xl"
                style={{
                  background: fb.type === "strength" ? "rgba(60,255,160,0.06)" : "rgba(255,60,172,0.06)",
                }}
              >
                <span>{fb.type === "strength" ? "✅" : "💡"}</span>
                <p className="text-sm leading-relaxed" style={{ color: "#B8B0D0", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {fb.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-10">
          <p className="text-sm font-bold mb-4" style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}>
            Achievements Unlocked 🏆
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {achievements.map((ach, i) => (
              <motion.div
                key={ach.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,215,0,0.2)",
                }}
              >
                <span className="text-2xl">{ach.icon}</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: "#FFD700", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {ach.title}
                  </p>
                  <p className="text-xs" style={{ color: "#7B7FA8" }}>
                    {ach.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate("recording", songId || undefined)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#E8E0FF",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <RotateCcw size={16} /> Try Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate("library")}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold"
            style={{
              background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
              boxShadow: "0 8px 24px rgba(157, 92, 255, 0.4)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Next Song <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
