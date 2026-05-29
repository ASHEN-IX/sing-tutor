export interface PitchDataPoint {
  timestamp: number;
  frequency: number; // Hz
  confidence: number; // 0-1
}

export interface ReferenceData {
  song_id: string;
  title: string;
  artist: string;
  duration: number;
  pitch_data: PitchDataPoint[];
}

export interface UserRecording {
  recording_id: string;
  song_id: string;
  user_id: string;
  duration: number;
  timestamp: string;
}

export interface PitchFeedback {
  accuracy_percentage: number; // 0-100
  deviation_cents: number; // Cents from target
  timing_offset: number; // Milliseconds
}

export interface SongMetadata {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  key: string; // e.g., "C", "C#", etc.
  difficulty: string; // beginner, intermediate, advanced
}

export interface AnalysisResult {
  recording_id: string;
  song_id: string;
  overall_accuracy: number;
  pitch_accuracy: number;
  timing_accuracy: number;
  feedback: PitchFeedback[];
  recommendations: string[];
}

export interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: string;
}
