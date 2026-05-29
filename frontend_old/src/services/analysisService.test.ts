import axios from 'axios';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { analysisService } from '@/services/analysisService';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('analysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads audio blob and returns pitch analysis response', async () => {
    const responseData = {
      sample_rate: 16000,
      duration: 1.0,
      num_points: 2,
      pitch_data: [
        { timestamp: 0, frequency: 440, confidence: 0.9 },
        { timestamp: 0.1, frequency: 442, confidence: 0.88 },
      ],
    };

    vi.mocked(axios.post).mockResolvedValue({ data: responseData });

    const blob = new Blob(['test-audio'], { type: 'audio/wav' });
    const result = await analysisService.analyzePitch(blob);

    expect(result).toEqual(responseData);
    expect(axios.post).toHaveBeenCalledTimes(1);

    const [url, formData, config] = vi.mocked(axios.post).mock.calls[0];
    expect(url).toBe('http://localhost:8000/api/analysis/pitch');
    expect(formData).toBeInstanceOf(FormData);
    expect(config?.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
  });
});
