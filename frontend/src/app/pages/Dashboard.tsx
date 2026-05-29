import { motion } from "motion/react";
import { Play, ChevronRight, Flame, Zap, Music2, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const recentSongs = [
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop&auto=format",
    score: 91,
    color: "#9D5CFF",
  },
  {
    title: "Flowers",
    artist: "Miley Cyrus",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=60&h=60&fit=crop&auto=format",
    score: 85,
    color: "#FF3CAC",
  },
  {
    title: "As It Was",
    artist: "Harry Styles",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=60&h=60&fit=crop&auto=format",
    score: 78,
    color: "#00D4FF",
  },
];

const recommended = [
  {
    title: "Anti-Hero",
    artist: "Taylor Swift",
    difficulty: "Beginner",
    cover: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=160&h=160&fit=crop&auto=format",
    xp: 80,
  },
  {
    title: "Golden Hour",
    artist: "JVKE",
    difficulty: "Intermediate",
    cover: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=160&h=160&fit=crop&auto=format",
    xp: 120,
  },
  {
    title: "Cruel Summer",
    artist: "Taylor Swift",
    difficulty: "Intermediate",
    cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&auto=format",
    xp: 110,
  },
  {
    title: "Die With a Smile",
    artist: "Lady Gaga & Bruno Mars",
    difficulty: "Advanced",
    cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=160&h=160&fit=crop&auto=format",
    xp: 180,
  },
];

const progressData = [
  { day: "Mon", score: 65 },
  { day: "Tue", score: 72 },
  { day: "Wed", score: 68 },
  { day: "Thu", score: 80 },
  { day: "Fri", score: 85 },
  { day: "Sat", score: 91 },
  { day: "Sun", score: 88 },
];

