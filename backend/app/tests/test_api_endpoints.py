import io
from types import SimpleNamespace

import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient
import pytest

from app.main import app
import app.api.routes as routes_api
import app.api.songs as songs_api
import app.api.auth as auth_api


class InMemoryCursor:
    def __init__(self, items):
        self._items = list(items)

    async def to_list(self, length: int = 100):
        return self._items[:length]


class InMemoryCollection:
    def __init__(self, docs=None):
        self._docs = {}
        if docs:
            for doc in docs:
                self._docs[doc["_id"]] = dict(doc)

    def _matches(self, doc, query):
        for key, value in query.items():
            if doc.get(key) != value:
                return False
        return True

    def find(self, query):
        items = [doc for doc in self._docs.values() if self._matches(doc, query)]
        return InMemoryCursor(items)

    async def find_one(self, query):
        for doc in self._docs.values():
            if self._matches(doc, query):
                return dict(doc)
        return None

    async def insert_one(self, doc):
        self._docs[doc["_id"]] = dict(doc)
        return SimpleNamespace(inserted_id=doc["_id"])

    async def update_one(self, query, update):
        for key, doc in self._docs.items():
            if self._matches(doc, query):
                if "$set" in update:
                    doc.update(update["$set"])
                self._docs[key] = doc
                return SimpleNamespace(modified_count=1)
        return SimpleNamespace(modified_count=0)

    async def delete_one(self, query):
        for key, doc in list(self._docs.items()):
            if self._matches(doc, query):
                del self._docs[key]
                return SimpleNamespace(deleted_count=1)
        return SimpleNamespace(deleted_count=0)


class InMemoryDatabase:
    def __init__(self):
        self.users = InMemoryCollection()
        self.sessions = InMemoryCollection()
        self.password_resets = InMemoryCollection()
        self.songs = InMemoryCollection(
            [
                {
                    "_id": "song_001",
                    "status": "completed",
                    "title": "Test Song",
                    "artist": "Test Artist",
                    "difficulty": "beginner",
                }
            ]
        )


class FakeReference:
    title = "Test Song"
    artist = "Test Artist"
    duration = 120.0
    bpm = 100.0
    key = "C Major"
    pitch_data = []


class FakeReferenceBuilder:
    @staticmethod
    def load_reference(song_id: str):
        return FakeReference()


@pytest.fixture(autouse=True)
def in_memory_db(monkeypatch):
    db = InMemoryDatabase()

    async def _get_db():
        return db

    monkeypatch.setattr(routes_api, "get_database", _get_db)
    monkeypatch.setattr(songs_api, "get_database", _get_db)
    monkeypatch.setattr(auth_api, "get_database", _get_db)
    monkeypatch.setattr(routes_api, "reference_builder", FakeReferenceBuilder())

    return db


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


def test_auth_register_login_me_flow():
    register = client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "supersecure", "name": "Test User"},
    )
    assert register.status_code == 201
    reg_payload = register.json()
    assert "tokens" in reg_payload

    login = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "supersecure"},
    )
    assert login.status_code == 200
    login_payload = login.json()
    access_token = login_payload["tokens"]["access_token"]

    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "user@example.com"


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