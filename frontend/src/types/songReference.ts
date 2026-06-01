/**
 * Frontend types for song reference data
 * Mirrors backend Pydantic schemas
 */

/**
 * Single pitch detection sample
 */
export interface PitchDataPoint {
  timestamp: number;
  frequency: number;
  midi: number;
  confidence: number;
}

/**
 * Single word/syllable with timing
 */
export interface LyricsWord {
  index: number;
  word: string;
  start: number;
  end: number;
}

/**
 * Sentence-level lyric display timeline item.
 */
export interface LyricLine {
  index: number;
  text: string;
  words: LyricsWord[];
  start: number;
  end: number;
}

/**
 * Rhythm display timeline item used when a song has no lyrics.
 */
export interface RhythmSegment {
  index: number;
  text: string;
  start: number;
  end: number;
  beat?: number | null;
}

/**
 * Named section of the song
 */
export interface SongSection {
  name: string;
  start: number;
  end: number;
  section_type: "intro" | "verse" | "chorus" | "bridge" | "outro" | "interlude";
}

/**
 * Processing metadata
 */
export interface ProcessingDiagnostics {
  processing_time_seconds: number;
  alignment_quality: number;
  pitch_coverage: number;
  processed_at: string;
  processing_version: string;
}

/**
 * Complete song reference (canonical output of Sprint 2)
 */
export interface SongReference {
  song_id: string;
  title: string;
  artist: string;
  language: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  bpm: number;
  key: string;
  beats: number[];
  pitch_data: PitchDataPoint[];
  /** Word-level lyrics used for lower-level analysis, not sentence display. */
  lyrics: LyricsWord[];
  /** Canonical sentence-level display timeline for the learning UI. */
  lyric_lines?: LyricLine[];
  /** Canonical rhythm display timeline when lyric_lines is empty. */
  rhythm_segments?: RhythmSegment[];
  sections: SongSection[];
  diagnostics: ProcessingDiagnostics;
}

/**
 * Response after file upload
 */
export interface SongUploadResponse {
  song_id: string;
  title: string;
  artist: string;
  status: string;
  message: string;
}

/**
 * Processing status response
 */
export interface ProcessingStatus {
  song_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  error?: string;
}

/**
 * Lightweight preview for frontend display
 */
export interface SongPreviewResponse {
  song_id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  key: string;
  difficulty: string;
  beats_count: number;
  pitch_samples_count: number;
  lyrics_words_count: number;
  sections_count: number;
  alignment_quality: number;
  processed_at?: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Upload form data
 */
export interface UploadFormData {
  audio: File;
  lyrics: File;
  title: string;
  artist: string;
  language: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}
