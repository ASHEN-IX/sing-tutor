import io

import numpy as np
import pytest
import soundfile as sf

from app.services.audio_preprocessor import AudioPreprocessor, TARGET_SAMPLE_RATE


def _wav_bytes_from_signal(signal: np.ndarray, sr: int) -> bytes:
    buffer = io.BytesIO()
    sf.write(buffer, signal, sr, format="WAV")
    return buffer.getvalue()


def test_load_from_bytes_resamples_and_normalizes():
    sr = 22050
    t = np.linspace(0, 1.0, int(sr), endpoint=False)
    signal = 0.25 * np.sin(2 * np.pi * 440 * t).astype(np.float32)

    audio_bytes = _wav_bytes_from_signal(signal, sr)
    audio, out_sr = AudioPreprocessor.load_from_bytes(audio_bytes)

    assert out_sr == TARGET_SAMPLE_RATE
    assert audio.dtype == np.float32
    assert audio.ndim == 1
    assert audio.size > 0
    assert np.max(np.abs(audio)) == pytest.approx(1.0, rel=1e-2)


def test_load_from_bytes_rejects_empty_audio():
    with pytest.raises(ValueError, match="Invalid or unsupported audio file"):
        AudioPreprocessor.load_from_bytes(b"")


def test_duration_matches_signal_length():
    sr = 16000
    seconds = 1.5
    audio = np.zeros(int(sr * seconds), dtype=np.float32)

    duration = AudioPreprocessor.duration(audio, sr)

    assert duration == pytest.approx(seconds)