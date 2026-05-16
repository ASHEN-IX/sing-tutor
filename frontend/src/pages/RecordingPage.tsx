import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { webSocketService } from '@/services/websocket';
import { SongMetadata, PitchDataPoint } from '@/types/api';
import PitchVisualizer from '@/components/PitchVisualizer';
import { motion } from 'framer-motion';

export default function RecordingPage() {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<SongMetadata | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchDataPoint | null>(null);
  const [recordingId] = useState(`rec_${Date.now()}`);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSong();
  }, [songId]);

  const fetchSong = async () => {
    try {
      if (!songId) throw new Error('No song ID provided');
      const data = await apiService.getSong(songId);
      setSong(data);
    } catch (err) {
      setError('Failed to load song');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setError(null);

      // Connect to WebSocket for pitch streaming
      const wsUrl = `ws://${window.location.host}/ws/pitch/${recordingId}`;
      await webSocketService.connect(wsUrl);

      webSocketService.onMessage((data) => {
        setCurrentPitch(data);
      });
    } catch (err) {
      setError('Failed to start recording');
      setIsRecording(false);
      console.error(err);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      webSocketService.disconnect();

      // Navigate to results page after a short delay
      setTimeout(() => {
        navigate(`/results/${recordingId}`, { state: { songId } });
      }, 500);
    } catch (err) {
      console.error('Error stopping recording:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-light text-lg">Loading...</div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">{error || 'Song not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">{song.title}</h1>
          <p className="text-light opacity-75">{song.artist}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 backdrop-blur-md border border-primary border-opacity-20">
            <h2 className="text-2xl font-bold text-primary mb-4">Song Details</h2>
            <div className="space-y-4 text-light">
              <div>
                <p className="text-sm opacity-50">Duration</p>
                <p className="text-lg font-mono">{(song.duration / 60).toFixed(1)} minutes</p>
              </div>
              <div>
                <p className="text-sm opacity-50">BPM</p>
                <p className="text-lg font-mono">{song.bpm}</p>
              </div>
              <div>
                <p className="text-sm opacity-50">Key</p>
                <p className="text-lg font-mono">{song.key}</p>
              </div>
              <div>
                <p className="text-sm opacity-50">Difficulty</p>
                <p className="text-lg font-mono capitalize">{song.difficulty}</p>
              </div>
            </div>
          </div>

          <div>
            {currentPitch && (
              <PitchVisualizer
                currentFrequency={currentPitch.frequency}
                targetFrequency={440}
                confidence={currentPitch.confidence}
              />
            )}
          </div>
        </div>

        <div className="text-center mb-8">
          {!isRecording ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              className="px-12 py-4 bg-primary text-dark font-bold rounded-lg hover:bg-secondary transition-colors text-lg"
            >
              🎙️ Start Recording
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              className="px-12 py-4 bg-secondary text-dark font-bold rounded-lg hover:bg-primary transition-colors text-lg"
            >
              ⏹️ Stop Recording
            </motion.button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
