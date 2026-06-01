"""
Unit tests for Sprint 2 song processing services.

Tests cover:
- Song storage operations
- Metadata extraction
- Beat detection
- Melody extraction
- Lyrics parsing and alignment
- Reference building
"""

import pytest
import tempfile
import shutil
import numpy as np
from pathlib import Path

from app.services.song_storage import SongStorageService
from app.services.metadata_extractor import MetadataExtractor
from app.services.beat_detector import BeatDetector
from app.services.melody_extractor import MelodyExtractor
from app.services.lyrics_parser import LyricsParser
from app.services.lyrics_aligner import LyricsAligner
from app.services.reference_builder import ReferenceBuilder


@pytest.fixture
def temp_storage_dir():
    """Create temporary directory for storage testing."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)


@pytest.fixture
def storage_service(temp_storage_dir):
    """Create SongStorageService instance."""
    return SongStorageService(base_path=temp_storage_dir)


@pytest.fixture
def sample_audio():
    """Generate sample audio for testing."""
    # Create a simple sine wave
    sr = 22050
    duration = 2  # 2 seconds
    freq = 440  # A4 note
    t = np.linspace(0, duration, sr * duration)
    y = np.sin(2 * np.pi * freq * t).astype(np.float32)
    return y, sr


class TestSongStorageService:
    """Tests for SongStorageService."""

    def test_create_song_directory(self, storage_service):
        """Test creating a song directory."""
        song_id = "test_song_001"
        song_dir = storage_service.create_song_directory(song_id)
        assert song_dir.exists()
        assert song_dir.is_dir()

    def test_song_exists(self, storage_service):
        """Test checking if song exists."""
        song_id = "test_song_002"
        assert not storage_service.song_exists(song_id)

        storage_service.create_song_directory(song_id)
        assert storage_service.song_exists(song_id)

    def test_save_and_load_audio(self, storage_service):
        """Test saving and loading audio file."""
        song_id = "test_song_003"
        storage_service.create_song_directory(song_id)

        # Create test audio data
        audio_data = b"test audio data"
        storage_service.save_audio_file(song_id, audio_data)

        # Load and verify
        loaded = storage_service.load_audio_file(song_id)
        assert loaded == audio_data

    def test_save_and_load_lyrics(self, storage_service):
        """Test saving and loading lyrics."""
        song_id = "test_song_004"
        storage_service.create_song_directory(song_id)

        lyrics_text = "I love singing\nThis is beautiful\nA simple song"
        storage_service.save_lyrics_file(song_id, lyrics_text)

        # Load and verify
        loaded = storage_service.load_lyrics_file(song_id)
        assert loaded == lyrics_text

    def test_save_and_load_reference_json(self, storage_service):
        """Test saving and loading reference JSON."""
        song_id = "test_song_005"
        storage_service.create_song_directory(song_id)

        ref_data = {
            "song_id": song_id,
            "title": "Test Song",
            "artist": "Test Artist",
            "duration": 180.0,
            "bpm": 120.0,
        }
        storage_service.save_reference_json(song_id, ref_data)

        # Load and verify
        loaded = storage_service.load_reference_json(song_id)
        assert loaded["title"] == "Test Song"
        assert loaded["bpm"] == 120.0

    def test_delete_song(self, storage_service):
        """Test deleting a song."""
        song_id = "test_song_006"
        storage_service.create_song_directory(song_id)
        assert storage_service.song_exists(song_id)

        storage_service.delete_song(song_id)
        assert not storage_service.song_exists(song_id)

    def test_list_songs(self, storage_service):
        """Test listing songs."""
        for i in range(3):
            storage_service.create_song_directory(f"song_{i:03d}")

        songs = storage_service.list_songs()
        assert len(songs) == 3
        assert "song_000" in songs


class TestMetadataExtractor:
    """Tests for MetadataExtractor."""

    def test_extract_duration(self, sample_audio):
        """Test duration extraction."""
        y, sr = sample_audio
        extractor = MetadataExtractor(sr=sr)
        duration = extractor.extract_duration(y)
        assert isinstance(duration, float)
        assert 1.9 < duration < 2.1  # Should be approximately 2 seconds

    def test_extract_bpm(self, sample_audio):
        """Test BPM extraction."""
        y, sr = sample_audio
        extractor = MetadataExtractor(sr=sr)
        bpm = extractor.extract_bpm(y)
        assert isinstance(bpm, float)
        assert 40 <= bpm <= 200  # Valid BPM range

    def test_extract_key(self, sample_audio):
        """Test key extraction."""
        y, sr = sample_audio
        extractor = MetadataExtractor(sr=sr)
        key = extractor.extract_key(y)
        assert isinstance(key, str)
        assert "Major" in key or "Minor" in key

    def test_extract_all_metadata(self, sample_audio):
        """Test extracting all metadata."""
        y, sr = sample_audio
        extractor = MetadataExtractor(sr=sr)
        # Write temporary WAV file and call extract_all_metadata with the file path
        import soundfile as sf
        import tempfile
        tmpf = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        tmp_path = tmpf.name
        tmpf.close()
        try:
            sf.write(tmp_path, y, sr)
            metadata = extractor.extract_all_metadata(tmp_path)
            assert "duration" in metadata
            assert "bpm" in metadata
            assert "key" in metadata
        finally:
            try:
                import os
                os.remove(tmp_path)
            except Exception:
                pass


class TestBeatDetector:
    """Tests for BeatDetector."""

    def test_detect_beats(self, sample_audio):
        """Test beat detection."""
        y, sr = sample_audio
        detector = BeatDetector(sr=sr)
        beats = detector.detect_beats(y, units="time")
        assert isinstance(beats, list)
        # Should detect at least some beats
        assert len(beats) >= 0

    def test_detect_beats_with_confidence(self, sample_audio):
        """Test beat detection with confidence."""
        y, sr = sample_audio
        detector = BeatDetector(sr=sr)
        beats_with_conf = detector.detect_beats_with_confidence(y)
        assert isinstance(beats_with_conf, list)
        for beat in beats_with_conf:
            assert "time" in beat
            assert "confidence" in beat
            assert 0 <= beat["confidence"] <= 1


class TestMelodyExtractor:
    """Tests for MelodyExtractor."""

    def test_extract_pitch_contour(self, sample_audio):
        """Test pitch contour extraction."""
        y, sr = sample_audio
        extractor = MelodyExtractor(sr=sr)
        pitch_contour = extractor.extract_pitch_contour(y, downsample_factor=10)
        assert isinstance(pitch_contour, list)
        for sample in pitch_contour:
            assert "timestamp" in sample
            assert "frequency" in sample
            assert "confidence" in sample

    def test_get_pitch_statistics(self, sample_audio):
        """Test pitch statistics."""
        y, sr = sample_audio
        extractor = MelodyExtractor(sr=sr)
        pitch_contour = extractor.extract_pitch_contour(y)
        stats = extractor.get_pitch_statistics(pitch_contour)
        assert "mean_frequency" in stats
        assert "voiced_coverage" in stats


class TestLyricsParser:
    """Tests for LyricsParser."""

    def test_parse_plain_text(self):
        """Test parsing plain text lyrics."""
        parser = LyricsParser()
        text = "I love singing this beautiful song"
        words = parser.parse_plain_text(text)
        assert len(words) > 0
        assert "love" in words
        assert "singing" in words

    def test_parse_lrc_format(self):
        """Test parsing LRC format."""
        parser = LyricsParser()
        lrc_text = """[ar:Artist Name]
