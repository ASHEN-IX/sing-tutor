"""
Lyrics parsing service - parses lyrics from various formats.

Supports: plain text, .txt files, .lrc format (optional timestamps)
"""

import re
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)


class LyricsParser:
    """Parses lyrics in various formats."""

    def parse_plain_text(self, text: str) -> List[str]:
        """
        Parse plain text lyrics.

        Args:
            text: Raw lyrics text (may contain newlines)

        Returns:
            List of words/syllables

        Note:
            - Splits on whitespace and punctuation boundaries
            - Normalizes whitespace
            - Removes empty strings
        """
        # Normalize whitespace
        text = " ".join(text.split())

        # Split on whitespace
        words = text.split()

        # Clean up punctuation that might be attached to words
        # But keep apostrophes (contractions like "don't")
        cleaned = []
        for word in words:
            # Remove leading/trailing punctuation (except apostrophes)
            word = re.sub(r'^[^\w\']+', '', word)  # Remove leading non-word chars (but keep ')
            word = re.sub(r'[^\w\']+$', '', word)  # Remove trailing non-word chars (but keep ')

            # Skip empty strings
            if word:
                cleaned.append(word)

        logger.debug(f"Parsed {len(cleaned)} words from plain text")
        return cleaned

    def parse_lrc_format(self, text: str) -> Tuple[List[str], dict]:
        """
        Parse LRC format lyrics (may include timestamps).

        Args:
            text: LRC format text

        Returns:
            Tuple of (words, metadata)
            - words: List of words in order
            - metadata: Dict with LRC metadata if present

        Example LRC:
            [ar:Artist Name]
            [ti:Song Title]
            [00:12.00]First line of lyrics
            [00:17.20]Second line of lyrics

        Note:
            - Extracts timestamps if present (not used yet, for future enhancement)
            - Falls back to plain text if LRC format is invalid
        """
        lines = text.strip().split('\n')
        metadata = {}
        lyric_lines = []

        for line in lines:
            line = line.strip()

            # Parse metadata [key:value]
            if line.startswith('[') and ':' in line and ']' in line:
                match = re.match(r'\[([a-zA-Z]+):([^\]]+)\]', line)
                if match:
                    key, value = match.groups()
                    metadata[key] = value
                    continue

            # Parse lyric lines with timestamps.
            # Be permissive: if line starts with [timestamp] capture remainder after the closing bracket
            if line.startswith('[') and ']' in line:
                # Remove the leading bracketed timestamp or tag and keep the rest
                content = re.sub(r'^\[[^\]]+\]', '', line).strip()
                if content:
                    lyric_lines.append(content)
                continue

            # If line doesn't start with bracketed content, treat as plain lyric
            if line and not line.startswith('['):
                lyric_lines.append(line)

        # Combine all lines and parse as plain text
        combined_text = " ".join(lyric_lines)
        words = self.parse_plain_text(combined_text)

        logger.debug(f"Parsed LRC format: {len(words)} words, metadata={metadata}")
        return words, metadata

    def parse_lyrics(self, text: str, format: str = "auto") -> Tuple[List[str], dict]:
        """
        Parse lyrics in auto-detected or specified format.

        Args:
            text: Lyrics text
            format: "plain", "lrc", or "auto" (default)

        Returns:
            Tuple of (words, metadata)

        Raises:
            ValueError: If format is invalid
        """
        if format == "auto":
            # Auto-detect LRC format
            if "[" in text and ":" in text and "]" in text:
                format = "lrc"
            else:
                format = "plain"
            logger.debug(f"Auto-detected format: {format}")

        if format == "plain":
            words = self.parse_plain_text(text)
            return words, {}

        elif format == "lrc":
            return self.parse_lrc_format(text)

        else:
            raise ValueError(f"Unknown lyrics format: {format}")

    def create_lyric_objects(self, words: List[str]) -> List[dict]:
        """
        Convert word list to lyric objects with placeholder timings.

        Args:
            words: List of words

        Returns:
            List of lyric objects with index and word (timing added by aligner)

        Example:
            [
                {"index": 0, "word": "I", "start": None, "end": None},
                {"index": 1, "word": "never", "start": None, "end": None},
            ]
        """
        lyrics = []
        for i, word in enumerate(words):
            lyrics.append({
                "index": i,
                "word": word,
                "start": None,  # Will be filled by aligner
                "end": None,
            })

        logger.debug(f"Created {len(lyrics)} lyric objects")
        return lyrics

    def count_words(self, text: str) -> int:
        """
        Count number of words in lyrics text.

        Args:
            text: Lyrics text

        Returns:
            Word count
        """
        words = self.parse_plain_text(text)
        return len(words)
