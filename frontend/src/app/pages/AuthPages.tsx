import { useState } from "react";
import { motion } from "motion/react";
import { Mic2, Eye, EyeOff, ArrowLeft, Mail, Lock, User } from "lucide-react";
import { login, register, requestPasswordReset } from "@/services/authService";
import { getFriendlyApiErrorMessage } from "@/services/errorMessages";
import { AuthUser } from "@/types/auth";

interface AuthPagesProps {
  page: "signin" | "signup" | "forgot";
  onNavigate: (page: string) => void;
  onLogin: (user: AuthUser) => void;
}

export function AuthPages({ page, onNavigate, onLogin }: AuthPagesProps) {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    try {
      if (page === "signin") {
        const user = await login(email, password);
        onLogin(user);
        onNavigate("dashboard");
        return;
      }

      if (page === "signup") {
        const user = await register(email, password, name);
        onLogin(user);
        onNavigate("dashboard");
        return;
      }

      const response = await requestPasswordReset(email);
      setStatus(response.message);
      onNavigate("signin");
    } catch (err) {
      setError(getFriendlyApiErrorMessage(err, "Authentication failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: "#0B0F1A" }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(157,92,255,0.12) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,60,172,0.08) 0%, transparent 70%)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Back button */}
        <button
          type="button"
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-2 mb-8 text-sm transition-colors"
          style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to home
        </button>

        <div
          className="p-8 rounded-3xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(157, 92, 255, 0.2)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)" }}
            >
              <Mic2 size={18} className="text-white" />
            </div>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "1.2rem",
              }}
            >
              VocalAI
            </span>
          </div>

          {/* Title */}
          <h1
            className="mb-2"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "1.8rem",
              color: "#E8E0FF",
              letterSpacing: "-0.02em",
            }}
          >
            {page === "signin" && "Welcome back"}
            {page === "signup" && "Start your journey"}
            {page === "forgot" && "Reset your password"}
          </h1>
          <p className="mb-8 text-sm" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {page === "signin" && "Sign in to continue your singing journey"}
            {page === "signup" && "Create your free account and start singing today"}
            {page === "forgot" && "We'll send you a link to reset your password"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {page === "signup" && (
              <div>
                <label htmlFor="signup-name" className="block text-xs font-semibold mb-2" style={{ color: "#7B7FA8" }}>
                  YOUR NAME
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: "#7B7FA8" }}
                    aria-hidden="true"
                  />
                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    autoComplete="name"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(157, 92, 255, 0.2)",
                      color: "#E8E0FF",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(157, 92, 255, 0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(157, 92, 255, 0.2)")}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold mb-2" style={{ color: "#7B7FA8" }}>
                EMAIL
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#7B7FA8" }} aria-hidden="true" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(157, 92, 255, 0.2)",
                    color: "#E8E0FF",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(157, 92, 255, 0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(157, 92, 255, 0.2)")}
                />
              </div>
            </div>

            {page !== "forgot" && (
              <div>
                <label htmlFor="auth-password" className="block text-xs font-semibold mb-2" style={{ color: "#7B7FA8" }}>
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#7B7FA8" }} aria-hidden="true" />
                  <input
                    id="auth-password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={page === "signup" ? "new-password" : "current-password"}
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(157, 92, 255, 0.2)",
                      color: "#E8E0FF",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(157, 92, 255, 0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(157, 92, 255, 0.2)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "#7B7FA8" }}
                    aria-label={showPass ? "Hide password" : "Show password"}
                    aria-pressed={showPass}
                  >
                    {showPass ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
                {page === "signin" && (
                  <button
                    type="button"
                    onClick={() => onNavigate("forgot")}
                    className="text-xs mt-2 float-right"
                    style={{ color: "#9D5CFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-4 rounded-xl text-white font-bold mt-2"
              style={{
                background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
                boxShadow: "0 8px 24px rgba(157, 92, 255, 0.4)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "0.95rem",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Please wait..."
                : page === "signin"
                ? "Sign In →"
                : page === "signup"
                ? "Create Account →"
                : "Send Reset Link →"}
            </motion.button>
          </form>

          {error && (
            <p
              className="text-sm mt-4"
              style={{ color: "#FF8ACD", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              role="alert"
              aria-live="polite"
            >
              {error}
            </p>
          )}

          {status && (
            <p
              className="text-sm mt-4"
              style={{ color: "#3CFFA0", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              aria-live="polite"
            >
              {status}
            </p>
          )}

          {/* Divider */}
          {page !== "forgot" && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                <span className="text-xs" style={{ color: "#7B7FA8" }}>or continue with</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>
              <button
                type="button"
                className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#E8E0FF",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <span>🌐</span> Continue with Google
              </button>
            </>
          )}

          {/* Footer link */}
          <p className="text-center text-sm mt-6" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {page === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => onNavigate("signup")}
                  style={{ color: "#9D5CFF", fontWeight: 600 }}
                >
                  Sign up free
                </button>
              </>
            ) : page === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => onNavigate("signin")}
                  style={{ color: "#9D5CFF", fontWeight: 600 }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Remember it?{" "}
                <button
                  type="button"
                  onClick={() => onNavigate("signin")}
                  style={{ color: "#9D5CFF", fontWeight: 600 }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
