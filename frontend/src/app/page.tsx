"use client";

import { useState } from "react";
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
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<PitchAnalysisResponse | null>(null);

  const navigate = (p: string, songId?: string) => {
    setPage(p as Page);
    if (songId) setActiveSongId(songId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    setPage("dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPage("landing");
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
    </div>
  );
}
