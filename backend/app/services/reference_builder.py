"""
Reference builder service - orchestrates all services to build complete reference.

Coordinates metadata extraction, beat/melody extraction, lyrics processing,
and generates the final reference JSON.
"""

import logging
import uuid
from datetime import datetime
from typing import Optional, Tuple
import numpy as np

from app.services.song_storage import SongStorageService
from app.services.metadata_extractor import MetadataExtractor
from app.services.beat_detector import BeatDetector
from app.services.melody_extractor import MelodyExtractor
from app.services.lyrics_parser import LyricsParser
from app.services.lyrics_aligner import LyricsAligner
from app.schemas.song_reference import SongReference, ProcessingDiagnostics

logger = logging.getLogger(__name__)


class ReferenceBuilder:
    """Builds complete song reference from audio and lyrics."""

    def __init__(
        self,
        storage_service: SongStorageService,
        sr: int = 22050
    ):
        """
        Initialize reference builder with dependencies.

        Args:
            storage_service: SongStorageService instance
            sr: Sample rate for audio processing
        """
        self.storage = storage_service
        self.metadata_extractor = MetadataExtractor(sr=sr)
        self.beat_detector = BeatDetector(sr=sr)
        self.melody_extractor = MelodyExtractor(sr=sr)
        self.lyrics_parser = LyricsParser()
        self.lyrics_aligner = LyricsAligner()
        self.sr = sr
        logger.info("ReferenceBuilder initialized")

    def build_reference(
        self,
        song_id: str,
        title: str,
        artist: str,
        language: str = "en",
        difficulty: str = "beginner",
        audio_path: str = None,
        lyrics_text: str = None
    ) -> SongReference:
        """
        Build complete reference from audio and lyrics.

        Args:
            song_id: Unique song identifier
            title: Song title
            artist: Artist name
            language: ISO 639-1 language code
            difficulty: Difficulty level
            audio_path: Path to audio file (None to skip audio processing)
            lyrics_text: Lyrics text (None to skip lyrics processing)

        Returns:
            Complete SongReference object

        Raises:
            RuntimeError: If processing fails
        """
        logger.info(f"Building reference for {song_id}: {title} - {artist}")
        start_time = datetime.now()

        try:
            # Initialize outputs
            metadata = {
                "duration": 0.0,
                "bpm": 120.0,
                "key": "C Major",
            }
            beats = []
            pitch_data = []
            lyrics = []
            sections = []

            # Process audio if provided
            if audio_path:
                logger.info(f"Processing audio: {audio_path}")
                metadata = self.metadata_extractor.extract_all_metadata(audio_path)
                beats = self.beat_detector.detect_beats_from_file(audio_path)
                pitch_data = self.melody_extractor.extract_pitch_from_file(audio_path)

            # Process lyrics if provided
            if lyrics_text:
                logger.info("Processing lyrics")
                words, lrc_metadata = self.lyrics_parser.parse_lyrics(lyrics_text, format="auto")
                lyric_objects = self.lyrics_parser.create_lyric_objects(words)

                # Align lyrics to beats
                aligned_lyrics = self.lyrics_aligner.align_lyrics_to_beats(
                    lyric_objects,
                    beats,
                    metadata["duration"]
                )
                lyrics = aligned_lyrics

            # Calculate alignment quality
            alignment_quality = self.lyrics_aligner.calculate_alignment_quality(
                lyrics,
                beats,
                metadata["duration"]
            )

            # Calculate pitch coverage
            if pitch_data:
                pitch_coverage = len([p for p in pitch_data if p.get("confidence", 0) > 0.3]) / len(pitch_data)
            else:
                pitch_coverage = 0.0

            # Generate sections (placeholder - would be enhanced with ML)
            sections = self._generate_sections(
                lyrics,
                beats,
                metadata["duration"]
            )

            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()

            # Create diagnostics
            diagnostics = ProcessingDiagnostics(
                processing_time_seconds=processing_time,
                alignment_quality=alignment_quality,
                pitch_coverage=pitch_coverage,
                processed_at=datetime.now(),
                processing_version="2.0"
            )

            # Create reference
            reference = SongReference(
                song_id=song_id,
                title=title,
                artist=artist,
                language=language,
                difficulty=difficulty,
                duration=metadata["duration"],
                bpm=metadata["bpm"],
                key=metadata["key"],
                beats=beats,
                pitch_data=pitch_data,
                lyrics=lyrics,
                sections=sections,
                diagnostics=diagnostics
            )

            logger.info(f"Reference built successfully in {processing_time:.2f}s")
            return reference

        except Exception as e:
            logger.error(f"Failed to build reference: {e}")
            raise RuntimeError(f"Failed to build reference: {e}")

    def _generate_sections(
        self,
        lyrics: list,
        beats: list,
        duration: float,
        section_length: float = 30.0
    ) -> list:
        """
        Generate approximate song sections (placeholder implementation).

        Args:
            lyrics: List of aligned lyrics
            beats: List of beat positions
            duration: Total duration
            section_length: Approximate section length (seconds)

        Returns:
            List of SongSection objects

        Note:
            - This is a simple placeholder
            - Real implementation would use more sophisticated heuristics
            - Could be enhanced with ML-based structure analysis
        """
        sections = []
        n_sections = max(1, int(duration / section_length))

        # Simple heuristic: divide song into equal sections
        section_names = ["Intro", "Verse 1", "Chorus", "Verse 2", "Bridge", "Chorus"]

        for i in range(n_sections):
            start = i * section_length
            end = min((i + 1) * section_length, duration)

            section_type = "verse" if i % 2 == 0 else "chorus"
            if i == 0:
                section_type = "intro"
            elif i == n_sections - 1:
                section_type = "outro"

            name = section_names[min(i, len(section_names) - 1)]

            sections.append({
                "name": name,
                "start": float(start),
                "end": float(end),
                "section_type": section_type
            })

        logger.debug(f"Generated {len(sections)} sections")
        return sections

    def save_reference(self, reference: SongReference) -> None:
        """
        Save reference JSON to storage.

        Args:
            reference: SongReference object

        Raises:
            RuntimeError: If save fails
        """
        try:
            ref_dict = reference.model_dump(mode='json')
            self.storage.save_reference_json(reference.song_id, ref_dict)
            logger.info(f"Saved reference for {reference.song_id}")
        except Exception as e:
            logger.error(f"Failed to save reference: {e}")
            raise RuntimeError(f"Failed to save reference: {e}")

    def load_reference(self, song_id: str) -> SongReference:
        """
        Load reference JSON from storage.

        Args:
            song_id: Song identifier

        Returns:
            SongReference object

        Raises:
            FileNotFoundError: If reference not found
            RuntimeError: If JSON invalid
        """
        try:
            ref_dict = self.storage.load_reference_json(song_id)
            reference = SongReference(**ref_dict)
            logger.info(f"Loaded reference for {song_id}")
            return reference
        except FileNotFoundError:
            logger.error(f"Reference not found for {song_id}")
            raise
        except Exception as e:
            logger.error(f"Failed to load reference: {e}")
            raise RuntimeError(f"Failed to load reference: {e}")
