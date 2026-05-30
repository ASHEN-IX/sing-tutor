"""
WhisperX aligner wrapper.

Provides a small, robust interface to run WhisperX transcription + forced
alignment and return word-level timing information suitable for the
ReferenceBuilder pipeline.
"""
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)


class WhisperXAligner:
    """Wrapper around whisperx to produce word-level timestamps.

    Methods are defensive: if whisperx is not available or fails, the
    caller should handle exceptions and decide on a fallback.
    """

    def __init__(self, model_name: str = "small", device: str = "cuda"):
        self.model_name = model_name
        self.device = device
        self.model = None

        try:
            import whisperx
            self.whisperx = whisperx
            logger.info("whisperx available")
        except Exception as e:
            self.whisperx = None
            logger.warning("whisperx is not available: %s", e)

    def _load_model(self):
        if self.model is None:
            if not self.whisperx:
                raise RuntimeError("whisperx is not installed")
            # load ASR model (keeps it in memory for repeated calls)
            self.model = self.whisperx.load_model(self.model_name, device=self.device)

    def align(
        self,
        audio_path: str,
        words: List[dict],
        language: str = "en",
    ) -> Tuple[List[dict], float]:
        """
        Align provided words to the audio using WhisperX.

        Args:
            audio_path: Path to audio file that whisperx can read
            words: List of word dicts (expected keys: 'index','word')
            language: Language code for transcription/align

        Returns:
            (aligned_words, match_ratio)

        Raises:
            RuntimeError if whisperx is unavailable or alignment fails
        """
        self._load_model()

        try:
            # Transcribe with whisperx ASR model
            asr_result = self.model.transcribe(audio_path, language=language)

            # Load alignment model and perform alignment
            align_model, metadata = self.whisperx.load_align_model(language_code=language, device=self.device)
            aligned = self.whisperx.align(asr_result["segments"], align_model, metadata, audio_path, device=self.device)

            # Consolidate word-level timings
            aligned_words = []
            idx = 0
            for seg in aligned.get("segments", []):
                for w in seg.get("words", []):
                    # Each word dict from whisperx contains 'word','start','end'
                    aligned_words.append({
                        "index": idx,
                        "word": w.get("word", "").strip(),
                        "start": float(w.get("start", 0.0) or 0.0),
                        "end": float(w.get("end", 0.0) or 0.0),
                    })
                    idx += 1

            # Compute a simple match ratio: how many words matched vs expected
            expected = len(words)
            matched = len(aligned_words)
            match_ratio = matched / expected if expected > 0 else 0.0

            return aligned_words, match_ratio

        except Exception as e:
            logger.exception("WhisperX alignment failed: %s", e)
            raise RuntimeError(f"WhisperX alignment failed: {e}")
