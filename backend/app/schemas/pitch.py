from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class PitchDataPoint(BaseModel):
    """Single pitch measurement"""
    timestamp: float
    frequency: float  # Hz
    confidence: float  # 0-1


class ReferenceData(BaseModel):
    """Reference vocal track data"""
    song_id: str
    title: str
    artist: str
    duration: float
    pitch_data: List[PitchDataPoint]


class UserRecording(BaseModel):
    """User's recording metadata"""
    recording_id: str
    song_id: str
    user_id: str
    duration: float
    timestamp: str


class PitchFeedback(BaseModel):
    """Feedback on pitch accuracy"""
    accuracy_percentage: float  # 0-100
    deviation_cents: float  # Cents from target
    timing_offset: float  # Milliseconds


class SongMetadata(BaseModel):
    """Song information"""
    id: str
    title: str
    artist: str
    duration: float
    bpm: int
    key: str  
    difficulty: str  # beginner, intermediate, advanced


class AnalysisResult(BaseModel):
    """Analysis of user's singing"""
    recording_id: str
    song_id: str
    overall_accuracy: float
    pitch_accuracy: float
    timing_accuracy: float
    feedback: List[PitchFeedback]
    recommendations: List[str]


class PitchAnalysisResponse(BaseModel):
    """
    Response returned by the pitch analysis endpoint.
    """

    sample_rate: int
    duration: float
    num_points: int
    pitch_data: List[PitchDataPoint]
