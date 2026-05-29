import { motion } from "motion/react";
import { Trophy, Zap, Flame, Star, Lock, ChevronRight } from "lucide-react";

interface GamificationPageProps {
  onNavigate: (page: string) => void;
}

const badges = [
  { emoji: "🎤", name: "First Song", desc: "Completed your first song", earned: true },
  { emoji: "🔥", name: "7-Day Streak", desc: "7 days in a row", earned: true },
  { emoji: "⭐", name: "Star Student", desc: "90%+ score three times", earned: true },
  { emoji: "🏆", name: "Champion", desc: "Score 100% on any song", earned: false },
  { emoji: "🎯", name: "Pitch Perfect", desc: "Perfect pitch on 10 songs", earned: false },
  { emoji: "💫", name: "Vocal Legend", desc: "Complete 50 songs", earned: false },
];

const dailyQuests = [
  { icon: "🎵", title: "Sing 2 songs today", xp: 50, progress: 1, total: 2 },
  { icon: "⭐", title: "Score 85%+ once", xp: 75, progress: 0, total: 1 },
  { icon: "🔥", title: "Practice for 15 minutes", xp: 40, progress: 8, total: 15 },
];

const levels = [
  { level: 1, name: "Vocal Rookie", minXp: 0 },
  { level: 5, name: "Melody Seeker", minXp: 500 },
  { level: 10, name: "Pitch Pioneer", minXp: 1500 },
  { level: 14, name: "Rising Star", minXp: 2500 },
  { level: 20, name: "Vocal Master", minXp: 5000 },
  { level: 30, name: "Legend", minXp: 12000 },
];

