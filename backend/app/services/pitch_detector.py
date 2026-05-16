from __future__ import annotations

from typing import List

import numpy as np
import librosa

from app.schemas.pitch import PitchDataPoint
from app.services.pitch_smoother import PitchSmoother


class PitchDetector:
    """
    Detects the fundamental frequency (F0) using librosa.pyin.
    """

    @staticmethod
    def detect(
        audio: np.ndarray,
        sr: int,
    ) -> List[PitchDataPoint]:
        """
        Detect pitch over time.
        """
        hop_length = 256
        frame_length = 2048

        f0, voiced_flag, voiced_prob = librosa.pyin(
            audio,
            fmin=librosa.note_to_hz("C2"),   # ~65 Hz
            fmax=librosa.note_to_hz("C7"),   # ~2093 Hz
            sr=sr,
            frame_length=frame_length,
            hop_length=hop_length,
        )

        times = librosa.times_like(
            f0,
            sr=sr,
            hop_length=hop_length,
        )

        frequencies = np.nan_to_num(f0, nan=0.0)
        frequencies = PitchSmoother.smooth(frequencies)

        pitch_data: List[PitchDataPoint] = []

        for timestamp, frequency, probability in zip(
            times,
            frequencies,
            voiced_prob,
        ):
            if frequency <= 0:
                continue

            confidence = (
                0.0 if np.isnan(probability)
                else float(probability)
            )

            pitch_data.append(
                PitchDataPoint(
                    timestamp=float(timestamp),
                    frequency=float(frequency),
                    confidence=confidence,
                )
            )

        return pitch_data
