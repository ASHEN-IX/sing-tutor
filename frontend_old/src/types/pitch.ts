export interface PitchDataPoint {
  timestamp: number;
  frequency: number;
  confidence: number;
}

export interface PitchAnalysisResponse {
  sample_rate: number;
  duration: number;
  num_points: number;
  pitch_data: PitchDataPoint[];
}