export function GamificationPage({ onNavigate }: GamificationPageProps) {
  const currentXP = 2840;
  const nextLevelXP = 3500;

  return (
    <div className="min-h-screen pt-20 pb-12 px-6" style={{ background: "#0B0F1A" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
              color: "#E8E0FF",
              letterSpacing: "-0.02em",
            }}
          >
            Challenges & Progress 🏆
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#7B7FA8" }}>
            Level up your voice and collect achievements
          </p>
        </motion.div>

        {/* Top stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Zap, label: "Total XP", value: "2,840", color: "#9D5CFF" },
            { icon: Flame, label: "Streak", value: "12 days", color: "#FF3CAC" },
            { icon: Trophy, label: "Badges", value: "3 / 6", color: "#FFD700" },
            { icon: Star, label: "Level", value: "14", color: "#3CFFA0" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-4 rounded-2xl text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${stat.color}20` }}
              >
                <Icon size={20} className="mx-auto mb-2" style={{ color: stat.color }} />
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.4rem",
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: "#7B7FA8" }}>{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Level progress */}
            <div
              className="p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(157,92,255,0.15)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      color: "#E8E0FF",
                      fontSize: "1rem",
                    }}
                  >
                    Level 14 — Rising Star ⭐
                  </p>
                  <p className="text-xs" style={{ color: "#7B7FA8" }}>
                    {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
                  </p>
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: "rgba(157,92,255,0.15)",
                    color: "#9D5CFF",
                    border: "1px solid rgba(157,92,255,0.25)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Level 15 →
                </div>
              </div>
              <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentXP / nextLevelXP) * 100}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #9D5CFF, #FF3CAC)" }}
                />
              </div>
              <p className="text-xs" style={{ color: "#7B7FA8" }}>
                660 XP to Level 15 — Vocal Master
              </p>
            </div>

            {/* Daily Quests */}
            <div
              className="p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h2
                className="mb-5"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  color: "#E8E0FF",
                  fontSize: "1rem",
                }}
              >
                Daily Quests
              </h2>
              <div className="space-y-4">
                {dailyQuests.map((quest) => {
                  const done = quest.progress >= quest.total;
                  return (
                    <div key={quest.title}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{quest.icon}</span>
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: done ? "#3CFFA0" : "#E8E0FF",
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              textDecoration: done ? "line-through" : "none",
                            }}
                          >
                            {quest.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: "#FFD700" }}>
                            +{quest.xp} XP
                          </span>
                          <span className="text-xs" style={{ color: "#7B7FA8" }}>
                            {quest.progress}/{quest.total}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((quest.progress / quest.total) * 100, 100)}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{
                            background: done
                              ? "linear-gradient(90deg, #3CFFA0, #00D4FF)"
                              : "linear-gradient(90deg, #9D5CFF, #FF3CAC)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => onNavigate("library")}
                className="mt-5 w-full py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)" }}
              >
                Complete Quests →
              </button>
            </div>

            {/* Streak calendar */}
            <div
              className="p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    color: "#E8E0FF",
                    fontSize: "1rem",
                  }}
                >
                  Streak Calendar 🔥
                </h2>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#FF3CAC", fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  12 days
                </span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 21 }, (_, i) => {
                  const done = i < 12;
                  const today = i === 11;
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-xl flex items-center justify-center"
                      style={{
                        background: today
                          ? "linear-gradient(135deg, #FF3CAC, #9D5CFF)"
                          : done
                          ? "rgba(255, 60, 172, 0.25)"
                          : "rgba(255,255,255,0.04)",
                        border: today ? "none" : done ? "1px solid rgba(255,60,172,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {today && <Flame size={14} className="text-white" />}
                      {!today && done && (
                        <div className="w-2 h-2 rounded-full" style={{ background: "#FF3CAC" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right — Badges */}
          <div className="space-y-6">
            <div
              className="p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h2
                className="mb-5"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  color: "#E8E0FF",
                  fontSize: "1rem",
                }}
              >
                Badge Collection
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge) => (
                  <motion.div
                    key={badge.name}
                    whileHover={{ scale: badge.earned ? 1.08 : 1 }}
                    className="flex flex-col items-center p-3 rounded-xl gap-1.5 cursor-pointer"
                    style={{
                      background: badge.earned ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.03)",
                      border: badge.earned ? "1px solid rgba(255,215,0,0.25)" : "1px solid rgba(255,255,255,0.06)",
                      opacity: badge.earned ? 1 : 0.5,
                    }}
                    title={`${badge.name}: ${badge.desc}`}
                  >
                    <div className="relative">
                      <span className="text-2xl">{badge.emoji}</span>
                      {!badge.earned && (
                        <Lock
                          size={10}
                          className="absolute -bottom-0.5 -right-0.5"
                          style={{ color: "#7B7FA8" }}
                        />
                      )}
                    </div>
                    <p
                      className="text-center"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: "9px",
                        color: badge.earned ? "#FFD700" : "#7B7FA8",
                        lineHeight: 1.2,
                      }}
                    >
                      {badge.name}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div
              className="p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h2
                className="mb-4"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  color: "#E8E0FF",
                  fontSize: "1rem",
                }}
              >
                Weekly Leaderboard
              </h2>
              <div className="space-y-3">
                {[
                  { rank: 1, name: "Zoe M.", xp: 3420, you: false },
                  { rank: 2, name: "Kai N.", xp: 3180, you: false },
                  { rank: 3, name: "You (Alex)", xp: 2840, you: true },
                  { rank: 4, name: "Aria J.", xp: 2700, you: false },
                  { rank: 5, name: "Leo R.", xp: 2540, you: false },
                ].map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-3 p-2 rounded-lg"
                    style={{
                      background: entry.you ? "rgba(157,92,255,0.1)" : "transparent",
                      border: entry.you ? "1px solid rgba(157,92,255,0.2)" : "1px solid transparent",
                    }}
                  >
                    <span
                      className="w-5 text-center text-xs font-bold"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        color: entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "#7B7FA8",
                      }}
                    >
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                    </span>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: entry.you ? "linear-gradient(135deg, #9D5CFF, #FF3CAC)" : "rgba(255,255,255,0.1)" }}
                    >
                      {entry.name[0]}
                    </div>
                    <span
                      className="flex-1 text-sm"
                      style={{
                        color: entry.you ? "#E8E0FF" : "#B8B0D0",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: entry.you ? 700 : 400,
                      }}
                    >
                      {entry.name}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: entry.you ? "#9D5CFF" : "#7B7FA8",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {entry.xp.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
