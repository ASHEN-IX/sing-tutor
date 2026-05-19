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
    """Manages filesystem storage for songs."""

    def __init__(self, base_path: str = "backend/songs"):
        """
        Initialize storage service.

        Args:
            base_path: Root directory for song storage
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"SongStorageService initialized at {self.base_path}")

    def get_song_directory(self, song_id: str) -> Path:
        """Get the directory path for a song."""
        song_dir = self.base_path / song_id
        return song_dir

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
        file_path = self.get_song_directory(song_id) / "reference.json"
        if not file_path.exists():
            raise FileNotFoundError(f"Reference JSON not found: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        logger.info(f"Loaded reference JSON: {file_path}")
        return data

    def song_exists(self, song_id: str) -> bool:
        """Check if song directory exists."""
        return self.get_song_directory(song_id).exists()

    def file_exists(self, song_id: str, filename: str) -> bool:
        """Check if a specific file exists in song directory."""
        file_path = self.get_song_directory(song_id) / filename
        return file_path.exists()

    def delete_song(self, song_id: str) -> None:
        """
        Delete entire song directory and all contents.

        Args:
            song_id: Song identifier

        Raises:
            FileNotFoundError: If song directory doesn't exist
        """
        song_dir = self.get_song_directory(song_id)
        if not song_dir.exists():
            raise FileNotFoundError(f"Song directory not found: {song_dir}")

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
