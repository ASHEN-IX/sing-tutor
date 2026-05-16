import React from 'react';
import { SongMetadata } from '@/types/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface SongCardProps {
  song: SongMetadata;
}

export default function SongCard({ song }: SongCardProps) {
  const difficultyColor = {
    beginner: 'text-green-400',
    intermediate: 'text-yellow-400',
    advanced: 'text-red-400',
  }[song.difficulty] || 'text-gray-400';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-primary border-opacity-20 hover:border-opacity-50 transition-all cursor-pointer group"
    >
      <Link to={`/recording/${song.id}`} className="block">
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

        <button className="w-full bg-primary text-dark font-bold py-2 rounded-lg group-hover:bg-secondary transition-colors">
          Start Recording
        </button>
      </Link>
    </motion.div>
  );
}
