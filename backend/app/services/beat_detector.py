"""
Beat detection service - detects beat positions in audio.

Uses librosa onset detection to find beat boundaries.
"""

import librosa
import numpy as np
import logging
from typing import List

logger = logging.getLogger(__name__)


class BeatDetector:
    """Detects beat positions in audio."""

    def __init__(self, sr: int = 22050):
        """
        Initialize beat detector.

        Args:
            sr: Sample rate (default 22050 Hz)
        """
        self.sr = sr
        logger.info(f"BeatDetector initialized with sr={sr}")

    def detect_beats(self, y: np.ndarray, units: str = "time") -> List[float]:
        """
        Detect beat positions in audio signal.

        Args:
            y: Audio time series
            units: Return beats in 'time' (seconds) or 'frames'

        Returns:
            List of beat positions in seconds

        Note:
            - Uses librosa's beat tracking algorithm
            - Typically accurate to ±50-100ms
            - May struggle with songs that have non-uniform tempo
            - Confidence scores not returned (simple positions only)
        """
        try:
            # Compute onset strength
            onset_env = librosa.onset.onset_strength(y=y, sr=self.sr)

            # Estimate tempo
            tempo, beats_frames = librosa.beat.beat_track(
                onset_envelope=onset_env,
                sr=self.sr,
                units=units
            )

            logger.debug(f"Detected beats: count={len(beats_frames)}, tempo={tempo:.1f} BPM")

            if isinstance(beats_frames, np.ndarray):
                beats_frames = beats_frames.tolist()

            return beats_frames

        except Exception as e:
            logger.warning(f"Beat detection failed: {e}. Returning empty beats list.")
            return []

    def detect_beats_with_confidence(self, y: np.ndarray) -> List[dict]:
        """
        Detect beats with approximate confidence scores.

        Args:
            y: Audio time series

        Returns:
            List of dicts with 'time' and 'confidence' keys

        Note:
            - Confidence is estimated based on onset strength
            - Not a true confidence (which would require trained model)
            - Used mainly for visualization purposes
        """
        try:
            # Detect beats
            onset_env = librosa.onset.onset_strength(y=y, sr=self.sr)
            tempo, beats_frames = librosa.beat.beat_track(
                onset_envelope=onset_env,
                sr=self.sr,
                units="frames"
            )

            # Convert frames to time
            beats_time = librosa.frames_to_time(beats_frames, sr=self.sr)

            # Create results with confidence based on onset strength
            results = []
            for beat_frame, beat_time in zip(beats_frames, beats_time):
                # Get onset strength at this beat
                frame_idx = min(int(beat_frame), len(onset_env) - 1)
                confidence = min(1.0, float(onset_env[frame_idx] / (np.max(onset_env) + 1e-9)))

                results.append({
                    "time": float(beat_time),
                    "confidence": confidence
                })

            logger.debug(f"Detected beats with confidence: {len(results)} beats")
            return results

        except Exception as e:
            logger.warning(f"Beat detection with confidence failed: {e}")
            return []

    def detect_beats_from_file(self, audio_path: str) -> List[float]:
        """
        Detect beats directly from audio file.

        Args:
            audio_path: Path to audio file

        Returns:
            List of beat positions in seconds

        Raises:
            FileNotFoundError: If file doesn't exist
            RuntimeError: If audio cannot be loaded
        """
        try:
            y, sr = librosa.load(audio_path, sr=self.sr)
            beats = self.detect_beats(y, units="time")
            logger.info(f"Detected {len(beats)} beats from {audio_path}")
            return beats

        except FileNotFoundError:
            logger.error(f"Audio file not found: {audio_path}")
            raise
        except Exception as e:
            logger.error(f"Failed to detect beats: {e}")
            raise RuntimeError(f"Failed to detect beats from {audio_path}: {e}")
