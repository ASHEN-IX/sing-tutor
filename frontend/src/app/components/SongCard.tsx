import { Play, Star, Clock, Music } from "lucide-react";
import { motion } from "motion/react";

export interface Song {
  id: string;
  title: string;
  artist: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  genre: string;
  cover: string;
  xp: number;
  rating: number;
}

interface SongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
}

const difficultyColors: Record<Song["difficulty"], { bg: string; text: string }> = {
  Beginner: { bg: "rgba(60, 255, 160, 0.15)", text: "#3CFFA0" },
  Intermediate: { bg: "rgba(157, 92, 255, 0.15)", text: "#9D5CFF" },
  Advanced: { bg: "rgba(255, 60, 172, 0.15)", text: "#FF3CAC" },
};

export function SongCard({ song, onPlay }: SongCardProps) {
  const diff = difficultyColors[song.difficulty];

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      type="button"
      className="group relative rounded-2xl overflow-hidden cursor-pointer text-left w-full"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(157, 92, 255, 0.12)",
        backdropFilter: "blur(10px)",
      }}
      onClick={() => onPlay(song)}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={song.cover}
          alt={`${song.title} cover`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 40%, rgba(11,15,26,0.95) 100%)" }}
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #9D5CFF, #FF3CAC)",
              boxShadow: "0 0 30px rgba(157, 92, 255, 0.6)",
            }}
          >
            <Play size={20} className="text-white ml-1" fill="white" aria-hidden="true" />
          </div>
        </div>
        {/* Difficulty badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: diff.bg, color: diff.text, border: `1px solid ${diff.text}40` }}
        >
          {song.difficulty}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="text-sm font-semibold mb-0.5 truncate"
          style={{ color: "#E8E0FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {song.title}
        </h3>
        <p className="text-xs mb-3 truncate" style={{ color: "#7B7FA8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {song.artist}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock size={11} style={{ color: "#7B7FA8" }} aria-hidden="true" />
              <span className="text-xs" style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
                {song.duration}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={11} style={{ color: "#FFD700" }} fill="#FFD700" aria-hidden="true" />
              <span className="text-xs" style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }}>
                {song.rating}
              </span>
            </div>
          </div>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: "rgba(157, 92, 255, 0.12)" }}
          >
            <Music size={10} style={{ color: "#9D5CFF" }} aria-hidden="true" />
            <span className="text-xs font-bold" style={{ color: "#9D5CFF", fontFamily: "'Space Grotesk', sans-serif" }}>
              +{song.xp} XP
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {song.genre.split("/").map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#7B7FA8",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {g.trim()}
            </span>
          ))}
        </div>
      </div>
    </motion.button>
  );
}
