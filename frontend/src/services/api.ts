import axios, { AxiosInstance } from 'axios';
import {
  SongMetadata,
  ReferenceData,
  AnalysisResult,
} from '@/types/api';

const API_BASE_URL = '/api';

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
    const response = await this.client.get<SongMetadata[]>('/songs');
    return response.data;
  }

  async getSong(songId: string): Promise<SongMetadata> {
    const response = await this.client.get<SongMetadata>(`/songs/${songId}`);
    return response.data;
  }

  async getReferencePitchData(songId: string): Promise<ReferenceData> {
    const response = await this.client.get<ReferenceData>(
      `/songs/${songId}/reference`
    );
    return response.data;
  }

  // Analysis endpoints
  async analyzeRecording(
    songId: string,
    recordingId: string
  ): Promise<AnalysisResult> {
    const response = await this.client.post<AnalysisResult>(
      `/recordings/${songId}/analyze`,
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
