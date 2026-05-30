"use client";

import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./pages/LandingPage";
import { AuthPages } from "./pages/AuthPages";
import { Dashboard } from "./pages/Dashboard";
import { SongLibrary } from "./pages/SongLibrary";
import { LearningPage } from "./pages/LearningPage";
import { RecordingPage } from "./pages/RecordingPage";
import { ResultsPage } from "./pages/ResultsPage";
import { GamificationPage } from "./pages/GamificationPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UploadSongPage } from "./pages/UploadSongPage";
import { PitchAnalysisResponse } from "@/types/pitch";
import { AuthUser } from "@/types/auth";
import { getCurrentUser, logout } from "@/services/authService";
import { getAccessToken } from "@/services/authStore";

type Page =
  | "landing"
  | "signin"
  | "signup"
  | "forgot"
  | "dashboard"
  | "library"
  | "learning"
  | "recording"
  | "results"
  | "gamification"
  | "profile"
  | "upload";

export default function Home() {
  const [page, setPage] = useState<Page>("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<PitchAnalysisResponse | null>(null);

  useEffect(() => {
    if (!getAccessToken()) return;

    let cancelled = false;
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        if (!cancelled) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          setPage((prev) => (prev === "landing" ? "dashboard" : prev));
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const navigate = (p: string, songId?: string) => {
    setPage(p as Page);
    if (songId) setActiveSongId(songId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setPage("dashboard");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setCurrentUser(null);
      setIsLoggedIn(false);
      setPage("landing");
    }
  };

  const showNavbar = page !== "landing";
  const isAuth = page === "signin" || page === "signup" || page === "forgot";

  return (
    <div
      className="min-h-screen text-[#E8E0FF]"
      style={{ background: "#0B0F1A", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {showNavbar && !isAuth && (
        <Navbar currentPage={page} onNavigate={navigate} isLoggedIn={isLoggedIn} />
      )}

      <main id="main-content" className="flex-1">
        {page === "landing" && <LandingPage onNavigate={navigate} />}

        {(page === "signin" || page === "signup" || page === "forgot") && (
          <AuthPages page={page} onNavigate={navigate} onLogin={handleLogin} />
        )}

        {page === "dashboard" && <Dashboard onNavigate={navigate} />}
        {page === "library" && <SongLibrary onNavigate={navigate} />}
        {page === "upload" && <UploadSongPage onNavigate={navigate} />}
        {page === "learning" && <LearningPage onNavigate={navigate} songId={activeSongId} />}
        {page === "recording" && (
          <RecordingPage onNavigate={navigate} songId={activeSongId} onAnalysisComplete={setLatestAnalysis} />
        )}
        {page === "results" && <ResultsPage onNavigate={navigate} songId={activeSongId} analysis={latestAnalysis} />}
        {page === "gamification" && <GamificationPage onNavigate={navigate} />}
        {page === "profile" && <ProfilePage onNavigate={navigate} onLogout={handleLogout} />}
      </main>
    </div>
  );
}
