import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { SongMetadata } from '@/types/api';
import { PitchDataPoint } from '@/types/pitch';
import { usePitchAnalysis } from '@/hooks/usePitchAnalysis';
import PitchVisualizer from '@/components/PitchVisualizer';
import { motion, useReducedMotion } from 'framer-motion';

export default function RecordingPage() {
  const { songId } = useParams<{ songId: string }>();
  const [song, setSong] = useState<SongMetadata | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [songLoading, setSongLoading] = useState(true);
  const [songError, setSongError] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const { analysis, loading: analysisLoading, error: analysisError, analyzePitch, resetAnalysis } = usePitchAnalysis();

  useEffect(() => {
    const fetchSong = async () => {
      try {
        if (!songId) throw new Error('No song ID provided');
        const data = await apiService.getSong(songId);
        setSong(data);
      } catch (err) {
        setSongError('Failed to load song');
        console.error(err);
      } finally {
        setSongLoading(false);
      }
    };

    fetchSong();
  }, [songId]);

  const startRecording = async () => {
    try {
      resetAnalysis();
      setRecordingBlob(null);
      setRecordingError(null);
      setIsRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blobType = recorder.mimeType || 'audio/wav';
        const audioBlob = new Blob(chunksRef.current, { type: blobType });
        setRecordingBlob(audioBlob);
        await analyzePitch(audioBlob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      setRecordingError('Failed to start recording. Check microphone permissions.');
      setIsRecording(false);
      console.error(err);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      setRecordingError('Error stopping recording');
      console.error('Error stopping recording:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!analysis?.pitch_data.length) {
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex(0);
    const points = analysis.pitch_data;
    const intervalMs = Math.max(50, Math.round((analysis.duration * 1000) / points.length));

    const intervalId = window.setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= points.length - 1) {
          window.clearInterval(intervalId);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [analysis]);

  const currentPitch: PitchDataPoint | null = useMemo(() => {
    if (!analysis?.pitch_data.length) {
      return null;
    }
    return analysis.pitch_data[Math.min(currentIndex, analysis.pitch_data.length - 1)];
  }, [analysis, currentIndex]);

  const pageError = songError || recordingError || analysisError;

  if (songLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-light text-lg">Loading...</div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">{songError || 'Song not found'}</div>
      </div>
    );
  }

  return (
    <section className="page-container">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">{song.title}</h1>
          <p className="text-light opacity-75">{song.artist}</p>
        </motion.div>

        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="surface-card p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">Song Details</h2>
            <div className="space-y-4 text-soft">
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
            {currentPitch ? (
              <PitchVisualizer
                currentFrequency={currentPitch.frequency}
                targetFrequency={440}
                confidence={currentPitch.confidence}
              />
            ) : (
              <div className="surface-card flex h-full items-center justify-center p-6 text-soft">
                {analysisLoading ? 'Analyzing recording...' : 'Record your voice to see pitch analysis'}
              </div>
            )}
          </div>
        </div>

        {analysis && (
          <div className="surface-card mb-8 flex flex-col gap-2 p-4 text-sm text-soft sm:flex-row sm:items-center sm:justify-between">
            <span>Analyzed points: {analysis.num_points}</span>
            <span>Duration: {analysis.duration.toFixed(2)}s</span>
            <span>Sample rate: {analysis.sample_rate} Hz</span>
          </div>
        )}

        {recordingBlob && (
          <div className="mb-8 text-center text-light opacity-75 text-sm">
            Captured audio size: {(recordingBlob.size / 1024).toFixed(1)} KB
          </div>
        )}

        <div className="text-center mb-8">
          {!isRecording ? (
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={startRecording}
              disabled={analysisLoading}
              className="btn-primary px-12 text-lg disabled:opacity-50"
            >
              {analysisLoading ? 'Analyzing...' : '🎙️ Start Recording'}
            </motion.button>
          ) : (
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              onClick={stopRecording}
              className="btn-primary px-12 text-lg"
            >
              ⏹️ Stop Recording
            </motion.button>
          )}
        </div>

        {pageError && (
          <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-center text-red-200">
            {pageError}
          </div>
        )}
      </div>
    </section>
  );
}
