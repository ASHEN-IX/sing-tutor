import { useState } from 'react';
import axios from 'axios';
import { analysisService } from '@/services/analysisService';
import { PitchAnalysisResponse } from '@/types/pitch';

export function usePitchAnalysis() {
  const [analysis, setAnalysis] = useState<PitchAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzePitch = async (audioBlob: Blob): Promise<PitchAnalysisResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await analysisService.analyzePitch(audioBlob);
      setAnalysis(response);
      return response;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.detail;
        setError(typeof message === 'string' ? message : 'Failed to analyze pitch audio');
      } else {
        setError('Failed to analyze pitch audio');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    setError(null);
  };

  return {
    analysis,
    loading,
    error,
    analyzePitch,
    resetAnalysis,
  };
}
