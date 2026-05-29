import { SongMetadata } from '@/types/api';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface SongCardProps {
  song: SongMetadata;
}

export default function SongCard({ song }: SongCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const difficultyColor = {
    beginner: 'text-green-400',
    intermediate: 'text-yellow-400',
    advanced: 'text-red-400',
  }[song.difficulty] || 'text-gray-400';

  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      className="tilt-card surface-card group h-full p-6"
    >
      <Link
        to={`/learn/${song.id}`}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-light group-hover:text-primary transition-colors">
            {song.title}
          </h3>
          <p className="text-secondary text-sm">{song.artist}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-light opacity-75 mb-4">
          <div>
            <p className="text-xs opacity-50">Duration</p>
            <p className="font-mono">{(song.duration / 60).toFixed(1)}m</p>
          </div>
          <div>
            <p className="text-xs opacity-50">BPM</p>
            <p className="font-mono">{song.bpm}</p>
          </div>
          <div>
            <p className="text-xs opacity-50">Key</p>
            <p className="font-mono">{song.key}</p>
          </div>
          <div>
            <p className={`text-xs opacity-50`}>Difficulty</p>
            <p className={`font-mono ${difficultyColor}`}>{song.difficulty}</p>
          </div>
        </div>

        <span className="btn-primary mt-2 w-full">
          Learn Song
        </span>
      </Link>
    </motion.div>
  );
}
