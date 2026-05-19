from __future__ import annotations

import io
import numpy as np
import librosa


TARGET_SAMPLE_RATE = 16000


class AudioPreprocessor:
    """
    Loads audio from uploaded bytes and prepares it for pitch analysis.

    Processing steps:
    - Convert to mono
    - Resample to 16 kHz
    - Normalize amplitude
    - Return float32 NumPy array
    """

    @staticmethod
    def load_from_bytes(
        audio_bytes: bytes,
        target_sr: int = TARGET_SAMPLE_RATE,
    ) -> tuple[np.ndarray, int]:
        """
        Load audio from bytes.

        Args:
            audio_bytes: Raw file bytes.
            target_sr: Desired sample rate.

        Returns:
            Tuple (audio, sample_rate)
        """
        buffer = io.BytesIO(audio_bytes)

        try:
            audio, sr = librosa.load(
                buffer,
                sr=target_sr,
                mono=True,
                dtype=np.float32,
            )
        except Exception as exc:
            raise ValueError("Invalid or unsupported audio file.") from exc

        if audio.size == 0:
            raise ValueError("Empty audio file.")

        # Normalize amplitude
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            audio = audio / max_val

        return audio.astype(np.float32), sr

    @staticmethod
    def duration(audio: np.ndarray, sr: int) -> float:
        """
        Calculate duration in seconds.
        """
        return float(len(audio) / sr)

