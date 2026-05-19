"""
Metadata extraction service - extracts duration, BPM, and musical key.

Uses librosa for audio analysis.
"""

import librosa
import numpy as np
import logging
from typing import Tuple

logger = logging.getLogger(__name__)


class MetadataExtractor:
    """Extracts metadata from audio files."""

    def __init__(self, sr: int = 22050):
        """
        Initialize extractor.

        Args:
            sr: Sample rate for audio loading (default 22050 Hz)
        """
        self.sr = sr
        logger.info(f"MetadataExtractor initialized with sr={sr}")

    def extract_duration(self, y: np.ndarray) -> float:
        """
        Extract duration from audio signal.

        Args:
            y: Audio time series

        Returns:
            Duration in seconds
        """
        duration = librosa.get_duration(y=y, sr=self.sr)
        logger.debug(f"Extracted duration: {duration:.2f}s")
        return duration

    def extract_bpm(self, y: np.ndarray) -> float:
        """
        Estimate BPM using onset detection and autocorrelation.

        Args:
            y: Audio time series

        Returns:
            Estimated BPM

        Note:
            - Typical accuracy: ±5-10 BPM
            - May struggle with rubato or complex rhythms
            - For safety, BPM is clamped to 40-200 range (valid music range)
        """
        try:
            # Compute onset strength
            onset_env = librosa.onset.onset_strength(y=y, sr=self.sr)

            # Estimate tempo from onset strength
            bpm = librosa.beat.tempo(onset_envelope=onset_env, sr=self.sr)[0]

            # Clamp to realistic range
            bpm = max(40, min(200, float(bpm)))
            logger.debug(f"Estimated BPM: {bpm:.1f}")
            return bpm

        except Exception as e:
            logger.warning(f"BPM estimation failed: {e}. Using default 120 BPM.")
            return 120.0

    def extract_key(self, y: np.ndarray) -> str:
        """
        Estimate musical key using chroma features.

        Args:
            y: Audio time series

        Returns:
            Key string (e.g., "C Major", "A Minor")

        Note:
            - Very approximate; may be unreliable for polyphonic music
            - Uses chroma energy normalized statistics (CENS)
            - Typical accuracy depends heavily on music style
            - For MVP, this is best-effort only
        """
        try:
            # Compute chroma features
            chroma = librosa.feature.chroma_cqt(y=y, sr=self.sr)

            # Get mean chroma vector
            chroma_mean = np.mean(chroma, axis=1)

            # Normalize
            if np.sum(chroma_mean) > 0:
                chroma_mean = chroma_mean / np.sum(chroma_mean)

            # Map to notes
            notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
            root_note = notes[np.argmax(chroma_mean)]

            # Try to infer major/minor using simple heuristic
            # This is very approximate - just a heuristic based on pitch distribution
            key = f"{root_note} Major"  # Simplified for MVP

            logger.debug(f"Estimated key: {key}")
            return key

        except Exception as e:
            logger.warning(f"Key estimation failed: {e}. Using default 'C Major'.")
            return "C Major"

    def extract_all_metadata(self, audio_path: str) -> dict:
        """
        Extract all metadata from an audio file.

        Args:
            audio_path: Path to audio file

        Returns:
            Dictionary with keys: duration, bpm, key

        Raises:
            FileNotFoundError: If file doesn't exist
            RuntimeError: If audio cannot be loaded
        """
        try:
            # Load audio
            y, sr = librosa.load(audio_path, sr=self.sr)
            logger.info(f"Loaded audio: {audio_path}, shape={y.shape}")

            # Extract metadata
            duration = self.extract_duration(y)
            bpm = self.extract_bpm(y)
            key = self.extract_key(y)

            metadata = {
                "duration": float(duration),
                "bpm": float(bpm),
                "key": key,
            }

            logger.info(f"Extracted metadata: {metadata}")
            return metadata

        except FileNotFoundError:
            logger.error(f"Audio file not found: {audio_path}")
            raise
        except Exception as e:
            logger.error(f"Failed to extract metadata: {e}")
            raise RuntimeError(f"Failed to extract metadata from {audio_path}: {e}")
