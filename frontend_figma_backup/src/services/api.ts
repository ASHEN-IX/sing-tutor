import axios, { AxiosInstance } from 'axios';
import {
  SongMetadata,
  ReferenceData,
  AnalysisResult,
} from '@/types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Songs endpoints
  async getSongs(): Promise<SongMetadata[]> {
    const response = await this.client.get<SongMetadata[]>('/api/songs');
    return response.data;
  }

  async getSong(songId: string): Promise<SongMetadata> {
    const response = await this.client.get<SongMetadata>(`/api/songs/${songId}`);
    return response.data;
  }

  async getReferencePitchData(songId: string): Promise<ReferenceData> {
    const response = await this.client.get<ReferenceData>(
      `/api/songs/${songId}/reference-pitch`
    );
    return response.data;
  }

  // Analysis endpoints
  async analyzeRecording(
    songId: string,
    recordingId: string
  ): Promise<AnalysisResult> {
    const response = await this.client.post<AnalysisResult>(
      `/api/recordings/${songId}/analyze`,
      { recording_id: recordingId }
    );
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
