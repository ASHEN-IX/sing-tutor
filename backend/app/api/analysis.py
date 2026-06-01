from __future__ import annotations

import logging
from fastapi import APIRouter, File, UploadFile, HTTPException

from app.schemas.pitch import PitchAnalysisResponse
from app.services.audio_preprocessor import AudioPreprocessor
from app.services.pitch_detector import PitchDetector


router = APIRouter(
    prefix="/api/analysis",
    tags=["analysis"],
)

logger = logging.getLogger(__name__)


@router.post(
    "/pitch",
    response_model=PitchAnalysisResponse,
)
async def analyze_pitch(
    file: UploadFile = File(...),
):
    """
    Upload an audio file and return detected pitch data.
    """

    if (
        not file.content_type
        or not file.content_type.startswith("audio/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an audio file.",
        )

    try:
        # Read uploaded file
        audio_bytes = await file.read()

        # Preprocess
        audio, sample_rate = AudioPreprocessor.load_from_bytes(
            audio_bytes
        )

        # Duration
        duration = AudioPreprocessor.duration(
            audio,
            sample_rate,
        )

        # Pitch detection
        pitch_data = PitchDetector.detect(
            audio,
            sample_rate,
        )

        # Response
        return PitchAnalysisResponse(
            sample_rate=sample_rate,
            duration=duration,
            num_points=len(pitch_data),
            pitch_data=pitch_data,
        )

    except ValueError as exc:
        logger.info("Pitch analysis validation error: %s", exc)
        raise HTTPException(
            status_code=400,
            detail="Unable to process the uploaded audio. Ensure the file is a valid audio format.",
        )

    except Exception as exc:
        logger.exception("Unexpected error in pitch analysis")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred during pitch analysis.",
        )
