import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePitchAnalysis } from '@/hooks/usePitchAnalysis';
import { analysisService } from '@/services/analysisService';

vi.mock('@/services/analysisService', () => ({
  analysisService: {
    analyzePitch: vi.fn(),
  },
}));

describe('usePitchAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores analysis data and clears loading after success', async () => {
    const response = {
      sample_rate: 16000,
      duration: 1.2,
      num_points: 1,
      pitch_data: [{ timestamp: 0, frequency: 440, confidence: 0.9 }],
    };

    vi.mocked(analysisService.analyzePitch).mockResolvedValue(response);

    const { result } = renderHook(() => usePitchAnalysis());

    await act(async () => {
      await result.current.analyzePitch(new Blob(['audio'], { type: 'audio/wav' }));
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.analysis).toEqual(response);
    });
  });

  it('sets error when analysis fails', async () => {
    vi.mocked(analysisService.analyzePitch).mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => usePitchAnalysis());

    await act(async () => {
      await result.current.analyzePitch(new Blob(['audio'], { type: 'audio/wav' }));
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.analysis).toBeNull();
      expect(result.current.error).toBe('Failed to analyze pitch audio');
    });
  });
});
