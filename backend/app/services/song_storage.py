"""
Song storage service - manages file I/O and directory structure.

Handles:
- Creating/cleaning up song directories
- Saving and loading files (audio, lyrics, reference JSON)
- Atomic operations for data consistency
"""

import os
import json
import shutil
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class SongStorageService:
    """Manages song storage, supports filesystem and GridFS (MongoDB).

    When `use_gridfs` is True the service stores audio and reference data
    in MongoDB GridFS and keeps a minimal filesystem cache for temporary
    processing. This allows the rest of the pipeline to continue using
    local file paths while keeping canonical storage in MongoDB.
    """

    def __init__(self, base_path: str = "backend/songs", use_gridfs: bool = False, mongodb_url: Optional[str] = None, db_name: str = "singing_tutor"):
        """
        Initialize storage service.

        Args:
            base_path: Root directory for local filesystem cache
            use_gridfs: If True, use MongoDB GridFS for persistent storage
            mongodb_url: MongoDB connection string (optional, falls back to env)
            db_name: MongoDB database name
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        self.use_gridfs = bool(use_gridfs)
        self._mongodb_url = mongodb_url or os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self._db_name = db_name

        # Lazy-init DB related attributes
        self._pymongo_client = None
        self._db = None
        self._fs = None

        logger.info(f"SongStorageService initialized at {self.base_path} (gridfs={self.use_gridfs})")

    def get_song_directory(self, song_id: str) -> Path:
        """Get the directory path for a song."""
        song_dir = self.base_path / song_id
        return song_dir

    def _init_db(self):
        if not self.use_gridfs:
            return
        if self._pymongo_client is not None:
            return
        try:
            from pymongo import MongoClient
            import gridfs

            self._pymongo_client = MongoClient(self._mongodb_url)
            self._db = self._pymongo_client[self._db_name]
            self._fs = gridfs.GridFS(self._db, collection="song_files")
            logger.info("Connected to MongoDB GridFS for song storage")
        except Exception as e:
            logger.error("Failed to initialize GridFS: %s", e)
            # Fail-open: fall back to filesystem-only
            self.use_gridfs = False

    def create_song_directory(self, song_id: str) -> Path:
        """
        Create directory structure for a song.

        Args:
            song_id: Unique song identifier

        Returns:
            Path to created song directory

        Raises:
            FileExistsError: If directory already exists
        """
        song_dir = self.get_song_directory(song_id)
        if song_dir.exists():
            raise FileExistsError(f"Song directory already exists: {song_dir}")

        song_dir.mkdir(parents=True, exist_ok=False)
        logger.info(f"Created song directory: {song_dir}")
        return song_dir

    def save_audio_file(self, song_id: str, audio_data: bytes, filename: str = "original.mp3") -> Path:
        """
        Save audio file to song directory.

        Args:
            song_id: Song identifier
            audio_data: Binary audio file data
            filename: Name of audio file (default: original.mp3)

        Returns:
            Path to saved file

        Raises:
            FileNotFoundError: If song directory doesn't exist
        """
        # If GridFS is enabled, store in DB and also write a local cache for processing
        if self.use_gridfs:
            self._init_db()
            if self._fs is None:
                raise RuntimeError("GridFS not initialized")

            # remove any previous files with this song_id+filename
            try:
                for f in self._db.song_files.files.find({"song_id": song_id, "filename": filename}):
                    self._fs.delete(f["_id"])  # type: ignore
            except Exception:
                pass

            gridfs_id = self._fs.put(audio_data, filename=filename, song_id=song_id, contentType="audio/mpeg")

            # ensure a small cache on disk for processing convenience
            song_dir = self.get_song_directory(song_id)
            song_dir.mkdir(parents=True, exist_ok=True)
            file_path = song_dir / filename
            with open(file_path, "wb") as f:
                f.write(audio_data)

            # also update songs collection metadata if present
            try:
                self._db.songs.update_one({"_id": song_id}, {"$set": {"audio_gridfs_id": gridfs_id}}, upsert=True)
            except Exception:
                logger.debug("Failed to write songs metadata for %s", song_id)

            logger.info("Saved audio to GridFS and cache: %s (gridfs_id=%s)", file_path, gridfs_id)
            return file_path

        # Filesystem fallback
        song_dir = self.get_song_directory(song_id)
        if not song_dir.exists():
            raise FileNotFoundError(f"Song directory not found: {song_dir}")

        file_path = song_dir / filename
        with open(file_path, "wb") as f:
            f.write(audio_data)

        logger.info(f"Saved audio file: {file_path}")
        return file_path

    def save_lyrics_file(self, song_id: str, lyrics_text: str, filename: str = "lyrics.txt") -> Path:
        """
        Save lyrics file to song directory.

        Args:
            song_id: Song identifier
            lyrics_text: Lyrics text content
            filename: Name of lyrics file (default: lyrics.txt)

        Returns:
            Path to saved file

        Raises:
            FileNotFoundError: If song directory doesn't exist
        """
        if self.use_gridfs:
            self._init_db()
            if self._db is None:
                raise RuntimeError("DB not initialized")
            # store lyrics as a regular collection document for easy querying
            self._db.song_lyrics.update_one({"_id": song_id}, {"$set": {"lyrics": lyrics_text}}, upsert=True)

            # also write cache on disk
            song_dir = self.get_song_directory(song_id)
            song_dir.mkdir(parents=True, exist_ok=True)
            file_path = song_dir / filename
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(lyrics_text)

            logger.info("Saved lyrics to DB and cache: %s", file_path)
            return file_path

        song_dir = self.get_song_directory(song_id)
        if not song_dir.exists():
            raise FileNotFoundError(f"Song directory not found: {song_dir}")

        file_path = song_dir / filename
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(lyrics_text)

        logger.info(f"Saved lyrics file: {file_path}")
        return file_path

    def save_reference_json(self, song_id: str, reference_data: dict) -> Path:
        """
        Save reference JSON file.

        Args:
            song_id: Song identifier
            reference_data: Dictionary containing reference data

        Returns:
            Path to saved file

        Raises:
            FileNotFoundError: If song directory doesn't exist
        """
        if self.use_gridfs:
            self._init_db()
            if self._db is None:
                raise RuntimeError("DB not initialized")

            # Save reference document in a dedicated collection
            try:
                self._db.song_references.update_one({"_id": song_id}, {"$set": {"reference": reference_data}}, upsert=True)
            except Exception as e:
                logger.error("Failed to save reference to DB: %s", e)
                raise

            # also write a cache file
            song_dir = self.get_song_directory(song_id)
            song_dir.mkdir(parents=True, exist_ok=True)
            file_path = song_dir / "reference.json"
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(reference_data, f, indent=2)

            logger.info("Saved reference to DB and cache: %s", file_path)
            return file_path

        song_dir = self.get_song_directory(song_id)
        if not song_dir.exists():
            raise FileNotFoundError(f"Song directory not found: {song_dir}")

        file_path = song_dir / "reference.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(reference_data, f, indent=2)

        logger.info(f"Saved reference JSON: {file_path}")
        return file_path

    def load_audio_file(self, song_id: str, filename: str = "original.mp3") -> bytes:
        """
        Load audio file from song directory.

        Args:
            song_id: Song identifier
            filename: Name of audio file

        Returns:
            Binary audio data

        Raises:
            FileNotFoundError: If file doesn't exist
        """
        if self.use_gridfs:
            self._init_db()
            # try to fetch from GridFS
            try:
                grid_file = self._db.song_files.files.find_one({"song_id": song_id, "filename": filename})
                if not grid_file:
                    raise FileNotFoundError(f"Audio file not found in GridFS for {song_id}/{filename}")
                file_id = grid_file["_id"]
                data = self._fs.get(file_id).read()  # type: ignore
                logger.info("Loaded audio from GridFS for %s/%s", song_id, filename)
                return data
            except Exception:
                # fall back to disk cache
                file_path = self.get_song_directory(song_id) / filename
                if not file_path.exists():
                    raise FileNotFoundError(f"Audio file not found: {file_path}")
                with open(file_path, "rb") as f:
                    data = f.read()
                logger.info(f"Loaded audio file from cache: {file_path}")
                return data

        file_path = self.get_song_directory(song_id) / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        with open(file_path, "rb") as f:
            data = f.read()

        logger.info(f"Loaded audio file: {file_path}")
        return data

    def load_lyrics_file(self, song_id: str, filename: str = "lyrics.txt") -> str:
        """
        Load lyrics file from song directory.

        Args:
            song_id: Song identifier
            filename: Name of lyrics file

        Returns:
            Lyrics text content

        Raises:
            FileNotFoundError: If file doesn't exist
        """
        if self.use_gridfs:
            self._init_db()
            doc = self._db.song_lyrics.find_one({"_id": song_id}) or {}
            lyrics = doc.get("lyrics")
            if lyrics:
                logger.info("Loaded lyrics from DB for %s", song_id)
                return lyrics
            # else fall back to cache
            file_path = self.get_song_directory(song_id) / filename
            if not file_path.exists():
                raise FileNotFoundError(f"Lyrics file not found: {file_path}")
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            logger.info(f"Loaded lyrics file from cache: {file_path}")
            return content

        file_path = self.get_song_directory(song_id) / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Lyrics file not found: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        logger.info(f"Loaded lyrics file: {file_path}")
        return content

    def load_reference_json(self, song_id: str) -> dict:
        """
        Load reference JSON file.

        Args:
            song_id: Song identifier

        Returns:
            Reference data dictionary

        Raises:
            FileNotFoundError: If file doesn't exist
        """
        if self.use_gridfs:
            self._init_db()
            doc = self._db.song_references.find_one({"_id": song_id}) or {}
            ref = doc.get("reference")
            if ref:
                logger.info("Loaded reference from DB for %s", song_id)
                return ref
            # fall back to cache file
            file_path = self.get_song_directory(song_id) / "reference.json"
            if not file_path.exists():
                raise FileNotFoundError(f"Reference JSON not found: {file_path}")
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            logger.info(f"Loaded reference JSON from cache: {file_path}")
            return data

        file_path = self.get_song_directory(song_id) / "reference.json"
        if not file_path.exists():
            raise FileNotFoundError(f"Reference JSON not found: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        logger.info(f"Loaded reference JSON: {file_path}")
        return data

    def song_exists(self, song_id: str) -> bool:
        """Check if song exists in storage (GridFS or filesystem)."""
        if self.use_gridfs:
            self._init_db()
            try:
                doc = self._db.songs.find_one({"_id": song_id})
                return bool(doc)
            except Exception:
                # fall back to checking cache
                return self.get_song_directory(song_id).exists()
        return self.get_song_directory(song_id).exists()

    def file_exists(self, song_id: str, filename: str) -> bool:
        """Check if a specific file exists in song directory."""
        if self.use_gridfs:
            self._init_db()
            try:
                grid_file = self._db.song_files.files.find_one({"song_id": song_id, "filename": filename})
                if grid_file:
                    return True
            except Exception:
                pass
            return self.get_song_directory(song_id).joinpath(filename).exists()

        file_path = self.get_song_directory(song_id) / filename
        return file_path.exists()

    def stream_audio_file(self, song_id: str, filename: str = "original.mp3", chunk_size: int = 64 * 1024):
        """
        Generator that yields audio file chunks. Works with GridFS when enabled
        and falls back to local cache file.

        Yields:
            bytes
        """
        if self.use_gridfs:
            self._init_db()
            try:
                grid_file = self._db.song_files.files.find_one({"song_id": song_id, "filename": filename})
                if grid_file:
                    file_id = grid_file["_id"]
                    gf = self._fs.get(file_id)  # type: ignore
                    while True:
                        chunk = gf.read(chunk_size)
                        if not chunk:
                            break
                        yield chunk
                    return
            except Exception:
                pass

        # Fallback to local file streaming
        file_path = self.get_song_directory(song_id) / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        with open(file_path, "rb") as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk

    def delete_song(self, song_id: str) -> None:
        """
        Delete entire song directory and all contents.

        Args:
            song_id: Song identifier

        Raises:
            FileNotFoundError: If song directory doesn't exist
        """
        # Delete GridFS records + DB docs when using GridFS
        if self.use_gridfs:
            self._init_db()
            try:
                # delete all files in GridFS for this song
                for f in list(self._db.song_files.files.find({"song_id": song_id})):
                    try:
                        self._fs.delete(f["_id"])  # type: ignore
                    except Exception:
                        pass
                # delete supporting collections
                try:
                    self._db.song_lyrics.delete_one({"_id": song_id})
                    self._db.song_references.delete_one({"_id": song_id})
                    self._db.songs.delete_one({"_id": song_id})
                except Exception:
                    pass
            except Exception as e:
                logger.debug("GridFS deletion issue: %s", e)

        # Remove local cache directory if present
        song_dir = self.get_song_directory(song_id)
        if song_dir.exists():
            shutil.rmtree(song_dir)
            logger.info(f"Deleted song directory: {song_dir}")

    def list_songs(self) -> list[str]:
        """
        List all song IDs in storage.

        Returns:
            List of song IDs (directory names)
        """
        if not self.base_path.exists():
            return []

        song_ids = [d.name for d in self.base_path.iterdir() if d.is_dir()]
        return sorted(song_ids)

    def get_song_size(self, song_id: str) -> int:
        """
        Get total size of song directory in bytes.

        Args:
            song_id: Song identifier

        Returns:
            Total size in bytes

        Raises:
            FileNotFoundError: If song directory doesn't exist
        """
        song_dir = self.get_song_directory(song_id)
        if not song_dir.exists():
            raise FileNotFoundError(f"Song directory not found: {song_dir}")

        total_size = sum(
            f.stat().st_size for f in song_dir.rglob("*") if f.is_file()
        )
        return total_size

    def get_file_path(self, song_id: str, filename: str) -> Path:
        """
        Get full path to a file in song directory.

        Args:
            song_id: Song identifier
            filename: File name

        Returns:
            Full path to file
        """
        return self.get_song_directory(song_id) / filename
