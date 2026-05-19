"""
Lyrics alignment service - aligns word timings to beats.

Uses beat positions and linear interpolation to assign approximate timestamps to words.
"""

import numpy as np
import logging
from typing import List

logger = logging.getLogger(__name__)


class LyricsAligner:
    """Aligns lyrics words to beat positions and generates timestamps."""

    def align_lyrics_to_beats(
        self,
        lyric_objects: List[dict],
        beats: List[float],
        duration: float
    ) -> List[dict]:
        """
        Align lyrics to beat positions using linear distribution.

        Args:
            lyric_objects: List of word objects from parser
            beats: List of beat positions (seconds)
            duration: Total song duration (seconds)

        Returns:
            List of lyric objects with start/end times assigned

        Algorithm:
            1. Distribute words across beats proportionally
            2. Assign each word a start/end time based on adjacent beats
            3. Handle edge cases (sparse lyrics, no beats, etc.)

        Note:
            - Typical alignment error: ±50-200ms
            - More accurate with more beats
            - Assumes words are distributed evenly
        """
        if not lyric_objects or not beats:
            logger.warning("No lyrics or beats provided. Returning unaligned lyrics.")
            return lyric_objects

        n_words = len(lyric_objects)
        n_beats = len(beats)

        logger.info(f"Aligning {n_words} words to {n_beats} beats")

        # Simple distribution: spread words across beats
        aligned = []
        for i, word_obj in enumerate(lyric_objects):
            # Position in the song (0 to 1)
            word_position = i / max(n_words - 1, 1) if n_words > 1 else 0

            # Calculate time based on position
            word_time = word_position * duration

            # Find surrounding beats for alignment
            beat_idx = np.searchsorted(beats, word_time)

            # Estimate word start and end
            if beat_idx == 0 and beats:
                # Before first beat
                start = 0.0
                end = beats[0]
            elif beat_idx > 0 and beat_idx < n_beats:
                # Between beats
                prev_beat = beats[beat_idx - 1]
                next_beat = beats[beat_idx]
                # Assume word spans 1/4 beat interval
                beat_interval = next_beat - prev_beat
                start = max(prev_beat, word_time - beat_interval / 8)
                end = min(next_beat, word_time + beat_interval / 8)
            elif beat_idx >= n_beats and beats:
                # After last beat
                start = beats[-1]
                end = duration
            else:
                # No beats available
                start = word_time
                end = word_time + (duration / max(n_words, 1))

            # Ensure valid range
            start = max(0.0, min(start, duration))
            end = max(start, min(end, duration))

            aligned.append({
                "index": word_obj["index"],
                "word": word_obj["word"],
                "start": float(start),
                "end": float(end),
            })

        logger.debug(f"Aligned {len(aligned)} words")
        return aligned

    def distribute_words_evenly(
        self,
        lyric_objects: List[dict],
        duration: float,
        words_per_second: float = 3.0
    ) -> List[dict]:
        """
        Distribute words evenly across song duration (fallback when no beats available).

        Args:
            lyric_objects: List of word objects
            duration: Total song duration (seconds)
            words_per_second: Assumed speaking/singing rate (default 3 words/sec)

        Returns:
            List of lyric objects with start/end times assigned

        Note:
            - Used when beat detection fails
            - Typical singing rate: 2-4 words/second
            - This is a basic fallback; alignment quality will be lower
        """
        n_words = len(lyric_objects)
        if n_words == 0:
            return []

        # Calculate time per word
        time_per_word = 1.0 / words_per_second

        aligned = []
        current_time = 0.0

        for i, word_obj in enumerate(lyric_objects):
            start = current_time
            end = min(current_time + time_per_word, duration)

            # Adjust last word to end exactly at song end
            if i == n_words - 1:
                end = duration

            aligned.append({
                "index": word_obj["index"],
                "word": word_obj["word"],
                "start": float(start),
                "end": float(end),
            })

            current_time = end

        logger.info(f"Distributed {len(aligned)} words evenly (fallback alignment)")
        return aligned

    def calculate_alignment_quality(
        self,
        aligned_lyrics: List[dict],
        beats: List[float],
        duration: float
    ) -> float:
        """
        Calculate a simple quality score for alignment (0-1).

        Args:
            aligned_lyrics: Aligned lyrics with timings
            beats: Beat positions
            duration: Total duration

        Returns:
            Quality score (0-1)

        Note:
            - Higher score = better alignment
            - Considers beat density and coverage
            - Not a ground truth; only a heuristic
        """
        if not beats or not aligned_lyrics:
            return 0.5  # Medium quality if no beats

        # Check if beat positions align well with word boundaries
        n_words = len(aligned_lyrics)
        n_beats = len(beats)

        # Ideal ratio: ~3-5 beats per word
        ratio = n_beats / max(n_words, 1)
        ratio_score = min(1.0, max(0.0, 1.0 - abs(ratio - 4.0) / 5.0))

        # Check beat distribution uniformity
        if n_beats > 1:
            beat_intervals = np.diff(beats)
            interval_std = np.std(beat_intervals)
            interval_mean = np.mean(beat_intervals)
            uniformity_score = 1.0 - min(1.0, interval_std / (interval_mean + 1e-9))
        else:
            uniformity_score = 0.5

        # Overall quality
        quality = (ratio_score + uniformity_score) / 2
        logger.debug(f"Alignment quality: {quality:.2f} (ratio={ratio:.2f}, uniformity={uniformity_score:.2f})")
        return float(quality)
