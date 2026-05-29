import { motion } from "motion/react";
import { Settings, Music2, Trophy, Mic2, BarChart3, Star, Edit3, LogOut } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface ProfilePageProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const weeklyData = [
  { day: "M", songs: 2 },
  { day: "T", songs: 3 },
  { day: "W", songs: 1 },
  { day: "T", songs: 4 },
  { day: "F", songs: 2 },
  { day: "S", songs: 5 },
  { day: "S", songs: 3 },
];

const performanceHistory = [
  { date: "May 22", score: 78 },
  { date: "May 23", score: 81 },
  { date: "May 24", score: 75 },
  { date: "May 25", score: 85 },
  { date: "May 26", score: 88 },
  { date: "May 27", score: 91 },
  { date: "May 28", score: 87 },
];

const favoriteSongs = [
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    bestScore: 91,
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=48&h=48&fit=crop&auto=format",
  },
  {
    title: "Anti-Hero",
    artist: "Taylor Swift",
    bestScore: 85,
    cover: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=48&h=48&fit=crop&auto=format",
  },
  {
    title: "Golden Hour",
    artist: "JVKE",
    bestScore: 80,
    cover: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=48&h=48&fit=crop&auto=format",
  },
];

export function ProfilePage({ onNavigate, onLogout }: ProfilePageProps) {
  return (
    <div className="min-h-screen pt-20 pb-12 px-6" style={{ background: "#0B0F1A" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — Profile card */}
          <div className="space-y-4">
            {/* Avatar + info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl text-center"
              style={{
                background: "linear-gradient(135deg, rgba(157,92,255,0.12), rgba(255,60,172,0.08))",
                border: "1px solid rgba(157,92,255,0.2)",
              }}
            >
              <div className="relative inline-block mb-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto"
                  style={{
                    background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                    boxShadow: "0 0 40px rgba(157,92,255,0.5)",
                  }}
                >
                  AJ
                </div>
                <button
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "#1A1F35", border: "1px solid rgba(157,92,255,0.3)" }}
                >
                  <Edit3 size={12} style={{ color: "#9D5CFF" }} />
                </button>
              </div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.3rem",
                  color: "#E8E0FF",
                }}
              >
                Alex Johnson
              </h2>
              <p className="text-sm mb-3" style={{ color: "#7B7FA8" }}>
                Rising Star 🌟 • Level 14
              </p>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,60,172,0.12)", border: "1px solid rgba(255,60,172,0.25)" }}
              >
                <span>🔥</span>
                <span className="text-xs font-bold" style={{ color: "#FF3CAC", fontFamily: "'Space Grotesk', sans-serif" }}>
                  12-day streak
                </span>
              </div>
            </motion.div>

            {/* Quick stats */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h3
                className="mb-4 text-sm font-bold"
                style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Singing Stats
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Music2, label: "Songs Completed", value: "23", color: "#9D5CFF" },
                  { icon: Mic2, label: "Total Recordings", value: "61", color: "#FF3CAC" },
                  { icon: Trophy, label: "Badges Earned", value: "3", color: "#FFD700" },
                  { icon: Star, label: "Best Score", value: "96%", color: "#3CFFA0" },
                  { icon: BarChart3, label: "Avg. Score", value: "84%", color: "#00D4FF" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: stat.color }} />
                        <span className="text-xs" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {stat.label}
                        </span>
                      </div>
                      <span
                        className="text-xs font-bold"
                        style={{ color: stat.color, fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {stat.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#E8E0FF",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <Settings size={16} style={{ color: "#7B7FA8" }} />
                Settings
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors"
                style={{
                  background: "rgba(255, 60, 172, 0.06)",
                  border: "1px solid rgba(255, 60, 172, 0.15)",
                  color: "#FF3CAC",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Right — Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance history chart */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h3
                className="mb-4 text-sm font-bold"
                style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Performance History
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={performanceHistory} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9D5CFF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9D5CFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#7B7FA8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7B7FA8", fontSize: 10 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "#12182a",
                      border: "1px solid rgba(157,92,255,0.3)",
                      borderRadius: "12px",
                      color: "#E8E0FF",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`${value}%`, "Score"]}
                  />
                  <Area type="monotone" dataKey="score" stroke="#9D5CFF" strokeWidth={2} fill="url(#perfGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly practice */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h3
                className="mb-4 text-sm font-bold"
                style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Weekly Practice
              </h3>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <XAxis dataKey="day" tick={{ fill: "#7B7FA8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7B7FA8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#12182a",
                      border: "1px solid rgba(255,60,172,0.3)",
                      borderRadius: "12px",
                      color: "#E8E0FF",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [value ?? 0, "Songs"]}
                  />
                  <Bar dataKey="songs" radius={[4, 4, 0, 0]} fill="url(#barGrad)">
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF3CAC" />
                        <stop offset="100%" stopColor="#9D5CFF" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Favorite songs */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h3
                className="mb-4 text-sm font-bold"
                style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Favorite Songs
              </h3>
              <div className="space-y-3">
                {favoriteSongs.map((song) => (
                  <div
                    key={song.title}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                    onClick={() => onNavigate("learning")}
                  >
                    <img src={song.cover} alt={song.title} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#E8E0FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {song.title}
                      </p>
                      <p className="text-xs" style={{ color: "#7B7FA8" }}>{song.artist}</p>
                    </div>
                    <div
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(60,255,160,0.12)" }}
                    >
                      <Star size={11} fill="#3CFFA0" style={{ color: "#3CFFA0" }} />
                      <span className="text-xs font-bold" style={{ color: "#3CFFA0", fontFamily: "'Space Grotesk', sans-serif" }}>
                        {song.bestScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements grid */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <h3
                className="mb-4 text-sm font-bold"
                style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Achievements
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {["🎤", "🔥", "⭐", "🎯", "🏆", "💫"].map((emoji, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center p-3 rounded-xl"
                    style={{
                      background: i < 3 ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.03)",
                      border: i < 3 ? "1px solid rgba(255,215,0,0.2)" : "1px solid rgba(255,255,255,0.05)",
                      opacity: i < 3 ? 1 : 0.4,
                    }}
                  >
                    <span style={{ fontSize: "1.5rem" }}>{emoji}</span>
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
