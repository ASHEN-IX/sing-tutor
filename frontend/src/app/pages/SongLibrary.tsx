import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, SlidersHorizontal, Plus, Loader2 } from "lucide-react";
import { SongCard, Song } from "../components/SongCard";
import axios from "axios";

interface SongLibraryProps {
  onNavigate: (page: string, songId?: string) => void;
}

const fallbackSongs: Song[] = [
  {
    id: "1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    difficulty: "Intermediate",
    duration: "3:20",
    genre: "Pop / Synth",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format",
    xp: 120,
    rating: 4.9,
  },
  {
    id: "2",
    title: "Anti-Hero",
    artist: "Taylor Swift",
    difficulty: "Beginner",
    duration: "3:20",
    genre: "Pop / Indie",
    cover: "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=300&h=300&fit=crop&auto=format",
    xp: 80,
    rating: 4.8,
  },
  {
    id: "3",
    title: "As It Was",
    artist: "Harry Styles",
    difficulty: "Beginner",
    duration: "2:37",
    genre: "Pop",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&auto=format",
    xp: 75,
    rating: 4.7,
  },
  {
    id: "4",
    title: "Flowers",
    artist: "Miley Cyrus",
    difficulty: "Beginner",
    duration: "3:20",
    genre: "Pop",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format",
    xp: 80,
    rating: 4.6,
  },
  {
    id: "5",
    title: "Die With a Smile",
    artist: "Lady Gaga & Bruno Mars",
    difficulty: "Advanced",
    duration: "4:11",
    genre: "Pop / R&B",
    cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop&auto=format",
    xp: 180,
    rating: 4.9,
  },
  {
    id: "6",
    title: "Golden Hour",
    artist: "JVKE",
    difficulty: "Intermediate",
    duration: "2:52",
    genre: "Pop",
    cover: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=300&h=300&fit=crop&auto=format",
    xp: 110,
    rating: 4.8,
  },
  {
    id: "7",
    title: "Cruel Summer",
    artist: "Taylor Swift",
    difficulty: "Intermediate",
    duration: "2:58",
    genre: "Pop / Synth",
    cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format",
    xp: 115,
    rating: 4.8,
  },
  {
    id: "8",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    difficulty: "Advanced",
    duration: "5:55",
    genre: "Rock / Classic",
    cover: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=300&h=300&fit=crop&auto=format",
    xp: 220,
    rating: 5.0,
  },
];

const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];
const genres = ["All", "Pop", "Synth", "Rock", "R&B", "Indie", "Classic"];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const coverImages = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=300&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=300&h=300&fit=crop&auto=format",
];

export function SongLibrary({ onNavigate }: SongLibraryProps) {
  const [query, setQuery] = useState("");
  const [activeDiff, setActiveDiff] = useState("All");
  const [activeGenre, setActiveGenre] = useState("All");
  const [songs, setSongs] = useState<Song[]>(fallbackSongs);
  const [loading, setLoading] = useState(true);

  // Fetch real songs from the API and merge with fallback
  useEffect(() => {
    async function fetchSongs() {
      try {
        const res = await axios.get(`${API_BASE}/api/songs`);
        const apiSongs: Song[] = (res.data || []).map((s: any, i: number) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          difficulty: (s.difficulty?.charAt(0).toUpperCase() + s.difficulty?.slice(1)) as Song["difficulty"] || "Beginner",
          duration: formatDuration(s.duration || 0),
          genre: "Pop",
          cover: coverImages[i % coverImages.length],
          xp: Math.round((s.duration || 120) * 0.8),
          rating: 4.5 + Math.random() * 0.5,
        }));

        // Merge: API songs first, then fallback display songs
        const merged = [...apiSongs, ...fallbackSongs];
        setSongs(merged);
      } catch {
        // API not available — use fallback
        setSongs(fallbackSongs);
      } finally {
        setLoading(false);
      }
    }
    fetchSongs();
  }, []);

  const filtered = songs.filter((s) => {
    const matchQ =
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.artist.toLowerCase().includes(query.toLowerCase());
    const matchD = activeDiff === "All" || s.difficulty === activeDiff;
    const matchG = activeGenre === "All" || s.genre.toLowerCase().includes(activeGenre.toLowerCase());
    return matchQ && matchD && matchG;
  });

  return (
    <div className="min-h-screen pt-20 pb-12 px-6" style={{ background: "#0B0F1A" }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-end justify-between">
          <div>
            <h1
              className="mb-1"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                color: "#E8E0FF",
                letterSpacing: "-0.02em",
              }}
            >
              Song Library 🎵
            </h1>
            <p style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {songs.length} songs available • New songs added weekly
            </p>
          </div>

          {/* Upload Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate("upload")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold text-sm"
            style={{
              background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
              boxShadow: "0 4px 20px rgba(157, 92, 255, 0.4)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <Plus size={16} /> Upload Song
          </motion.button>
        </motion.div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#7B7FA8" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs or artists..."
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(157, 92, 255, 0.2)",
                color: "#E8E0FF",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            />
          </div>
          <button
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#7B7FA8",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {/* Difficulty tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDiff(d)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeDiff === d ? "linear-gradient(135deg, #9D5CFF, #FF3CAC)" : "rgba(255,255,255,0.06)",
                color: activeDiff === d ? "#ffffff" : "#7B7FA8",
                border: activeDiff === d ? "none" : "1px solid rgba(255,255,255,0.08)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Genre tags */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className="px-3 py-1 rounded-full text-xs transition-all"
              style={{
                background: activeGenre === g ? "rgba(0, 212, 255, 0.15)" : "rgba(255,255,255,0.04)",
                color: activeGenre === g ? "#00D4FF" : "#7B7FA8",
                border: activeGenre === g ? "1px solid rgba(0, 212, 255, 0.35)" : "1px solid rgba(255,255,255,0.06)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              #{g}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs mb-6" style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
          {loading ? "Loading..." : `${filtered.length} songs found`}
        </p>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin" style={{ color: "#9D5CFF" }} />
          </div>
        )}

        {/* Songs grid */}
        {!loading && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((song, i) => (
              <motion.div
                key={`${song.id}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <SongCard song={song} onPlay={(s) => onNavigate("learning", s.id)} />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🎵</p>
            <p style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
              No songs found. Try a different search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
