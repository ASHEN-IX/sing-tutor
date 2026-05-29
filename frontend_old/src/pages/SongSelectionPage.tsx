import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { SongMetadata } from '@/types/api';
import SongCard from '@/components/SongCard';
import { motion, useReducedMotion } from 'framer-motion';

export default function SongSelectionPage() {
  const [songs, setSongs] = useState<SongMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSongs();
      setSongs(data);
    } catch (err) {
      setError('Failed to load songs. Please upload a song first.');
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="song-library-title" className="page-container">
      <div className="surface-card p-6 sm:p-10">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 id="song-library-title" className="section-title mb-4">
            Select a Song
          </h1>
          <p className="section-copy">
            Choose from our collection of songs to start practicing
          </p>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-lg border border-yellow-400/40 bg-yellow-500/10 p-4 text-yellow-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-light text-lg">Loading songs...</div>
          </div>
        ) : songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-primary/20 bg-dark/60 p-8 text-center">
            <p className="text-light text-lg">No songs yet.</p>
            <p className="text-soft">Upload a song to start practicing.</p>
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary"
            >
              Upload Song
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.06, duration: 0.42 }}
              >
                <SongCard song={song} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