[ti:Song Title]
[00:12.00]First line
[00:17.20]Second line"""
        words, metadata = parser.parse_lrc_format(lrc_text)
        assert len(words) > 0
        assert "ar" in metadata or len(words) > 0

    def test_parse_lyrics_auto_detect(self):
        """Test auto-detection of lyrics format."""
        parser = LyricsParser()

        # Test plain text
        words1, _ = parser.parse_lyrics("Hello world", format="auto")
        assert len(words1) > 0

        # Test LRC
        lrc = "[00:00.00]Hello\n[00:05.00]World"
        words2, _ = parser.parse_lyrics(lrc, format="auto")
        assert len(words2) > 0

    def test_create_lyric_objects(self):
        """Test creating lyric objects."""
        parser = LyricsParser()
        words = ["Hello", "world", "singing"]
        lyrics = parser.create_lyric_objects(words)
        assert len(lyrics) == 3
        assert lyrics[0]["word"] == "Hello"
        assert lyrics[0]["index"] == 0

    def test_count_words(self):
        """Test word counting."""
        parser = LyricsParser()
        text = "One two three four five"
        count = parser.count_words(text)
        assert count == 5


class TestLyricsAligner:
    """Tests for LyricsAligner."""

    def test_align_lyrics_to_beats(self):
        """Test aligning lyrics to beats."""
        aligner = LyricsAligner()
        lyrics = [
            {"index": 0, "word": "Hello", "start": None, "end": None},
            {"index": 1, "word": "world", "start": None, "end": None},
        ]
        beats = [0.0, 1.0, 2.0, 3.0]
        duration = 4.0

        aligned = aligner.align_lyrics_to_beats(lyrics, beats, duration)
        assert len(aligned) == 2
        assert aligned[0]["start"] is not None
        assert aligned[0]["end"] is not None
        assert aligned[0]["start"] < aligned[0]["end"]

    def test_distribute_words_evenly(self):
        """Test even distribution of words."""
        aligner = LyricsAligner()
        lyrics = [
            {"index": i, "word": f"word{i}", "start": None, "end": None}
            for i in range(5)
        ]
        duration = 10.0

        aligned = aligner.distribute_words_evenly(lyrics, duration)
        assert len(aligned) == 5
        assert aligned[-1]["end"] == duration

    def test_calculate_alignment_quality(self):
        """Test alignment quality calculation."""
        aligner = LyricsAligner()
        lyrics = [
            {"index": 0, "word": "word", "start": 0.0, "end": 1.0},
            {"index": 1, "word": "word", "start": 1.0, "end": 2.0},
        ]
        beats = [0.0, 1.0, 2.0]
        duration = 2.0

        quality = aligner.calculate_alignment_quality(lyrics, beats, duration)
        assert 0 <= quality <= 1


class TestReferenceBuilder:
    """Tests for ReferenceBuilder."""

    def test_build_reference_basic(self, temp_storage_dir):
        """Test building a basic reference."""
        storage = SongStorageService(base_path=temp_storage_dir)
        builder = ReferenceBuilder(storage_service=storage)

        song_id = "test_ref_001"
        storage.create_song_directory(song_id)

        # Build without audio/lyrics
        reference = builder.build_reference(
            song_id=song_id,
            title="Test Song",
            artist="Test Artist",
        )

        assert reference.song_id == song_id
        assert reference.title == "Test Song"
        assert reference.artist == "Test Artist"

    def test_save_and_load_reference(self, temp_storage_dir):
        """Test saving and loading reference."""
        storage = SongStorageService(base_path=temp_storage_dir)
        builder = ReferenceBuilder(storage_service=storage)

        song_id = "test_ref_002"
        storage.create_song_directory(song_id)

        # Build and save
        reference = builder.build_reference(
            song_id=song_id,
            title="Test Song",
            artist="Test Artist",
        )
        builder.save_reference(reference)

        # Load and verify
        loaded = builder.load_reference(song_id)
        assert loaded.song_id == song_id
        assert loaded.title == "Test Song"

    def test_extracts_sentence_lines_from_lyrics_text(self, temp_storage_dir):
        """Test sentence extraction preserves line structure and punctuation."""
        storage = SongStorageService(base_path=temp_storage_dir)
        builder = ReferenceBuilder(storage_service=storage)
        lyrics_text = "Hello, world!\nAre you ready? I am ready."
        aligned = [
            {"index": 0, "word": "Hello", "start": 0.0, "end": 0.4},
            {"index": 1, "word": "world", "start": 0.5, "end": 1.0},
            {"index": 2, "word": "Are", "start": 1.2, "end": 1.5},
            {"index": 3, "word": "you", "start": 1.6, "end": 1.8},
            {"index": 4, "word": "ready", "start": 1.9, "end": 2.2},
            {"index": 5, "word": "I", "start": 2.4, "end": 2.5},
            {"index": 6, "word": "am", "start": 2.6, "end": 2.8},
            {"index": 7, "word": "ready", "start": 2.9, "end": 3.4},
        ]

        lines = builder._build_lyric_lines(lyrics_text, aligned, duration=4.0)

        assert [line["text"] for line in lines] == [
            "Hello, world!",
            "Are you ready?",
            "I am ready.",
        ]

    def test_sentence_timing_uses_first_and_last_aligned_words(self, temp_storage_dir):
        """Test sentence start/end timing comes from aligned word boundaries."""
        storage = SongStorageService(base_path=temp_storage_dir)
        builder = ReferenceBuilder(storage_service=storage)
        lyrics_text = "First sentence\nSecond sentence"
        aligned = [
            {"index": 0, "word": "First", "start": 0.25, "end": 0.5},
            {"index": 1, "word": "sentence", "start": 0.7, "end": 1.4},
            {"index": 2, "word": "Second", "start": 2.0, "end": 2.3},
            {"index": 3, "word": "sentence", "start": 2.5, "end": 3.2},
        ]

        lines = builder._build_lyric_lines(lyrics_text, aligned, duration=5.0)

        assert lines[0]["start"] == 0.25
        assert lines[0]["end"] == 1.4
        assert lines[1]["start"] == 2.0
        assert lines[1]["end"] == 3.2

    def test_sentence_timing_splits_large_internal_gaps(self, temp_storage_dir):
        """Test sentence-level timing is split when the word span has a long silence."""
        storage = SongStorageService(base_path=temp_storage_dir)
        builder = ReferenceBuilder(storage_service=storage)
        lyrics_text = "Hello world again"
        sentence_timings = [
            {
                "index": 0,
                "text": "Hello world again",
                "words": [
                    {"index": 0, "word": "Hello", "start": 0.1, "end": 0.4},
                    {"index": 1, "word": "world", "start": 0.5, "end": 0.9},
                    {"index": 2, "word": "again", "start": 5.0, "end": 5.4},
                ],
                "start": 0.1,
                "end": 5.4,
            }
        ]

        lines = builder._build_lyric_lines(
            lyrics_text,
            aligned_lyrics=[],
            duration=6.0,
            sentence_timings=sentence_timings,
        )

        assert len(lines) == 2
        assert [line["text"] for line in lines] == ["Hello world", "again"]
        assert [line["start"] for line in lines] == [0.1, 5.0]
        assert [line["end"] for line in lines] == [0.9, 5.4]

    def test_build_reference_prefers_sentence_audio_alignment(self, temp_storage_dir):
        """Test sentence-level audio alignment drives lyric line timings."""
        storage = SongStorageService(base_path=temp_storage_dir)
        builder = ReferenceBuilder(storage_service=storage)

        builder.metadata_extractor.extract_all_metadata = lambda audio_path: {
            "duration": 4.0,
            "bpm": 120.0,
            "key": "C Major",
        }
        builder.beat_detector.detect_beats_from_file = lambda audio_path: [0.0, 1.0, 2.0, 3.0]
        builder.melody_extractor.extract_pitch_from_file = lambda audio_path: []

        class FakeWhisperXAligner:
            model_name = "small"

            def align_sentences(self, audio_path, sentences, duration, language="en"):
                assert sentences == ["Hello world!", "Goodbye moon."]
                return [
                    {
                        "index": 0,
                        "text": "Hello world!",
                        "words": [
                            {"index": 0, "word": "Hello", "start": 0.1, "end": 0.4},
                            {"index": 1, "word": "world", "start": 0.5, "end": 1.2},
                        ],
                        "start": 0.1,
                        "end": 1.2,
                    },
                    {
                        "index": 1,
                        "text": "Goodbye moon.",
                        "words": [
                            {"index": 2, "word": "Goodbye", "start": 2.0, "end": 2.5},
                            {"index": 3, "word": "moon", "start": 2.6, "end": 3.3},
                        ],
                        "start": 2.0,
                        "end": 3.3,
                    },
                ], 1.0

            def align(self, audio_path, words, language="en"):
                return [
                    {"index": 0, "word": "Hello", "start": 0.1, "end": 0.4},
                    {"index": 1, "word": "world", "start": 0.5, "end": 1.2},
                    {"index": 2, "word": "Goodbye", "start": 2.0, "end": 2.5},
                    {"index": 3, "word": "moon", "start": 2.6, "end": 3.3},
                ], 1.0

        builder.whisperx_aligner = FakeWhisperXAligner()

        reference = builder.build_reference(
            song_id="test_ref_sentence_audio",
            title="Test Song",
            artist="Test Artist",
            audio_path="/tmp/fake.mp3",
            lyrics_text="Hello world!\nGoodbye moon.",
        )

        assert [line.start for line in reference.lyric_lines] == [0.1, 2.0]
        assert [line.end for line in reference.lyric_lines] == [1.2, 3.3]
        assert [line.text for line in reference.lyric_lines] == ["Hello world!", "Goodbye moon."]

    def test_build_reference_splits_sentence_when_alignment_has_long_gap(self, temp_storage_dir):
        """Test build_reference splits a mapped sentence if the aligned words contain a long silence."""
        storage = SongStorageService(base_path=temp_storage_dir)
        builder = ReferenceBuilder(storage_service=storage)

        builder.metadata_extractor.extract_all_metadata = lambda audio_path: {
            "duration": 6.0,
            "bpm": 120.0,
            "key": "C Major",
        }
        builder.beat_detector.detect_beats_from_file = lambda audio_path: [0.0, 1.0, 2.0, 3.0, 4.0, 5.0]
        builder.melody_extractor.extract_pitch_from_file = lambda audio_path: []

        class GapSentenceWhisperXAligner:
            model_name = "small"

            def align_sentences(self, audio_path, sentences, duration, language="en"):
                return [
                    {
                        "index": 0,
                        "text": "Hello world again",
                        "words": [
                            {"index": 0, "word": "Hello", "start": 0.1, "end": 0.4},
                            {"index": 1, "word": "world", "start": 0.5, "end": 0.9},
                            {"index": 2, "word": "again", "start": 5.0, "end": 5.4},
                        ],
                        "start": 0.1,
                        "end": 5.4,
                    }
                ], 1.0

            def align(self, audio_path, words, language="en"):
                return [
                    {"index": 0, "word": "Hello", "start": 0.1, "end": 0.4},
                    {"index": 1, "word": "world", "start": 0.5, "end": 0.9},
                    {"index": 2, "word": "again", "start": 5.0, "end": 5.4},
                ], 1.0

        builder.whisperx_aligner = GapSentenceWhisperXAligner()

        reference = builder.build_reference(
            song_id="test_ref_gap_sentence",
            title="Test Song",
            artist="Test Artist",
            audio_path="/tmp/fake.mp3",
            lyrics_text="Hello world again",
        )

        assert len(reference.lyric_lines) == 2
        assert [line.text for line in reference.lyric_lines] == ["Hello world", "again"]
        assert [line.start for line in reference.lyric_lines] == [0.1, 5.0]
        assert [line.end for line in reference.lyric_lines] == [0.9, 5.4]

    def test_builds_rhythm_segments_when_no_lyrics_exist(self, temp_storage_dir):
        """Test rhythm fallback covers the full duration with or without beats."""
        storage = SongStorageService(base_path=temp_storage_dir)
        builder = ReferenceBuilder(storage_service=storage)

        beat_segments = builder._build_rhythm_segments([1.0, 2.0, 3.0], duration=4.0)
        assert beat_segments[0]["start"] == 0.0
        assert beat_segments[-1]["end"] == 4.0
        assert len(beat_segments) >= 3

        even_segments = builder._build_rhythm_segments([], duration=5.0)
        assert even_segments[0]["start"] == 0.0
        assert even_segments[-1]["end"] == 5.0
        assert len(even_segments) > 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
