import axios from 'axios';
import { PitchAnalysisResponse } from '@/types/pitch';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const analysisService = {
  async analyzePitch(audioBlob: Blob): Promise<PitchAnalysisResponse> {
    const formData = new FormData();

    const file = new File([audioBlob], 'recording.wav', {
      type: audioBlob.type || 'audio/wav',
    });

    formData.append('file', file);

    const response = await axios.post<PitchAnalysisResponse>(
      `${API_BASE_URL}/api/analysis/pitch`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },
};
