import numpy as np

from app.services.pitch_smoother import PitchSmoother


def test_smooth_returns_empty_for_empty_input():
    frequencies = np.array([], dtype=np.float32)

    smoothed = PitchSmoother.smooth(frequencies)

    assert smoothed.size == 0


def test_smooth_keeps_unvoiced_frames_at_zero():
    frequencies = np.array([0.0, 440.0, 0.0, 441.0, 0.0], dtype=np.float32)

    smoothed = PitchSmoother.smooth(frequencies, kernel_size=3)

    assert smoothed[0] == 0.0
    assert smoothed[2] == 0.0
    assert smoothed[4] == 0.0
    assert smoothed[1] > 0.0
    assert smoothed[3] > 0.0


def test_smooth_reduces_single_spike():
    frequencies = np.array([440.0, 440.0, 900.0, 440.0, 440.0], dtype=np.float32)

    smoothed = PitchSmoother.smooth(frequencies, kernel_size=5)

    assert smoothed[2] == 440.0