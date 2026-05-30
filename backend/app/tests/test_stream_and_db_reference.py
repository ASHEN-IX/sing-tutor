import io
import uuid
import time
import soundfile as sf
import numpy as np
from fastapi.testclient import TestClient
import pytest

from app.main import app
import app.api.songs as songs_api
import app.api.routes as routes_api
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
        return None

    async def update_one(self, query, update):
        for key, doc in self._docs.items():
            if self._matches(doc, query):
                if "$set" in update:
                    doc.update(update["$set"])
                self._docs[key] = doc
                return None
        return None


class InMemoryDatabase:
    def __init__(self):
        self.songs = InMemoryCollection()


@pytest.fixture(autouse=True)
def in_memory_db(monkeypatch):
    db = InMemoryDatabase()

    async def _get_db():
        return db

    monkeypatch.setattr(routes_api, "get_database", _get_db)
    monkeypatch.setattr(songs_api, "get_database", _get_db)
    monkeypatch.setattr(auth_api, "get_database", _get_db)
    # Prevent real MongoDB connections during tests
    import app.db.database as database
    monkeypatch.setattr(database.db_manager, "connect", lambda: None)
    monkeypatch.setattr(database.db_manager, "get_db", lambda: db)
    # Force storage service to use filesystem fallback during tests
    try:
        songs_api.storage_service.use_gridfs = False
    except Exception:
        pass
    return db




def _wav_bytes(freq: float = 440.0, sr: int = 16000, duration: float = 1.0) -> bytes:
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    signal = 0.5 * np.sin(2 * np.pi * freq * t).astype(np.float32)
    buffer = io.BytesIO()
    sf.write(buffer, signal, sr, format="WAV")
    return buffer.getvalue()


import asyncio


@pytest.mark.anyio
async def test_build_reference_and_stream_audio(tmp_path):
    # Prepare a song in storage (simulate upload)
    song_id = str(uuid.uuid4())
    audio_bytes = _wav_bytes(duration=1.5)
    lyrics_text = "Hello world\nThis is a test"

    songs_api.storage_service.create_song_directory(song_id)
    songs_api.storage_service.save_audio_file(song_id, audio_bytes, filename="original.mp3")
    songs_api.storage_service.save_lyrics_file(song_id, lyrics_text, filename="lyrics.txt")

    # Build the reference in a thread (replicates background processing)
    reference = await asyncio.to_thread(
        songs_api.reference_builder.build_reference,
        song_id,
        "Integration Test",
        "Tester",
        "en",
        "beginner",
        str(songs_api.storage_service.get_file_path(song_id, "original.mp3")),
        lyrics_text,
    )

    await asyncio.to_thread(songs_api.reference_builder.save_reference, reference)

    # Stream from storage generator and ensure bytes are produced
    gen = songs_api.storage_service.stream_audio_file(song_id, filename="original.mp3")
    chunks = []
    for chunk in gen:
        chunks.append(chunk)
        if sum(len(c) for c in chunks) > 100:
            break
    assert sum(len(c) for c in chunks) > 0

    # Verify reference persisted (filesystem or DB stub)
    loaded = songs_api.storage_service.load_reference_json(song_id)
    assert isinstance(loaded, dict)
    assert "diagnostics" in loaded
    diag = loaded["diagnostics"]
    assert "alignment_quality" in diag
    assert "match_ratio" in diag or "matchRatio" in diag
