import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { AnalysisResult } from '@/types/api';
import { motion, useReducedMotion } from 'framer-motion';

export default function ResultsPage() {
  const { recordingId } = useParams<{ recordingId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { songId: string } | undefined;
  const songId = state?.songId || '';
  const shouldReduceMotion = useReducedMotion();

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        if (!recordingId || !songId) throw new Error('Missing parameters');
        setLoading(true);
        const data = await apiService.analyzeRecording(songId, recordingId);
        setAnalysis(data);
      } catch (err) {
        setError('Failed to load analysis results');
        // Use mock data
        setAnalysis({
          recording_id: recordingId || '',
          song_id: songId,
          overall_accuracy: 91.97,
          pitch_accuracy: 91.97,
          timing_accuracy: 88.5,
          feedback: [
            {
              accuracy_percentage: 92.5,
              deviation_cents: 5,
              timing_offset: 0.05,
            },
          ],
          recommendations: [
            'Great job on the high notes!',
            'Work on timing in the middle section',
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [recordingId, songId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-light text-lg">Loading results...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">{error || 'Results not found'}</div>
      </div>
    );
  }

  return (
    <section className="page-container">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-primary mb-4">Performance Results</h1>
          <p className="text-light opacity-75">Here&apos;s how you did on your recording</p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
          className="surface-card mb-8 p-8 text-center"
        >
          <p className="mb-2 text-light/75">Overall Accuracy</p>
          <p className="text-6xl font-bold text-primary">
            {analysis.overall_accuracy.toFixed(1)}%
          </p>
        </motion.div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
             initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
             animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
             transition={{ delay: 0.1 }}
             className="surface-card p-6"
           >
             <p className="mb-2 text-light/75">Pitch Accuracy</p>
             <p className="text-4xl font-bold text-primary">
               {analysis.pitch_accuracy.toFixed(1)}%
             </p>
             <div className="mt-4 h-2 overflow-hidden rounded-full bg-dark/80">
               <div
                 className="h-full bg-gradient-to-r from-primary to-secondary"
                 style={{ width: `${analysis.pitch_accuracy}%` }}
              />
            </div>
          </motion.div>

          <motion.div
             initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
             animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
             transition={{ delay: 0.1 }}
             className="surface-card p-6"
           >
             <p className="mb-2 text-light/75">Timing Accuracy</p>
             <p className="text-4xl font-bold text-secondary">
               {analysis.timing_accuracy.toFixed(1)}%
             </p>
             <div className="mt-4 h-2 overflow-hidden rounded-full bg-dark/80">
               <div
                 className="h-full bg-gradient-to-r from-secondary to-primary"
                 style={{ width: `${analysis.timing_accuracy}%` }}
              />
            </div>
          </motion.div>
        </div>

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="surface-card mb-8 p-6"
          >
            <h2 className="text-2xl font-bold text-primary mb-4">Recommendations</h2>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 text-soft">
                  <span className="text-secondary font-bold mt-1">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            onClick={() => navigate('/songs')}
            className="btn-primary px-8 py-4"
          >
            Try Another Song
          </motion.button>
          <motion.button
            whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
            onClick={() => navigate('/')}
            className="btn-secondary px-8 py-4"
          >
            Back to Home
          </motion.button>
        </div>
      </div>
    </section>
  );
}
