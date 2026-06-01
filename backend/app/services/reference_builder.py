"""
Reference builder service - orchestrates all services to build complete reference.

Coordinates metadata extraction, beat/melody extraction, lyrics processing,
and generates the final reference JSON.
"""

import logging
import re
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
from app.services.whisperx_aligner import WhisperXAligner

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
        # WhisperX aligner (optional)
        try:
            self.whisperx_aligner = WhisperXAligner()
        except Exception:
            self.whisperx_aligner = None
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
            lyric_lines = []
            rhythm_segments = []
            sections = []

            # Process audio if provided
            if audio_path:
                logger.info(f"Processing audio: {audio_path}")
                metadata = self.metadata_extractor.extract_all_metadata(audio_path)
                beats = self.beat_detector.detect_beats_from_file(audio_path)
                pitch_data = self.melody_extractor.extract_pitch_from_file(audio_path)

            # Process lyrics if provided
            match_ratio = None
            sentence_timings = []
            if lyrics_text:
                logger.info("Processing lyrics")
                words, lrc_metadata = self.lyrics_parser.parse_lyrics(lyrics_text, format="auto")
                lyric_objects = self.lyrics_parser.create_lyric_objects(words)
                sentences = self._extract_lyric_sentences(lyrics_text)

                # Prefer Whisper alignment when audio is available
                if audio_path:
                    # Prefer sentence-level alignment first, then fall back to word-level alignment.
                    try:
                        if self.whisperx_aligner:
                            sentence_timings, match_ratio = self.whisperx_aligner.align_sentences(
                                audio_path,
                                sentences,
                                metadata["duration"],
                                language=language,
                            )
                            aligned_lyrics, _ = self.whisperx_aligner.align(
                                audio_path,
                                lyric_objects,
                                language=language,
                            )
                        else:
                            sentence_timings, match_ratio = self.lyrics_aligner.align_sentences_with_whisper(
                                sentences,
                                audio_path,
                                metadata["duration"],
                                language=language
                            )
                            aligned_lyrics, match_ratio = self.lyrics_aligner.align_lyrics_with_whisper(
                                lyric_objects,
                                audio_path,
                                metadata["duration"],
                                language=language
                            )
                    except Exception as e:
                        logger.warning("Whisper sentence alignment failed (%s). Falling back to beats.", e)
                        sentence_timings = []
                        aligned_lyrics = self.lyrics_aligner.align_lyrics_to_beats(
                            lyric_objects,
                            beats,
                            metadata["duration"]
                        )
                else:
                    aligned_lyrics = self.lyrics_aligner.align_lyrics_to_beats(
                        lyric_objects,
                        beats,
                        metadata["duration"]
                    )
                lyrics, lyric_warnings = self._validate_lyric_timing(
                    aligned_lyrics,
                    metadata["duration"]
                )
                if lyric_warnings:
                    for warning in lyric_warnings:
                        logger.warning("Lyrics timing warning: %s", warning)
                lyric_lines = self._build_lyric_lines(
                    lyrics_text,
                    lyrics,
                    metadata["duration"],
                    sentence_timings=sentence_timings,
                )

            if not lyric_lines:
                rhythm_segments = self._build_rhythm_segments(beats, metadata["duration"])

            # Calculate alignment quality
            if match_ratio is not None:
                alignment_quality = self.lyrics_aligner.calculate_alignment_quality_from_match_ratio(
                    match_ratio
                )
            else:
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
                alignment_model=(self.whisperx_aligner.model_name if (self.whisperx_aligner and match_ratio is not None) else ("beats" if match_ratio is not None else None)),
                match_ratio=(match_ratio if match_ratio is not None else None),
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
                lyric_lines=lyric_lines,
                rhythm_segments=rhythm_segments,
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

    def _extract_lyric_sentences(self, lyrics_text: str) -> list:
        """Extract sentence units while preserving raw lyric line structure."""
        if not lyrics_text:
            return []

        sentences = []
        for raw_line in lyrics_text.splitlines():
            line = raw_line.strip()
            if not line:
                continue

            parts = [
                part.strip()
                for part in re.split(r'(?<=[.!?])\s+(?=["\'(\[]?[A-Z0-9])', line)
                if part.strip()
            ]
            sentences.extend(parts or [line])

        return sentences

    def _build_lyric_lines(
        self,
        lyrics_text: str,
        aligned_lyrics: list,
        duration: float,
        sentence_timings: Optional[list] = None,
    ) -> list:
        """
        Build sentence-level lyric display records using raw text line breaks.

        Sentence timing is derived from the sentence order in the lyrics file.
        Word timings refine the boundaries when available, but the output shape
        always remains sentence-based.
        """
        if not lyrics_text:
            return []

        sentences = self._extract_lyric_sentences(lyrics_text)
        if not sentences:
            return []

        if sentence_timings:
            lines = []
            for idx, sentence in enumerate(sentences):
                timing = sentence_timings[idx] if idx < len(sentence_timings) else {}
                sentence_words = timing.get("words", []) or []
                word_groups = self._split_words_by_gap(sentence_words)

                if not word_groups:
                    start = float(timing.get("start", 0.0) or 0.0)
                    end = float(timing.get("end", start) or start)
                    start = max(0.0, min(start, duration))
                    end = max(start, min(end, duration))
                    lines.append({
                        "index": len(lines),
                        "text": timing.get("text", sentence),
                        "words": sentence_words,
                        "start": start,
                        "end": end,
                    })
                    continue

                for segment_index, segment_words in enumerate(word_groups):
                    start = float(segment_words[0].get("start", 0.0) or 0.0)
                    end = float(segment_words[-1].get("end", start) or start)
                    start = max(0.0, min(start, duration))
                    end = max(start, min(end, duration))

                    if len(word_groups) == 1:
                        text = timing.get("text", sentence)
                    else:
                        text = " ".join(
                            word.get("word", "").strip()
                            for word in segment_words
                            if word.get("word", "").strip()
                        ).strip() or timing.get("text", sentence)

                    lines.append({
                        "index": len(lines),
                        "text": text,
                        "words": segment_words,
                        "start": start,
                        "end": end,
                    })

            return lines

        sentence_word_counts = []
        for sentence in sentences:
            words = self.lyrics_parser.parse_plain_text(sentence)
            if words:
                sentence_word_counts.append(len(words))
            else:
                sentence_word_counts.append(0)

        if not any(sentence_word_counts):
            return []

        lines = []
        cursor = 0
        sentence_count = len([count for count in sentence_word_counts if count > 0])
        fallback_span = duration / sentence_count if sentence_count else 0.0

        for sentence_idx, sentence in enumerate(sentences):
            words_in_sentence = sentence_word_counts[sentence_idx] if sentence_idx < len(sentence_word_counts) else 0
            if words_in_sentence <= 0:
                continue

            word_slice = aligned_lyrics[cursor:cursor + words_in_sentence] if aligned_lyrics else []
            word_groups = self._split_words_by_gap(word_slice)

            if not word_groups:
                start = fallback_span * len(lines)
                end = duration if len(lines) == sentence_count - 1 else start + fallback_span
                lines.append({
                    "index": len(lines),
                    "text": sentence,
                    "words": word_slice,
                    "start": float(start),
                    "end": float(end),
                })
            else:
                for segment_words in word_groups:
                    if segment_words and any((word.get("end", 0.0) or 0.0) > (word.get("start", 0.0) or 0.0) for word in segment_words):
                        start = segment_words[0].get("start", 0.0) or 0.0
                        end = segment_words[-1].get("end", start) or start
                        start = max(0.0, min(start, duration))
                        end = max(start, min(end, duration))
                    else:
                        start = fallback_span * len(lines)
                        end = duration if len(lines) == sentence_count - 1 else start + fallback_span

                    text = sentence
                    if len(word_groups) > 1:
                        text = " ".join(
                            word.get("word", "").strip()
                            for word in segment_words
                            if word.get("word", "").strip()
                        ).strip() or sentence

                    lines.append({
                        "index": len(lines),
                        "text": text,
                        "words": segment_words,
                        "start": float(start),
                        "end": float(end),
                    })

            cursor += words_in_sentence

        return lines

    def _split_words_by_gap(self, words: list, gap_threshold: float = 2.0) -> list:
        """Split word timing lists when there is a long silence between words."""
        if not words:
            return []

        groups = []
        current_group = [words[0]]

        for word in words[1:]:
            previous_word = current_group[-1]
            previous_end = float(previous_word.get("end", 0.0) or 0.0)
            next_start = float(word.get("start", 0.0) or 0.0)

            if next_start - previous_end >= gap_threshold:
                groups.append(current_group)
                current_group = [word]
            else:
                current_group.append(word)

        groups.append(current_group)
        return groups

    def _build_rhythm_segments(self, beats: list, duration: float) -> list:
        """Build a full-duration rhythm timeline for songs without lyrics."""
        if duration <= 0:
            return []

        clean_beats = sorted(
            {
                float(beat)
                for beat in beats
                if beat is not None and 0 <= float(beat) <= duration
            }
        )

        if clean_beats:
            boundaries = clean_beats[:]
            if boundaries[0] > 0:
                boundaries.insert(0, 0.0)
            if boundaries[-1] < duration:
                boundaries.append(float(duration))
        else:
            block_count = max(1, min(32, int(np.ceil(duration / 2.0))))
            step = duration / block_count
            boundaries = [idx * step for idx in range(block_count)] + [float(duration)]

        segments = []
        for idx in range(len(boundaries) - 1):
            start = max(0.0, min(float(boundaries[idx]), duration))
            end = max(start, min(float(boundaries[idx + 1]), duration))
            if end <= start and idx < len(boundaries) - 2:
                continue

            beat = clean_beats[idx] if idx < len(clean_beats) else None
            segments.append({
                "index": len(segments),
                "text": f"Beat {len(segments) + 1}",
                "start": start,
                "end": end,
                "beat": beat,
            })

        return segments

    def _chunk_lyric_lines(self, aligned_lyrics: list, words_per_line: int = 6) -> list:
        """Fallback: chunk aligned words into fixed-size lines."""
        lines = []
        for idx in range(0, len(aligned_lyrics), words_per_line):
            word_slice = aligned_lyrics[idx:idx + words_per_line]
            if not word_slice:
                continue

            start = word_slice[0].get("start", 0.0) or 0.0
            end = word_slice[-1].get("end", start) or start
            line_text = " ".join([w.get("word", "") for w in word_slice]).strip()

            lines.append({
                "index": len(lines),
                "text": line_text,
                "words": word_slice,
                "start": float(start),
                "end": float(end),
            })

        return lines

    def _validate_lyric_timing(self, aligned_lyrics: list, duration: float) -> Tuple[list, list]:
        """
        Validate lyric timing and clamp within audio duration.

        Returns:
            Tuple of (validated_lyrics, warnings)
        """
        warnings = []
        validated = []
        prev_start = -1.0

        for idx, word in enumerate(aligned_lyrics):
            start = float(word.get("start", 0.0) or 0.0)
            end = float(word.get("end", start) or start)

            if start < 0.0 or end < 0.0:
                warnings.append(f"Lyric {idx} has negative timing: start={start}, end={end}")

            if start > duration:
                warnings.append(f"Lyric {idx} starts after duration: start={start}, duration={duration}")

            if end > duration:
                warnings.append(f"Lyric {idx} ends after duration: end={end}, duration={duration}")

            start = max(0.0, min(start, duration))
            end = max(start, min(end, duration))

            if prev_start > start:
                warnings.append(
                    f"Lyric {idx} out of order: start={start} < prev_start={prev_start}"
                )
            prev_start = start

            validated.append({
                "index": word.get("index", idx),
                "word": word.get("word", ""),
                "start": start,
                "end": end,
            })

        for idx in range(len(validated) - 1):
            gap = validated[idx + 1]["start"] - validated[idx]["end"]
            if gap > 2.0:
                warnings.append(
                    f"Large gap between lyrics {idx} and {idx + 1}: {gap:.2f}s"
                )

        return validated, warnings

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
