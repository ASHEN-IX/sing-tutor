import io

import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def _wav_bytes(freq: float = 440.0, sr: int = 16000, duration: float = 1.0) -> bytes:
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    signal = 0.5 * np.sin(2 * np.pi * freq * t).astype(np.float32)
    buffer = io.BytesIO()
    sf.write(buffer, signal, sr, format="WAV")
    return buffer.getvalue()


def test_health_endpoint_returns_healthy_status():
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"


def test_list_songs_returns_items():
    response = client.get("/api/songs")

    assert response.status_code == 200
    songs = response.json()
    assert isinstance(songs, list)
    assert len(songs) > 0
    assert {"id", "title", "artist"}.issubset(songs[0].keys())


def test_analyze_recording_mock_endpoint_contract():
    response = client.post("/api/recordings/song_001/analyze", params={"recording_id": "rec_test"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["recording_id"] == "rec_test"
    assert payload["song_id"] == "song_001"
    assert "overall_accuracy" in payload
    assert isinstance(payload["recommendations"], list)


def test_pitch_analysis_endpoint_accepts_audio_upload():
    response = client.post(
        "/api/analysis/pitch",
        files={"file": ("recording.wav", _wav_bytes(), "audio/wav")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["sample_rate"] == 16000
    assert payload["duration"] > 0
    assert payload["num_points"] >= 1
    assert isinstance(payload["pitch_data"], list)
    assert len(payload["pitch_data"]) == payload["num_points"]


def test_pitch_analysis_endpoint_rejects_non_audio_upload():
    response = client.post(
        "/api/analysis/pitch",
        files={"file": ("notes.txt", b"not-audio", "text/plain")},
    )

    assert response.status_code == 400
    assert "audio" in response.json()["detail"].lower()


def test_websocket_pitch_stream_sends_pitch_point():
    with client.websocket_connect("/ws/pitch/rec_test") as websocket:
        payload = websocket.receive_json()

    assert {"timestamp", "frequency", "confidence"}.issubset(payload.keys())