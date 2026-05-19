"""
Melody extraction service - extracts pitch contour from audio.

Uses librosa.pyin (Probabilistic YIN) for f0 (fundamental frequency) estimation.
"""

import librosa
import numpy as np
import logging
import math
from typing import List, Tuple

logger = logging.getLogger(__name__)


class MelodyExtractor:
    """Extracts pitch contour (melody) from audio."""

    def __init__(self, sr: int = 22050, fmin: float = 50, fmax: float = 2000):
        """
        Initialize melody extractor.

        Args:
            sr: Sample rate (default 22050 Hz)
            fmin: Minimum frequency to search (Hz, default 50)
            fmax: Maximum frequency to search (Hz, default 2000)
        """
        self.sr = sr
        self.fmin = fmin
        self.fmax = fmax
        logger.info(f"MelodyExtractor initialized: sr={sr}, fmin={fmin}, fmax={fmax}")

    @staticmethod
    def frequency_to_midi(frequency: float) -> float:
        """
        Convert frequency in Hz to MIDI note number.

        Uses standard formula: MIDI = 69 + 12 * log2(frequency / 440)

        Args:
            frequency: Frequency in Hz

        Returns:
            MIDI note number (0-127)
        """
        if frequency <= 0:
            return 0
        midi = 69 + 12 * math.log2(frequency / 440.0)
        return max(0, min(127, midi))  # Clamp to valid MIDI range

    def extract_pitch_contour(
        self,
        y: np.ndarray,
        downsample_factor: int = 10
    ) -> List[dict]:
        """
        Extract pitch contour using librosa.pyin.

        Args:
            y: Audio time series
            downsample_factor: Reduce resolution by this factor (10 = ~10Hz output)

        Returns:
            List of dicts with 'timestamp', 'frequency', 'confidence' keys

        Note:
            - Uses probabilistic YIN algorithm (pyin)
            - Very robust to vibrato and noise
            - Returns confidence scores for each frame
            - Downsampling reduces storage but maintains perceptual accuracy
            - Typical frame rate before downsampling: 100 Hz
            - After downsampling by 10: ~10 Hz (one sample every 100ms)
        """
        try:
            # Compute f0 using pyin
            f0, voiced_flag, voiced_probs = librosa.pyin(
                y,
                fmin=self.fmin,
                fmax=self.fmax,
                sr=self.sr,
                frame_length=2048
            )

            # Create frame times
            frame_times = librosa.frames_to_time(
                np.arange(len(f0)),
                sr=self.sr,
                hop_length=512
            )

            # Downsample
            indices = np.arange(0, len(f0), downsample_factor)

            results = []
            for idx in indices:
                if idx < len(f0):
                    # Only include voiced frames
                    if voiced_flag[idx]:
                        frequency = float(f0[idx])
                        results.append({
                            "timestamp": float(frame_times[idx]),
                            "frequency": frequency,
                            "midi": self.frequency_to_midi(frequency),
                            "confidence": float(voiced_probs[idx])
                        })

            logger.info(f"Extracted pitch contour: {len(results)} samples")
            return results

        except Exception as e:
            logger.warning(f"Pitch extraction failed: {e}")
            return []

    def extract_pitch_contour_raw(self, y: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Extract raw pitch contour (without downsampling or filtering).

        Args:
            y: Audio time series

        Returns:
            Tuple of (f0, voiced_flag, voiced_probs) from librosa.pyin

        Note:
            - Use this for direct analysis or custom downsampling
            - See extract_pitch_contour() for processed version
        """
        try:
            f0, voiced_flag, voiced_probs = librosa.pyin(
                y,
                fmin=self.fmin,
                fmax=self.fmax,
                sr=self.sr,
                frame_length=2048
            )
            return f0, voiced_flag, voiced_probs

        except Exception as e:
            logger.error(f"Raw pitch extraction failed: {e}")
            raise

    def extract_pitch_from_file(
        self,
        audio_path: str,
        downsample_factor: int = 10
    ) -> List[dict]:
        """
        Extract pitch contour directly from audio file.

        Args:
            audio_path: Path to audio file
            downsample_factor: Reduction factor for frame rate

        Returns:
            List of pitch data points

        Raises:
            FileNotFoundError: If file doesn't exist
            RuntimeError: If audio cannot be loaded
        """
        try:
            y, sr = librosa.load(audio_path, sr=self.sr)
            logger.info(f"Loaded audio for pitch extraction: {audio_path}")
            pitch_contour = self.extract_pitch_contour(y, downsample_factor)
            logger.info(f"Extracted pitch from {audio_path}: {len(pitch_contour)} samples")
            return pitch_contour

        except FileNotFoundError:
            logger.error(f"Audio file not found: {audio_path}")
            raise
        except Exception as e:
            logger.error(f"Failed to extract pitch: {e}")
            raise RuntimeError(f"Failed to extract pitch from {audio_path}: {e}")

    def get_pitch_statistics(self, pitch_contour: List[dict]) -> dict:
        """
        Compute statistics on pitch contour.

        Args:
            pitch_contour: List of pitch data points

        Returns:
            Dictionary with statistics
        """
        if not pitch_contour:
            return {
                "mean_frequency": 0,
                "min_frequency": 0,
                "max_frequency": 0,
                "voiced_coverage": 0,
            }

        frequencies = [p["frequency"] for p in pitch_contour]
        confidences = [p["confidence"] for p in pitch_contour]

        return {
            "mean_frequency": float(np.mean(frequencies)),
            "min_frequency": float(np.min(frequencies)),
            "max_frequency": float(np.max(frequencies)),
            "voiced_coverage": float(np.mean(confidences)),
        }
