"""
Song management API endpoints - handles upload, processing, retrieval, and deletion.

Provides REST endpoints for the song reference processing pipeline.
"""

import logging
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.services.song_storage import SongStorageService
from app.services.reference_builder import ReferenceBuilder
from app.schemas.song_reference import (
    SongReference,
    SongUploadResponse,
    SongMetadataInput,
    ProcessingStatus,
    SongPreviewResponse,
    ErrorResponse,
)
from app.db.database import get_database

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/songs", tags=["songs"])

# Initialize services (in production, use dependency injection)
# Use MongoDB GridFS for storage per project decision
storage_service = SongStorageService(base_path="backend/songs", use_gridfs=True)
reference_builder = ReferenceBuilder(storage_service=storage_service)


@router.post(
    "/upload",
    response_model=SongUploadResponse,
    status_code=201,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        413: {"model": ErrorResponse, "description": "File too large"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    }
)
async def upload_song(
    audio: UploadFile = File(...),
    lyrics: UploadFile = File(...),
    title: str = Form(...),
    artist: str = Form(...),
    language: str = Form(default="en"),
    difficulty: str = Form(default="beginner"),
) -> SongUploadResponse:
    """
    Upload song audio and lyrics for processing.

    Accepts multipart form with:
    - audio: Audio file (.mp3, .wav, .m4a, .ogg)
    - lyrics: Lyrics file (.txt, .lrc) or plain text
    - title: Song title
    - artist: Artist name
        await db.songs.update_one({
            "_id": song_id,
        }, {
            "$set": {
                "status": "uploaded",
                "title": title,
                "artist": artist,
                "language": language,
                "difficulty": difficulty,
            }
        }, upsert=True)
    - difficulty: beginner|intermediate|advanced (optional)
        logger.info(f"Upload successful for {song_id}: {title} - {artist}")
    Returns:
    - song_id: Newly created song ID
    - status: "uploaded" (processing not started yet)
    - message: Status message

    Example:
        curl -X POST http://localhost:8000/api/songs/upload \\
          -F "audio=@song.mp3" \\
          -F "lyrics=@lyrics.txt" \\
          -F "title=Perfect" \\
          -F "artist=Ed Sheeran" \\
          -F "language=en" \\
          -F "difficulty=beginner"
    """
    try:
        # Validate inputs
        if not title or not artist:
            raise HTTPException(status_code=400, detail="Title and artist are required")

        if difficulty not in ["beginner", "intermediate", "advanced"]:
            raise HTTPException(status_code=400, detail="Invalid difficulty level")

        # Check file sizes
        MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
        audio_content = await audio.read()
        if len(audio_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Audio file too large (max 100MB)")

        lyrics_content = await lyrics.read()
        if len(lyrics_content) > 1 * 1024 * 1024:  # 1 MB for lyrics
            raise HTTPException(status_code=413, detail="Lyrics file too large (max 1MB)")

        # Generate song ID
        song_id = str(uuid.uuid4())
        logger.info(f"Received upload for new song: {song_id}")

        # Create storage directory
        storage_service.create_song_directory(song_id)

        # Save audio file
        storage_service.save_audio_file(song_id, audio_content, filename="original.mp3")

        # Save lyrics file
        lyrics_text = lyrics_content.decode("utf-8")
        storage_service.save_lyrics_file(song_id, lyrics_text, filename="lyrics.txt")

        # Store metadata for processing
        db = await get_database()
        await db.songs.update_one(
            {"_id": song_id},
            {
                "$set": {
                    "status": "uploaded",
                    "title": title,
                    "artist": artist,
                    "language": language,
                    "difficulty": difficulty,
                }
            },
            upsert=True,
        )

        logger.info(f"Upload successful for {song_id}: {title} - {artist}")

        return SongUploadResponse(
            song_id=song_id,
            title=title,
            artist=artist,
            status="uploaded",
            message="Files uploaded successfully. Ready for processing.",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="We could not upload this song. Please try again.")


@router.post(
    "/{song_id}/process",
    response_model=ProcessingStatus,
    status_code=200,
    responses={
        404: {"model": ErrorResponse, "description": "Song not found"},
        500: {"model": ErrorResponse, "description": "Processing failed"},
    }
)
async def process_song(
    song_id: str,
    background_tasks: BackgroundTasks
) -> ProcessingStatus:
    """
    Start processing of uploaded song.

    Triggers the full preprocessing pipeline:
    1. Extract metadata (duration, BPM, key)
    2. Detect beats
    3. Extract melody/pitch contour
    4. Parse and align lyrics
    5. Generate reference JSON

    Processing runs asynchronously; poll status endpoint for updates.

    Args:
        song_id: Song identifier from upload

    Returns:
        Current processing status

    Example:
        curl -X POST http://localhost:8000/api/songs/550e8400-e29b-41d4-a716-446655440000/process
    """
    try:
        db = await get_database()
        song_doc = await db.songs.find_one({"_id": song_id})

        # Check if song exists
        if not song_doc:
            raise HTTPException(status_code=404, detail=f"Song not found: {song_id}")

        if not storage_service.song_exists(song_id):
            raise HTTPException(status_code=404, detail=f"Song not found: {song_id}")

        # Update status
        await db.songs.update_one(
            {"_id": song_id},
            {"$set": {"status": "processing", "progress": 0.0}}
        )

        logger.info(f"Starting processing for {song_id}")

        # Schedule background processing
        background_tasks.add_task(
            _process_song_background,
            song_id
        )

        return ProcessingStatus(
            song_id=song_id,
            status="processing",
            progress=0.0,
            message="Processing started..."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Processing failed for {song_id}: {e}")
        db = await get_database()
        await db.songs.update_one(
            {"_id": song_id},
            {"$set": {"status": "failed", "error": str(e)}}
        )
        raise HTTPException(status_code=500, detail="We could not start processing this song. Please try again.")


async def _process_song_background(song_id: str) -> None:
    """
    Background task for song processing.

    Runs full preprocessing pipeline and saves reference JSON.
    """
    try:
        logger.info(f"Background processing started for {song_id}")
        
        db = await get_database()
        song_info = await db.songs.find_one({"_id": song_id}) or {}
        audio_path = str(storage_service.get_file_path(song_id, "original.mp3"))
        lyrics_text = storage_service.load_lyrics_file(song_id, "lyrics.txt")

        import asyncio
        
        # Build reference
        reference = await asyncio.to_thread(
            reference_builder.build_reference,
            song_id=song_id,
            title=song_info.get("title", "Unknown"),
            artist=song_info.get("artist", "Unknown"),
            language=song_info.get("language", "en"),
            difficulty=song_info.get("difficulty", "beginner"),
            audio_path=audio_path,
            lyrics_text=lyrics_text,
        )

        # Save reference
        await asyncio.to_thread(reference_builder.save_reference, reference)

        # Update status
        await db.songs.update_one(
            {"_id": song_id},
            {"$set": {"status": "completed", "progress": 1.0}}
        )

        logger.info(f"Background processing completed for {song_id}")

    except Exception as e:
        logger.error(f"Background processing failed for {song_id}: {e}")
        db = await get_database()
        await db.songs.update_one(
            {"_id": song_id},
            {"$set": {"status": "failed", "error": str(e)}}
        )


@router.get(
    "/{song_id}/status",
    response_model=ProcessingStatus,
    responses={404: {"model": ErrorResponse}}
)
async def get_processing_status(song_id: str) -> ProcessingStatus:
    """
    Get current processing status for a song.

    Args:
        song_id: Song identifier

    Returns:
        Current processing status with progress

    Example:
        curl http://localhost:8000/api/songs/550e8400-e29b-41d4-a716-446655440000/status
    """
    try:
        status_info = None
        db_lookup_failed = False

        try:
            db = await get_database()
            status_info = await db.songs.find_one({"_id": song_id})
        except Exception as db_error:
            db_lookup_failed = True
            logger.warning("Status DB lookup failed for %s: %s", song_id, db_error)

        if not status_info:
            # Try to check if completed reference exists
            if storage_service.file_exists(song_id, "reference.json"):
                return ProcessingStatus(
                    song_id=song_id,
                    status="completed",
                    progress=1.0,
                    message="Processing completed"
                )

            if storage_service.song_exists(song_id):
                return ProcessingStatus(
                    song_id=song_id,
                    status="processing" if db_lookup_failed else "unknown",
                    progress=0.5 if db_lookup_failed else 0.0,
                    message="Processing status unavailable; using filesystem fallback"
                )

            raise HTTPException(status_code=404, detail=f"Song not found: {song_id}")

        return ProcessingStatus(
            song_id=song_id,
            status=status_info.get("status", "unknown"),
            progress=status_info.get("progress", 0.0),
            message=status_info.get("message", ""),
            error=status_info.get("error")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail="We could not check this song right now. Please try again.")


@router.get(
    "/{song_id}/reference",
    response_model=SongReference,
    responses={404: {"model": ErrorResponse}}
)
async def get_reference(song_id: str) -> SongReference:
    """
    Get complete reference JSON for a song.

    Only available after processing completes.

    Args:
        song_id: Song identifier

    Returns:
        Complete SongReference object

    Example:
        curl http://localhost:8000/api/songs/550e8400-e29b-41d4-a716-446655440000/reference
    """
    try:
        if not storage_service.song_exists(song_id):
            raise HTTPException(status_code=404, detail=f"Song not found: {song_id}")

        reference = reference_builder.load_reference(song_id)
        return reference

    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Reference data is not available yet.")
    except Exception as e:
        logger.error(f"Failed to get reference: {e}")
        raise HTTPException(status_code=500, detail="We could not load the song reference. Please try again.")

@router.get(
    "/{song_id}/audio",
    responses={404: {"model": ErrorResponse}}
)
async def stream_audio(song_id: str):
    """
    Stream the original audio for a song. When using GridFS this will stream
    directly from MongoDB; otherwise serves the cached local file.
    """
    try:
        if not storage_service.song_exists(song_id):
            raise HTTPException(status_code=404, detail=f"Song not found: {song_id}")

        from fastapi.responses import StreamingResponse

        generator = storage_service.stream_audio_file(song_id, filename="original.mp3")
        headers = {"Content-Disposition": f'attachment; filename="{song_id}.mp3"'}
        return StreamingResponse(generator, media_type="audio/mpeg", headers=headers)

    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Audio file is not available.")
    except Exception as e:
        logger.error("Failed to stream audio for %s: %s", song_id, e)
        raise HTTPException(status_code=500, detail="We could not stream the audio right now. Please try again.")

@router.get(
    "/{song_id}/preview",
    response_model=SongPreviewResponse,
    responses={404: {"model": ErrorResponse}}
)
async def get_preview(song_id: str) -> SongPreviewResponse:
    """
    Get preview/summary of song reference (lightweight).

    For frontend display without loading full reference.

    Args:
        song_id: Song identifier

    Returns:
        Lightweight preview data

    Example:
        curl http://localhost:8000/api/songs/550e8400-e29b-41d4-a716-446655440000/preview
    """
    try:
        if not storage_service.song_exists(song_id):
            raise HTTPException(status_code=404, detail=f"Song not found: {song_id}")

        reference = reference_builder.load_reference(song_id)

        return SongPreviewResponse(
            song_id=reference.song_id,
            title=reference.title,
            artist=reference.artist,
            duration=reference.duration,
            bpm=reference.bpm,
            key=reference.key,
            difficulty=reference.difficulty,
            beats_count=len(reference.beats),
            pitch_samples_count=len(reference.pitch_data),
            lyrics_words_count=len(reference.lyrics),
            sections_count=len(reference.sections),
            alignment_quality=reference.diagnostics.alignment_quality,
            processed_at=reference.diagnostics.processed_at,
        )

    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Reference data is not available yet.")
    except Exception as e:
        logger.error(f"Failed to get preview: {e}")
        raise HTTPException(status_code=500, detail="We could not load the song preview. Please try again.")


@router.delete(
    "/{song_id}",
    status_code=204,
    responses={404: {"model": ErrorResponse}}
)
async def delete_song(song_id: str) -> None:
    """
    Delete a song and all its associated files.

    Args:
        song_id: Song identifier

    Example:
        curl -X DELETE http://localhost:8000/api/songs/550e8400-e29b-41d4-a716-446655440000
    """
    try:
        if not storage_service.song_exists(song_id):
            raise HTTPException(status_code=404, detail=f"Song not found: {song_id}")

        storage_service.delete_song(song_id)

        # Clean up processing status
        db = await get_database()
        await db.songs.delete_one({"_id": song_id})

        logger.info(f"Deleted song: {song_id}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete song: {e}")
        raise HTTPException(status_code=500, detail="We could not delete this song. Please try again.")
