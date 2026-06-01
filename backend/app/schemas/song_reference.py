"""
Pydantic schemas for song reference data.

Defines all request/response models and the core SongReference data structure.
"""

from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field


class PitchDataPoint(BaseModel):
    """Single pitch detection sample."""
    timestamp: float = Field(..., description="Time in seconds from start")
    frequency: float = Field(..., ge=0, description="Frequency in Hz")
    midi: float = Field(..., ge=0, le=127, description="MIDI note number (0-127)")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")

    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": 0.032,
                "frequency": 440.2,
                "midi": 69,
                "confidence": 0.97
            }
        }


class LyricsWord(BaseModel):
    """Single word/syllable in lyrics with timing."""
    index: int = Field(..., description="Word position in lyrics")
    word: str = Field(..., description="The word/syllable text")
    start: float = Field(..., ge=0, description="Start time in seconds")
    end: float = Field(..., ge=0, description="End time in seconds")

    class Config:
        json_schema_extra = {
            "example": {
                "index": 0,
                "word": "I",
                "start": 0.50,
                "end": 0.72
            }
        }


class LyricLine(BaseModel):
    """Sentence-level lyric display unit with word timings."""
    index: int = Field(..., description="Sentence index in lyrics")
    text: str = Field(..., description="Sentence text with original punctuation")
    words: List[LyricsWord] = Field(default_factory=list, description="Words in the sentence")
    start: float = Field(..., ge=0, description="Sentence start time in seconds")
    end: float = Field(..., ge=0, description="Sentence end time in seconds")

    class Config:
        json_schema_extra = {
            "example": {
                "index": 0,
                "text": "I've been tryna call",
                "words": [
                    {
                        "index": 0,
                        "word": "I've",
                        "start": 0.0,
                        "end": 0.4
                    }
                ],
                "start": 0.0,
                "end": 1.2
            }
        }


class RhythmSegment(BaseModel):
    """No-lyrics rhythm display unit covering part of the song timeline."""
    index: int = Field(..., description="Rhythm segment index")
    text: str = Field(..., description="Display label for the rhythm segment")
    start: float = Field(..., ge=0, description="Segment start time in seconds")
    end: float = Field(..., ge=0, description="Segment end time in seconds")
    beat: Optional[float] = Field(default=None, ge=0, description="Beat position used for this segment")

    class Config:
        json_schema_extra = {
            "example": {
                "index": 0,
                "text": "Beat 1",
                "start": 0.0,
                "end": 0.714,
                "beat": 0.0
            }
        }


class SongSection(BaseModel):
    """Named section of the song (verse, chorus, etc.)."""
    name: str = Field(..., description="Section name (Verse 1, Chorus, etc.)")
    start: float = Field(..., ge=0, description="Start time in seconds")
    end: float = Field(..., ge=0, description="End time in seconds")
    section_type: Literal["intro", "verse", "chorus", "bridge", "outro", "interlude"] = Field(
        ..., description="Musical section type"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Verse 1",
                "start": 0.0,
                "end": 35.2,
                "section_type": "verse"
            }
        }


class ProcessingDiagnostics(BaseModel):
    """Metadata about the processing run."""
    processing_time_seconds: float = Field(..., description="Total processing time")
    alignment_quality: float = Field(..., ge=0, le=1, description="Lyrics-audio alignment quality")
    alignment_model: Optional[str] = Field(default=None, description="Alignment model used (whisperx, beats)")
    match_ratio: Optional[float] = Field(default=None, ge=0, le=1, description="Raw match ratio from aligner")
    pitch_coverage: float = Field(..., ge=0, le=1, description="Coverage of pitch data")
    processed_at: datetime = Field(..., description="ISO8601 timestamp")
    processing_version: str = Field(default="2.0", description="Pipeline version")

    class Config:
        json_schema_extra = {
            "example": {
                "processing_time_seconds": 14.2,
                "alignment_quality": 0.88,
                "pitch_coverage": 0.95,
                "processed_at": "2026-05-17T14:30:00Z",
                "processing_version": "2.0"
            }
        }


