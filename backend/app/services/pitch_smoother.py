from __future__ import annotations

import numpy as np
from scipy.signal import medfilt


class PitchSmoother:
    """
    Smooths detected pitch values to reduce spikes.
    """

    @staticmethod
    def smooth(
        frequencies: np.ndarray,
        kernel_size: int = 5,
    ) -> np.ndarray:
        """
        Apply median filtering to voiced frames only.
        """
        if len(frequencies) == 0:
            return frequencies

        if kernel_size % 2 == 0:
            kernel_size += 1

        kernel_size = max(3, kernel_size)

        voiced_mask = frequencies > 0

        if not np.any(voiced_mask):
            return frequencies

        smoothed = frequencies.copy()

        smoothed[voiced_mask] = medfilt(
            frequencies[voiced_mask],
            kernel_size=kernel_size,
        )

        return smoothed
