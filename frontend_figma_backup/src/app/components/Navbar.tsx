import { Music2, Mic2, BookOpen, Trophy, User, Bell, LogOut, ChevronDown, Upload } from "lucide-react";
import { motion } from "motion/react";

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, songId?: string) => void;
  isLoggedIn: boolean;
}

const navItems = [
  { id: "dashboard", label: "Home", icon: Music2 },
  { id: "library", label: "Songs", icon: BookOpen },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "gamification", label: "Challenges", icon: Trophy },
  { id: "profile", label: "Profile", icon: User },
];

export function Navbar({ currentPage, onNavigate, isLoggedIn }: NavbarProps) {
  return (
    <nav
      style={{
        background: "rgba(11, 15, 26, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(157, 92, 255, 0.15)",
      }}
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
    >
      {/* Logo */}
      <button
        onClick={() => onNavigate(isLoggedIn ? "dashboard" : "landing")}
        className="flex items-center gap-2 mr-8"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)" }}
        >
          <Mic2 size={16} className="text-white" />
        </div>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          className="text-lg"
        >
          VocalAI
        </span>
      </button>

      {isLoggedIn ? (
        <>
          {/* Nav Items */}
          <div className="flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative"
                  style={{
                    color: active ? "#9D5CFF" : "#7B7FA8",
                    background: active ? "rgba(157, 92, 255, 0.12)" : "transparent",
                  }}
                >
                  <Icon size={16} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }} className="text-sm">
                    {item.label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: "linear-gradient(90deg, #9D5CFF, #FF3CAC)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* XP Badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(157, 92, 255, 0.15)", border: "1px solid rgba(157, 92, 255, 0.3)" }}
            >
              <Trophy size={12} style={{ color: "#FFD700" }} />
              <span style={{ color: "#9D5CFF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }} className="text-xs">
                2,840 XP
              </span>
            </div>
            {/* Streak */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255, 60, 172, 0.12)", border: "1px solid rgba(255, 60, 172, 0.25)" }}
            >
              <span className="text-xs">🔥</span>
              <span style={{ color: "#FF3CAC", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }} className="text-xs">
                12 days
              </span>
            </div>
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ color: "#7B7FA8" }}
            >
              <Bell size={16} />
            </button>
            {/* Avatar */}
            <button
              className="flex items-center gap-2"
              onClick={() => onNavigate("profile")}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)" }}
              >
                AJ
              </div>
              <ChevronDown size={12} style={{ color: "#7B7FA8" }} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => onNavigate("signin")}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="px-4 py-2 rounded-lg text-sm text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              boxShadow: "0 4px 20px rgba(157, 92, 255, 0.4)",
            }}
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
}
