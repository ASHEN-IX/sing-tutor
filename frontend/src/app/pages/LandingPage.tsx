import { motion } from "motion/react";
import { Mic2, Zap, BarChart3, Trophy, Star, ChevronRight, Play } from "lucide-react";
import { MelodyCurve } from "../components/MelodyCurve";
import { ThreeDVisualizer } from "../components/ThreeDVisualizer";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const features = [
  {
    icon: Mic2,
    title: "Real-Time Voice Analysis",
    desc: "AI listens to your pitch and timing instantly, giving you feedback note by note.",
    color: "#9D5CFF",
  },
  {
    icon: BarChart3,
    title: "Visual Melody Guidance",
    desc: "See exactly where your voice should go — no sheet music, just flowing curves.",
    color: "#FF3CAC",
  },
  {
    icon: Zap,
    title: "Instant AI Coaching",
    desc: "Smart hints guide you through every phrase. Improve faster than any traditional lesson.",
    color: "#00D4FF",
  },
  {
    icon: Trophy,
    title: "Gamified Progress",
    desc: "Earn XP, unlock songs, and streak your way to becoming a confident singer.",
    color: "#3CFFA0",
  },
];

const testimonials = [
  {
    name: "Zoe Martinez",
    age: 16,
    quote: "I went from zero to singing full songs in 3 weeks. The melody curve makes everything click!",
    avatar: "ZM",
    stars: 5,
  },
  {
    name: "Kai Nguyen",
    age: 15,
    quote: "It's like having a music teacher in my phone. The AI feedback is actually useful.",
    avatar: "KN",
    stars: 5,
  },
  {
    name: "Aria Johnson",
    age: 17,
    quote: "My voice teacher said I improved more in one month with this app than in a year of lessons.",
    avatar: "AJ",
    stars: 5,
  },
];

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#0B0F1A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(157,92,255,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[20%] right-[-100px] w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,60,172,0.1) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[10%] left-[30%] w-[500px] h-[300px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: "rgba(157, 92, 255, 0.12)",
                border: "1px solid rgba(157, 92, 255, 0.3)",
              }}
            >
              <span style={{ color: "#9D5CFF" }} className="text-sm font-semibold">
                ✨ AI-Powered Singing Coach
              </span>
            </div>

            <h1
              className="mb-6 leading-none"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.8rem, 6vw, 5rem)",
                color: "#E8E0FF",
                letterSpacing: "-0.03em",
              }}
            >
              Turn every note
              <br />
              into{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #9D5CFF 0%, #FF3CAC 50%, #00D4FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                confidence.
              </span>
            </h1>

            <p
              className="mb-10 max-w-lg leading-relaxed"
              style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "1.125rem" }}
            >
              VocalAI teaches you to sing through beautiful visual guidance, real-time pitch analysis,
              and AI coaching that makes every practice session feel like a game.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate("signup")}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold"
                style={{
                  background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                  boxShadow: "0 8px 32px rgba(157, 92, 255, 0.45)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Start Singing Free <ChevronRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate("learning")}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#E8E0FF",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <Play size={16} fill="currentColor" /> Watch Demo
              </motion.button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-2">
                {["#9D5CFF", "#FF3CAC", "#00D4FF", "#3CFFA0"].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs text-white font-bold"
                    style={{ background: c, borderColor: "#0B0F1A" }}
                  >
                    {["ZM", "KN", "AJ", "LR"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="#FFD700" style={{ color: "#FFD700" }} />
                  ))}
                </div>
                <span className="text-xs" style={{ color: "#7B7FA8" }}>
                  Loved by 50,000+ teen singers
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right — Hero Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="relative"
          >
            <div
              className="rounded-3xl overflow-hidden p-6"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(157, 92, 255, 0.2)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 32px 80px rgba(157, 92, 255, 0.15)",
              }}
            >
              {/* Mini player header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl"
                  style={{ background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)" }}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}>
                    Blinding Lights
                  </p>
                  <p className="text-xs" style={{ color: "#7B7FA8" }}>The Weeknd • Intermediate</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)" }}
                  >
                    <Play size={12} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* 3D Visualizer sound wave sphere */}
              <div className="my-4">
                <ThreeDVisualizer isPlaying={true} />
              </div>

              {/* Lyrics */}
              <div className="mt-4 text-center py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p
                  className="text-sm font-semibold"
                  style={{
                    background: "linear-gradient(90deg, #9D5CFF, #FF3CAC)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  I said ooh, I'm blinding lights ✨
                </p>
                <p className="text-xs mt-1" style={{ color: "#7B7FA8" }}>
                  I can't sleep until I feel your touch
                </p>
              </div>

              {/* Coaching hint */}
              <div
                className="mt-3 flex items-center gap-2 p-3 rounded-xl"
                style={{ background: "rgba(0, 212, 255, 0.08)", border: "1px solid rgba(0, 212, 255, 0.2)" }}
              >
                <span>💡</span>
                <span className="text-xs font-medium" style={{ color: "#00D4FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Raise your voice slightly on "blinding"
                </span>
              </div>
            </div>

            {/* Floating score card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-8 p-4 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
              }}
            >
              <p className="text-xs mb-1" style={{ color: "#7B7FA8" }}>Pitch Accuracy</p>
              <p
                className="font-bold"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: "linear-gradient(135deg, #3CFFA0, #00D4FF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: "1.5rem",
                }}
              >
                94%
              </p>
            </motion.div>

            {/* Floating XP card */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -top-4 -right-6 p-3 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
              }}
            >
              <p className="text-xs font-bold" style={{ color: "#FFD700", fontFamily: "'Space Grotesk', sans-serif" }}>
                🏆 +120 XP
              </p>
              <p className="text-xs" style={{ color: "#7B7FA8" }}>Song completed!</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2
            className="mb-4"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#E8E0FF",
              letterSpacing: "-0.02em",
            }}
          >
            Everything you need to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              sound amazing
            </span>
          </h2>
          <p style={{ color: "#7B7FA8" }} className="max-w-2xl mx-auto">
            No music theory. No intimidating sheet music. Just you, your voice, and a beautiful visual journey.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="p-6 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}
                >
                  <Icon size={22} style={{ color: f.color }} />
                </div>
                <h3
                  className="mb-2 text-base"
                  style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7B7FA8" }}>
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Gamification preview */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              className="mb-4"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 4vw, 2.8rem)",
                color: "#E8E0FF",
                letterSpacing: "-0.02em",
              }}
            >
              Practice feels like{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #FF3CAC, #9D5CFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                playing a game
              </span>
            </h2>
            <p className="mb-8" style={{ color: "#7B7FA8", lineHeight: "1.8" }}>
              Earn XP after every session, unlock new songs, keep your streak alive, and compete with friends.
              Progress that you can see, feel, and brag about.
            </p>
            <ul className="space-y-3">
              {["Daily streak rewards", "Level up your singer rank", "Unlock exclusive songs", "Badge collection"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #3CFFA0, #00D4FF)" }}
                    >
                      <span className="text-xs">✓</span>
                    </div>
                    <span className="text-sm" style={{ color: "#E8E0FF" }}>
                      {item}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* XP Cards grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Level", value: "14", icon: "⚡", color: "#9D5CFF" },
              { label: "Day Streak", value: "12 🔥", icon: "🔥", color: "#FF3CAC" },
              { label: "Songs Mastered", value: "23", icon: "🎵", color: "#00D4FF" },
              { label: "Total XP", value: "2,840", icon: "⭐", color: "#3CFFA0" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.04 }}
                className="p-5 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${stat.color}25`,
                }}
              >
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p
                  className="mb-1"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.75rem",
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: "#7B7FA8" }}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              color: "#E8E0FF",
              letterSpacing: "-0.02em",
            }}
          >
            Real singers, real results
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="p-6 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.stars)].map((_, si) => (
                  <Star key={si} size={14} fill="#FFD700" style={{ color: "#FFD700" }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-6 italic" style={{ color: "#B8B0D0" }}>
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)" }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#E8E0FF", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: "#7B7FA8" }}>
                    Age {t.age}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-16 rounded-3xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(157,92,255,0.15) 0%, rgba(255,60,172,0.1) 100%)",
            border: "1px solid rgba(157, 92, 255, 0.3)",
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(circle at 30% 50%, rgba(157,92,255,0.4) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(255,60,172,0.4) 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <h2
              className="mb-4"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                color: "#E8E0FF",
                letterSpacing: "-0.02em",
              }}
            >
              Your vocal journey starts now.
            </h2>
            <p className="mb-8" style={{ color: "#7B7FA8" }}>
              Join 50,000+ teens already singing with confidence. Free forever.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate("signup")}
              className="px-10 py-4 rounded-2xl text-white font-bold"
              style={{
                background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                boxShadow: "0 12px 40px rgba(157, 92, 255, 0.5)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "1.05rem",
              }}
            >
              Start Singing Free →
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t" style={{ borderColor: "rgba(157,92,255,0.12)" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Mic2 size={16} style={{ color: "#9D5CFF" }} />
            <span style={{ color: "#9D5CFF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
              VocalAI
            </span>
          </div>
          <p className="text-xs" style={{ color: "#7B7FA8" }}>
            © 2026 VocalAI. Built for the next generation of singers.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms", "Support"].map((l) => (
              <button key={l} className="text-xs" style={{ color: "#7B7FA8" }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