const skills = [
  { name: "Pitch Accuracy", value: 82, color: "#9D5CFF" },
  { name: "Timing", value: 75, color: "#FF3CAC" },
  { name: "Breath Control", value: 60, color: "#00D4FF" },
  { name: "Vocal Range", value: 68, color: "#3CFFA0" },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const diffColor: Record<string, string> = {
    Beginner: "#3CFFA0",
    Intermediate: "#9D5CFF",
    Advanced: "#FF3CAC",
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-6" style={{ background: "#0B0F1A" }}>
      <div className="max-w-7xl mx-auto">
        {/* Greeting + stats */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm mb-1" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Good evening 🌙
            </p>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                color: "#E8E0FF",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome back, Alex! 🎤
            </h1>
          </motion.div>

          {/* Quick stats */}
          <div className="flex gap-4">
            {[
              { icon: Flame, label: "Streak", value: "12 days", color: "#FF3CAC" },
              { icon: Zap, label: "Level", value: "14", color: "#9D5CFF" },
              { icon: TrendingUp, label: "This Week", value: "+340 XP", color: "#3CFFA0" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${stat.color}25`,
                  }}
                >
                  <Icon size={16} style={{ color: stat.color }} />
                  <div>
                    <p className="text-xs" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {stat.label}
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: stat.color, fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {stat.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* XP Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-10 p-5 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(157, 92, 255, 0.15)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Level 14 — Rising Star ⭐
              </p>
              <p className="text-xs" style={{ color: "#7B7FA8" }}>
                2,840 / 3,500 XP to Level 15
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "#7B7FA8" }}>
                660 XP to go
              </p>
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "81%" }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #9D5CFF, #FF3CAC)" }}
            />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    color: "#E8E0FF",
                    fontSize: "1.1rem",
                  }}
                >
                  Continue Learning
                </h2>
                <button
                  onClick={() => onNavigate("library")}
                  className="text-xs flex items-center gap-1"
                  style={{ color: "#9D5CFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  View all <ChevronRight size={14} />
                </button>
              </div>

              {/* Featured song card */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative overflow-hidden rounded-2xl p-5 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, rgba(157,92,255,0.2) 0%, rgba(255,60,172,0.15) 100%)",
                  border: "1px solid rgba(157, 92, 255, 0.3)",
                }}
                onClick={() => onNavigate("learning")}
              >
                <div className="flex gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop&auto=format"
                    alt="Song"
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-xs mb-1" style={{ color: "#9D5CFF" }}>
                      Last practice: 2 hours ago
                    </p>
                    <h3
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        color: "#E8E0FF",
                        fontSize: "1.1rem",
                      }}
                    >
                      Blinding Lights
                    </h3>
                    <p className="text-xs mb-3" style={{ color: "#7B7FA8" }}>
                      The Weeknd • 78% complete
                    </p>
                    <div className="h-1.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: "78%", background: "linear-gradient(90deg, #9D5CFF, #FF3CAC)" }}
                      />
                    </div>
                  </div>
                  <button
                    className="self-center w-12 h-12 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                      boxShadow: "0 4px 20px rgba(157, 92, 255, 0.5)",
                    }}
                  >
                    <Play size={18} fill="white" className="text-white ml-0.5" />
                  </button>
                </div>
              </motion.div>
            </section>

            {/* Recommended Songs */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    color: "#E8E0FF",
                    fontSize: "1.1rem",
                  }}
                >
                  Recommended for You
                </h2>
                <button
                  onClick={() => onNavigate("library")}
                  className="text-xs flex items-center gap-1"
                  style={{ color: "#9D5CFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Browse all <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recommended.map((song, i) => (
                  <motion.div
                    key={song.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -4 }}
                    className="rounded-xl overflow-hidden cursor-pointer group"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                    onClick={() => onNavigate("learning")}
                  >
                    <div className="relative">
                      <img
                        src={song.cover}
                        alt={song.title}
                        className="w-full aspect-square object-cover"
                      />
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                      >
                        <Play size={20} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: "#E8E0FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {song.title}
                      </p>
                      <p className="text-xs truncate mb-2" style={{ color: "#7B7FA8" }}>
                        {song.artist}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          color: diffColor[song.difficulty],
                          background: `${diffColor[song.difficulty]}18`,
                        }}
                      >
                        {song.difficulty}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Weekly progress chart */}
            <section>
              <h2
                className="mb-4"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  color: "#E8E0FF",
                  fontSize: "1.1rem",
                }}
              >
                Weekly Performance
              </h2>
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={progressData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9D5CFF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#9D5CFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "#7B7FA8", fontSize: 11, fontFamily: "'Space Grotesk', sans-serif" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#7B7FA8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[50, 100]}
                    />
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
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#9D5CFF"
                      strokeWidth={2.5}
                      fill="url(#scoreGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Daily challenge */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(255,60,172,0.12), rgba(157,92,255,0.12))",
                border: "1px solid rgba(255,60,172,0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🎯</span>
                <p className="text-sm font-bold" style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Daily Challenge
                </p>
              </div>
              <p className="text-xs mb-4" style={{ color: "#7B7FA8" }}>
                Sing 3 songs with 85%+ accuracy to earn bonus XP
              </p>
              <div className="flex items-center gap-2 mb-3">
                {[1, 2, 0].map((done, i) => (
                  <div
                    key={i}
                    className="flex-1 h-2 rounded-full"
                    style={{
                      background: done ? "linear-gradient(90deg, #FF3CAC, #9D5CFF)" : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: "#7B7FA8" }}>2/3 songs completed</p>
              <button
                onClick={() => onNavigate("library")}
                className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #FF3CAC, #9D5CFF)" }}
              >
                Continue Challenge →
              </button>
            </div>

            {/* Skill progression */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3
                className="mb-4 text-sm font-bold"
                style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Skill Breakdown
              </h3>
              <div className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {skill.name}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: skill.color, fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {skill.value}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.value}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: skill.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent performances */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3
                className="mb-4 text-sm font-bold"
                style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Recent Performances
              </h3>
              <div className="space-y-3">
                {recentSongs.map((song) => (
                  <div
                    key={song.title}
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onNavigate("results")}
                  >
                    <img src={song.cover} alt={song.title} className="w-9 h-9 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: "#E8E0FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {song.title}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#7B7FA8" }}>
                        {song.artist}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-full"
                      style={{ background: `${song.color}18` }}
                    >
                      <Music2 size={10} style={{ color: song.color }} />
                      <span
                        className="text-xs font-bold"
                        style={{ color: song.color, fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {song.score}%
                      </span>
                    </div>
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
