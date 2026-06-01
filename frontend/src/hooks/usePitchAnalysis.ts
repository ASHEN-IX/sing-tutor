import { useState } from 'react';
import { analysisService } from '@/services/analysisService';
import { PitchAnalysisResponse } from '@/types/pitch';
import { getFriendlyApiErrorMessage } from '@/services/errorMessages';

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
      setError(getFriendlyApiErrorMessage(err, 'Could not analyze the audio. Please try again.'));
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
