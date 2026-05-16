import numpy as np

from app.services.pitch_detector import PitchDetector


def test_detect_on_sine_wave():
    # Generate a 1-second A4 sine wave at 440 Hz
    sr = 16000
    t = np.linspace(0, 1.0, int(sr * 1.0), endpoint=False)
    freq = 440.0
    audio = 0.5 * np.sin(2 * np.pi * freq * t).astype(np.float32)

    pitch_data = PitchDetector.detect(audio, sr)

    # Expect at least one detected pitch near 440 Hz
    assert len(pitch_data) > 0
    freqs = [p.frequency for p in pitch_data]
    # check median is near 440
    median = np.median(freqs)
    assert abs(median - 440.0) < 5.0