class SongReference(BaseModel):
    """Complete reference map for a song (core output of Sprint 2)."""
    song_id: str = Field(..., description="Unique song identifier (UUID)")
    title: str = Field(..., description="Song title")
    artist: str = Field(..., description="Artist name")
    language: str = Field(default="en", description="ISO 639-1 language code")
    difficulty: Literal["beginner", "intermediate", "advanced"] = Field(
        default="beginner", description="Difficulty level"
    )
    duration: float = Field(..., ge=0, description="Song duration in seconds")
    bpm: float = Field(..., ge=0, description="Beats per minute")
    key: str = Field(..., description="Musical key (e.g., 'A Major', 'C Minor')")
    beats: List[float] = Field(default_factory=list, description="Beat positions (seconds)")
    pitch_data: List[PitchDataPoint] = Field(default_factory=list, description="Pitch contour")
    lyrics: List[LyricsWord] = Field(default_factory=list, description="Word-level lyrics for analysis")
    lyric_lines: List[LyricLine] = Field(default_factory=list, description="Sentence-level lyric display timeline")
    rhythm_segments: List[RhythmSegment] = Field(default_factory=list, description="No-lyrics rhythm display timeline")
    sections: List[SongSection] = Field(default_factory=list, description="Song sections")
    diagnostics: ProcessingDiagnostics = Field(..., description="Processing metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "song_id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Perfect",
                "artist": "Ed Sheeran",
                "language": "en",
                "difficulty": "beginner",
                "duration": 263.0,
                "bpm": 84,
                "key": "A Major",
                "beats": [0.0, 0.714, 1.428],
                "pitch_data": [],
                "lyrics": [],
                "lyric_lines": [],
                "rhythm_segments": [],
                "sections": [],
                "diagnostics": {
                    "processing_time_seconds": 14.2,
                    "alignment_quality": 0.88,
                    "pitch_coverage": 0.95,
                    "processed_at": "2026-05-17T14:30:00Z",
                    "processing_version": "2.0"
                }
            }
        }


# Request/Response Models

class SongMetadataInput(BaseModel):
    """Metadata provided during upload."""
    title: str = Field(..., description="Song title")
    artist: str = Field(..., description="Artist name")
    language: str = Field(default="en", description="ISO 639-1 language code")
    difficulty: Literal["beginner", "intermediate", "advanced"] = Field(
        default="beginner", description="Difficulty level"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Perfect",
                "artist": "Ed Sheeran",
                "language": "en",
                "difficulty": "beginner"
            }
        }


class SongUploadResponse(BaseModel):
    """Response after successful file upload."""
    song_id: str = Field(..., description="Newly created song ID")
    title: str = Field(..., description="Song title")
    artist: str = Field(..., description="Artist name")
    status: str = Field(..., description="Current processing status")
    message: str = Field(..., description="Human-readable status message")

    class Config:
        json_schema_extra = {
            "example": {
                "song_id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Perfect",
                "artist": "Ed Sheeran",
                "status": "uploaded",
                "message": "Files uploaded successfully. Ready for processing."
            }
        }


class ProcessingStatus(BaseModel):
    """Current status of song processing."""
    song_id: str = Field(..., description="Song ID")
    status: Literal["pending", "processing", "completed", "failed"] = Field(
        ..., description="Current status"
    )
    progress: float = Field(default=0, ge=0, le=1, description="Progress (0-1)")
    message: str = Field(..., description="Status message")
    error: Optional[str] = Field(default=None, description="Error message if failed")

    class Config:
        json_schema_extra = {
            "example": {
                "song_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "processing",
                "progress": 0.5,
                "message": "Extracting melody...",
                "error": None
            }
        }


class SongPreviewResponse(BaseModel):
    """Preview data for frontend display (subset of full reference)."""
    song_id: str = Field(..., description="Song ID")
    title: str = Field(..., description="Song title")
    artist: str = Field(..., description="Artist name")
    duration: float = Field(..., description="Duration in seconds")
    bpm: float = Field(..., description="Estimated BPM")
    key: str = Field(..., description="Estimated musical key")
    difficulty: str = Field(..., description="Difficulty level")
    beats_count: int = Field(..., description="Number of detected beats")
    pitch_samples_count: int = Field(..., description="Number of pitch samples")
    lyrics_words_count: int = Field(..., description="Number of words in lyrics")
    sections_count: int = Field(..., description="Number of detected sections")
    alignment_quality: float = Field(..., description="Alignment quality score")
    processed_at: Optional[datetime] = Field(default=None, description="Processing timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "song_id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Perfect",
                "artist": "Ed Sheeran",
                "duration": 263.0,
                "bpm": 84,
                "key": "A Major",
                "difficulty": "beginner",
                "beats_count": 368,
                "pitch_samples_count": 2630,
                "lyrics_words_count": 156,
                "sections_count": 5,
                "alignment_quality": 0.88,
                "processed_at": "2026-05-17T14:30:00Z"
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(..., description="Error code/type")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(default=None, description="Additional error details")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "INVALID_AUDIO_FILE",
                "message": "The uploaded audio file could not be decoded.",
                "details": {
                    "filename": "song.mp3",
                    "reason": "Corrupted file header"
                }
            }
        }
