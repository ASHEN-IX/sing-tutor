import json
from typing import List
from app.schemas.pitch import (
    PitchDataPoint,
    ReferenceData,
    SongMetadata,
    AnalysisResult,
    PitchFeedback,
)


class MockAudioService:
    """Mock service for audio processing"""

    @staticmethod
    def get_reference_data(song_id: str) -> ReferenceData:
        """Generate mock reference pitch data"""
        # Simulate a simple melody in C major
        pitch_data = []
        base_frequency = 262.0  # Middle C
        durations = [262.0, 294.0, 330.0, 349.0, 392.0, 440.0, 494.0, 523.0]  # C-D-E-F-G-A-B-C

        for i, freq in enumerate(durations):
            for j in range(0, 2000, 100):  # Each note over 2 seconds
                pitch_data.append(
                    PitchDataPoint(
                        timestamp=i * 2 + j / 1000,
                        frequency=freq,
                        confidence=0.95,
                    )
                )

        return ReferenceData(
            song_id=song_id,
            title="Mock Song",
            artist="Mock Artist",
            duration=16.0,
            pitch_data=pitch_data,
        )

    @staticmethod
    def analyze_recording(song_id: str, recording_id: str) -> AnalysisResult:
        """Generate mock analysis results"""
        # Simulate feedback data
        feedback = [
            PitchFeedback(
                accuracy_percentage=92.5,
                deviation_cents=+5,
                timing_offset=0.05,
            ),
            PitchFeedback(
                accuracy_percentage=88.3,
                deviation_cents=-8,
                timing_offset=-0.02,
            ),
            PitchFeedback(
                accuracy_percentage=95.1,
                deviation_cents=+2,
                timing_offset=0.01,
            ),
        ]

        return AnalysisResult(
            recording_id=recording_id,
            song_id=song_id,
            overall_accuracy=91.97,
            pitch_accuracy=91.97,
            timing_accuracy=88.5,
            feedback=feedback,
            recommendations=[
                "Great job on the high notes!",
                "Work on timing in the middle section",
                "Your vibrato is getting better",
            ],
        )


class MockSongService:
    """Mock service for song data"""

    MOCK_SONGS = [
        SongMetadata(
            id="song_001",
            title="Perfect",
            artist="Ed Sheeran",
            duration=263.0,
            bpm=84,
            key="A",
            difficulty="beginner",
        ),
        SongMetadata(
            id="song_002",
            title="Bohemian Rhapsody",
            artist="Queen",
            duration=354.0,
            bpm=72,
            key="B",
            difficulty="advanced",
        ),
        SongMetadata(
            id="song_003",
            title="Hallelujah",
            artist="Leonard Cohen",
            duration=278.0,
            bpm=60,
            key="C",
            difficulty="intermediate",
        ),
    ]

    @staticmethod
    def get_all_songs() -> List[SongMetadata]:
        """Get all available songs"""
        return MockSongService.MOCK_SONGS

    @staticmethod
    def get_song(song_id: str) -> SongMetadata:
        """Get a specific song by ID"""
        for song in MockSongService.MOCK_SONGS:
            if song.id == song_id:
                return song
        # Return first song if not found (mock behavior)
        return MockSongService.MOCK_SONGS[0]
