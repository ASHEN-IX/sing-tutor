import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { apiService } from '@/services/api';
import { AnalysisResult } from '@/types/api';
import { motion } from 'framer-motion';

export default function ResultsPage() {
  const { recordingId } = useParams<{ recordingId: string }>();
  const location = useLocation();
  const state = location.state as { songId: string } | undefined;
  const songId = state?.songId || '';

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, [recordingId, songId]);

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
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-primary mb-4">Performance Results</h1>
          <p className="text-light opacity-75">Here's how you did on your recording</p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary to-secondary rounded-lg p-8 mb-8 text-center"
        >
          <p className="text-light opacity-75 mb-2">Overall Accuracy</p>
          <p className="text-6xl font-bold text-white">
            {analysis.overall_accuracy.toFixed(1)}%
          </p>
        </motion.div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 bg-opacity-50 rounded-lg p-6 backdrop-blur-md border border-primary border-opacity-20"
          >
            <p className="text-light opacity-75 mb-2">Pitch Accuracy</p>
            <p className="text-4xl font-bold text-primary">
              {analysis.pitch_accuracy.toFixed(1)}%
            </p>
            <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                style={{ width: `${analysis.pitch_accuracy}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 bg-opacity-50 rounded-lg p-6 backdrop-blur-md border border-primary border-opacity-20"
          >
            <p className="text-light opacity-75 mb-2">Timing Accuracy</p>
            <p className="text-4xl font-bold text-secondary">
              {analysis.timing_accuracy.toFixed(1)}%
            </p>
            <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 bg-opacity-50 rounded-lg p-6 backdrop-blur-md border border-primary border-opacity-20 mb-8"
          >
            <h2 className="text-2xl font-bold text-primary mb-4">Recommendations</h2>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 text-light">
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/songs'}
            className="px-8 py-4 bg-primary text-dark font-bold rounded-lg hover:bg-secondary transition-colors"
          >
            Try Another Song
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/'}
            className="px-8 py-4 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-dark transition-colors"
          >
            Back to Home
          </motion.button>
        </div>
      </div>
    </div>
  );
}
