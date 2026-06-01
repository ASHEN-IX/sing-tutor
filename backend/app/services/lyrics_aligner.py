"""
Lyrics alignment service - aligns word timings to beats or audio.

Uses beat positions and linear interpolation to assign approximate timestamps to words,
or Whisper-based word timestamps when available.
"""

import logging
import re
import unicodedata
from typing import List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)


class LyricsAligner:
    """Aligns lyrics words to beat positions and generates timestamps."""

    _whisper_model = None
    _whisper_model_name: Optional[str] = None

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
        if not lyric_objects:
            return []

        # If there are no beats detected, distribute words evenly across duration
        if not beats:
            logger.warning("No beats detected — distributing words evenly across duration.")
            return self.distribute_words_evenly(lyric_objects, duration)

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
                interval = beats[0] if beats[0] > 0.0 else (duration / max(n_words, 1))
                start = max(0.0, word_time - interval / 8)
                # If the first detected beat is at time 0.0 (common), use the next beat as the end
                if n_beats > 1 and beats[0] == 0.0:
                    end = min(beats[1], word_time + interval / 8)
                else:
                    end = min(beats[0] if beats[0] > 0.0 else min(duration, 0.5), word_time + interval / 8)
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
                beat_interval = beats[-1] - beats[-2] if n_beats > 1 else (duration / max(n_words, 1))
                start = max(beats[-1], word_time - beat_interval / 8)
                end = min(duration, word_time + beat_interval / 8)
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

    def align_lyrics_with_whisper(
        self,
        lyric_objects: List[dict],
        audio_path: str,
        duration: float,
        language: Optional[str] = None,
        model_name: str = "base"
    ) -> Tuple[List[dict], float]:
        """
        Align lyrics to Whisper word timestamps.

        Returns:
            Tuple of (aligned lyrics, match ratio)
        """
        if not lyric_objects:
            return [], 0.0

        transcript_words = self._transcribe_words(
            audio_path,
            language=language,
            model_name=model_name
        )

        if not transcript_words:
            raise RuntimeError("Whisper produced no word timestamps")

        normalized_transcript = [self._normalize_word(w["word"]) for w in transcript_words]
        normalized_lyrics = [self._normalize_word(w["word"]) for w in lyric_objects]

        matches = [None] * len(lyric_objects)
        transcript_idx = 0
        for lyric_idx, lyric_word in enumerate(normalized_lyrics):
            if not lyric_word:
                continue
            while transcript_idx < len(normalized_transcript):
                transcript_word = normalized_transcript[transcript_idx]
                if lyric_word == transcript_word:
                    matches[lyric_idx] = transcript_words[transcript_idx]
                    transcript_idx += 1
                    break
                transcript_idx += 1

        match_count = len([m for m in matches if m is not None])
        match_ratio = match_count / max(len(lyric_objects), 1)

        if match_ratio < 0.2:
            raise RuntimeError(
                f"Whisper match ratio too low ({match_ratio:.2f}); falling back"
            )

        aligned = []
        for i, word_obj in enumerate(lyric_objects):
            if matches[i] is not None:
                start = float(matches[i]["start"])
                end = float(matches[i]["end"])
            else:
                start = None
                end = None

            aligned.append({
                "index": word_obj["index"],
                "word": word_obj["word"],
                "start": start,
                "end": end,
            })

        aligned = self._fill_missing_word_times(aligned, duration)
        logger.info(
            "Aligned %s/%s words using Whisper (match ratio %.2f)",
            match_count,
            len(lyric_objects),
            match_ratio,
        )
        return aligned, float(match_ratio)

    def align_sentences_with_whisper(
        self,
        sentences: List[str],
        audio_path: str,
        duration: float,
        language: Optional[str] = None,
        model_name: str = "base",
    ) -> Tuple[List[dict], float]:
        """Align sentence spans to Whisper word timestamps."""
        if not sentences:
            return [], 0.0

        sentence_word_counts = []
        flattened_words = []
        for sentence in sentences:
            words = self.parse_sentence_words(sentence)
            sentence_word_counts.append(len(words))
            for word in words:
                flattened_words.append({"index": len(flattened_words), "word": word})

        if not flattened_words:
            return [], 0.0

        aligned_words = self._transcribe_words(audio_path, language=language, model_name=model_name)
        if not aligned_words:
            raise RuntimeError("Whisper produced no word timestamps")

        normalized_transcript = [self._normalize_word(w["word"]) for w in aligned_words]
        transcript_idx = 0
        total_matched_words = 0
        aligned_sentences = []
        sentence_count = len([count for count in sentence_word_counts if count > 0])
        fallback_span = duration / sentence_count if sentence_count else 0.0

        for sentence_idx, sentence in enumerate(sentences):
            word_count = sentence_word_counts[sentence_idx] if sentence_idx < len(sentence_word_counts) else 0
            if word_count <= 0:
                continue

            sentence_words = flattened_words[sum(sentence_word_counts[:sentence_idx]):sum(sentence_word_counts[:sentence_idx]) + word_count]
            sentence_tokens = [self._normalize_word(word["word"]) for word in sentence_words]

            matched_indices = []
            search_idx = transcript_idx
            for token in sentence_tokens:
                if not token:
                    continue
                found = None
                while search_idx < len(normalized_transcript):
                    if normalized_transcript[search_idx] == token:
                        found = search_idx
                        search_idx += 1
                        break
                    search_idx += 1
                if found is None:
                    break
                matched_indices.append(found)

            word_slice = []
            if matched_indices:
                word_slice = [aligned_words[i] for i in matched_indices]
                total_matched_words += len(matched_indices)
                transcript_idx = matched_indices[-1] + 1

            if word_slice and any((word.get("end", 0.0) or 0.0) > (word.get("start", 0.0) or 0.0) for word in word_slice):
                start = float(word_slice[0].get("start", 0.0) or 0.0)
                end = float(word_slice[-1].get("end", start) or start)
                start = max(0.0, min(start, duration))
                end = max(start, min(end, duration))
            else:
                start = fallback_span * len(aligned_sentences)
                end = duration if len(aligned_sentences) == sentence_count - 1 else start + fallback_span

            aligned_sentences.append({
                "index": len(aligned_sentences),
                "text": sentence,
                "words": word_slice,
                "start": float(start),
                "end": float(end),
            })

        match_ratio = total_matched_words / max(len(flattened_words), 1)
        if match_ratio < 0.2:
            raise RuntimeError(f"Whisper match ratio too low ({match_ratio:.2f}); falling back")

        return aligned_sentences, float(match_ratio)

    def calculate_alignment_quality_from_match_ratio(self, match_ratio: float) -> float:
        """Convert a Whisper match ratio to a 0-1 quality score."""
        if match_ratio <= 0:
            return 0.0
        return float(min(1.0, max(0.0, match_ratio)))

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

    def _fill_missing_word_times(self, aligned: List[dict], duration: float) -> List[dict]:
        """Fill missing word timings by interpolating between known timestamps."""
        if not aligned:
            return aligned

        # Fill gaps before the first known word
        first_known = next((i for i, w in enumerate(aligned) if w["start"] is not None), None)
        if first_known is not None and first_known > 0:
            end_time = aligned[first_known]["start"]
            step = end_time / first_known if end_time > 0 else 0.2
            for i in range(first_known):
                aligned[i]["start"] = float(step * i)
                aligned[i]["end"] = float(step * (i + 1))

        # Fill gaps between known words
        prev_idx = None
        for i, word in enumerate(aligned):
            if word["start"] is None:
                continue
            if prev_idx is not None and i - prev_idx > 1:
                gap = i - prev_idx - 1
                start_time = aligned[prev_idx]["end"]
                end_time = word["start"]
                step = (end_time - start_time) / (gap + 1) if end_time > start_time else 0.2
                for g in range(gap):
                    idx = prev_idx + 1 + g
                    aligned[idx]["start"] = float(start_time + step * g)
                    aligned[idx]["end"] = float(start_time + step * (g + 1))
            prev_idx = i

        # Fill gaps after the last known word
        last_known = next((i for i in range(len(aligned) - 1, -1, -1) if aligned[i]["start"] is not None), None)
        if last_known is not None and last_known < len(aligned) - 1:
            gap = len(aligned) - 1 - last_known
            start_time = aligned[last_known]["end"]
            end_time = duration if duration > start_time else start_time + gap * 0.2
            step = (end_time - start_time) / (gap + 1) if end_time > start_time else 0.2
            for g in range(gap):
                idx = last_known + 1 + g
                aligned[idx]["start"] = float(start_time + step * g)
                aligned[idx]["end"] = float(start_time + step * (g + 1))

        # Ensure all words have a minimal duration
        for word in aligned:
            if word["start"] is None or word["end"] is None:
                word["start"] = 0.0
                word["end"] = min(0.2, duration)
            if word["end"] < word["start"]:
                word["end"] = word["start"] + 0.1

        return aligned

    def _transcribe_words(
        self,
        audio_path: str,
        language: Optional[str] = None,
        model_name: str = "base"
    ) -> List[dict]:
        """Run Whisper transcription and extract word-level timestamps."""
        try:
            import whisper
        except ImportError as exc:
            raise RuntimeError("Whisper is not installed") from exc

        model = self._load_whisper_model(whisper, model_name)
        result = model.transcribe(
            audio_path,
            language=language,
            word_timestamps=True,
            fp16=False,
        )

        words = []
        for segment in result.get("segments", []):
            for word in segment.get("words", []):
                if "start" in word and "end" in word:
                    words.append(word)

        return words

    def _load_whisper_model(self, whisper_module, model_name: str):
        """Load and cache Whisper model."""
        if self._whisper_model is None or self._whisper_model_name != model_name:
            logger.info("Loading Whisper model: %s", model_name)
            self._whisper_model = whisper_module.load_model(model_name)
            self._whisper_model_name = model_name
        return self._whisper_model

    def _normalize_word(self, word: str) -> str:
        """Normalize words for matching across lyrics and transcript."""
        if not word:
            return ""
        text = word.strip().lower()
        text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
        text = re.sub(r"[^a-z0-9']+", "", text)
        return text

    def parse_sentence_words(self, sentence: str) -> List[str]:
        """Split a sentence into normalized word tokens."""
        if not sentence:
            return []
        words = re.findall(r"[\w']+", sentence, flags=re.UNICODE)
        return [self._normalize_word(word) for word in words if self._normalize_word(word)]
