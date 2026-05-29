from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.pitch import ReferenceData, SongMetadata, AnalysisResult, PitchFeedback
from app.db.database import get_database
from app.api.songs import storage_service, reference_builder
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["routes"])

@router.get("/songs", response_model=List[SongMetadata])
async def list_songs():
    """Get all available songs"""
    db = await get_database()
    # Return all completed songs
    cursor = db.songs.find({"status": "completed"})
    songs = await cursor.to_list(length=100)
    
    result = []
    for s in songs:
        try:
            ref = reference_builder.load_reference(s["_id"])
            result.append(SongMetadata(
                id=s["_id"],
                title=s.get("title", ref.title),
                artist=s.get("artist", ref.artist),
                duration=ref.duration,
                bpm=int(round(ref.bpm)),
                key=ref.key,
                difficulty=s.get("difficulty", "beginner")
            ))
        except FileNotFoundError:
            continue
        except Exception as e:
            # Skip corrupted/incompatible records instead of failing the entire songs list.
            logger.warning("Skipping song %s in list_songs due to error: %s", s.get("_id"), e)
            continue
            
    return result


@router.get("/songs/{song_id}", response_model=SongMetadata)
async def get_song(song_id: str):
    """Get a specific song by ID"""
    db = await get_database()
    s = await db.songs.find_one({"_id": song_id})
    if not s or s.get("status") != "completed":
        raise HTTPException(status_code=404, detail="Song not found or not completed")
    
    try:
        ref = reference_builder.load_reference(song_id)
        return SongMetadata(
            id=song_id,
            title=s.get("title", ref.title),
            artist=s.get("artist", ref.artist),
            duration=ref.duration,
            bpm=int(round(ref.bpm)),
            key=ref.key,
            difficulty=s.get("difficulty", "beginner")
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Reference data not found")


@router.get("/songs/{song_id}/reference-pitch", response_model=ReferenceData)
async def get_reference_data(song_id: str):
    """Get reference pitch data for a song (legacy compact payload)."""
    try:
        ref = reference_builder.load_reference(song_id)
        # Convert to ReferenceData schema format
        return ReferenceData(
            song_id=song_id,
            title=ref.title,
            artist=ref.artist,
            duration=ref.duration,
            pitch_data=[{"timestamp": p.timestamp, "frequency": p.frequency, "confidence": p.confidence} for p in ref.pitch_data]
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Reference data not found")


@router.post("/recordings/{song_id}/analyze", response_model=AnalysisResult)
async def analyze_recording(song_id: str, recording_id: str):
    """Analyze a user's recording"""
    # Placeholder for Sprint 3 implementation
    return AnalysisResult(
        recording_id=recording_id,
        song_id=song_id,
        overall_accuracy=85.0,
        pitch_accuracy=82.0,
        timing_accuracy=85.0,
        feedback=[
            PitchFeedback(
                accuracy_percentage=82.0,
                deviation_cents=12.5,
                timing_offset=35.0,
            )
        ],
        recommendations=["Keep practicing your timing on the chorus."],
    )

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-singing-tutor-backend"}
