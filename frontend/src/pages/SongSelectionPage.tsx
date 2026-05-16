import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { SongMetadata } from '@/types/api';
import SongCard from '@/components/SongCard';
import { motion } from 'framer-motion';

export default function SongSelectionPage() {
  const [songs, setSongs] = useState<SongMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSongs();
      setSongs(data);
    } catch (err) {
      setError('Failed to load songs. Using mock data...');
      // Use mock data
      setSongs([
        {
          id: 'song_001',
          title: 'Perfect',
          artist: 'Ed Sheeran',
          duration: 263,
          bpm: 84,
          key: 'A',
          difficulty: 'beginner',
        },
        {
          id: 'song_002',
          title: 'Bohemian Rhapsody',
          artist: 'Queen',
          duration: 354,
          bpm: 72,
          key: 'B',
          difficulty: 'advanced',
        },
        {
          id: 'song_003',
          title: 'Hallelujah',
          artist: 'Leonard Cohen',
          duration: 278,
          bpm: 60,
          key: 'C',
          difficulty: 'intermediate',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-primary mb-4">Select a Song</h1>
          <p className="text-light opacity-75">
            Choose from our collection of songs to start practicing
          </p>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-500 rounded-lg text-yellow-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-light text-lg">Loading songs...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <SongCard song={song} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
