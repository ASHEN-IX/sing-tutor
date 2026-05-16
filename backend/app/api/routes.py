from fastapi import APIRouter, HTTPException
from app.schemas.pitch import ReferenceData, SongMetadata, AnalysisResult
from app.services.mock_data import MockAudioService, MockSongService

router = APIRouter(prefix="/api", tags=["songs"])


@router.get("/songs", response_model=list[SongMetadata])
async def list_songs():
    """Get all available songs"""
    return MockSongService.get_all_songs()


@router.get("/songs/{song_id}", response_model=SongMetadata)
async def get_song(song_id: str):
    """Get a specific song by ID"""
    song = MockSongService.get_song(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return song


@router.get("/songs/{song_id}/reference", response_model=ReferenceData)
async def get_reference_data(song_id: str):
    """Get reference pitch data for a song"""
    return MockAudioService.get_reference_data(song_id)


@router.post("/recordings/{song_id}/analyze", response_model=AnalysisResult)
async def analyze_recording(song_id: str, recording_id: str):
    """Analyze a user's recording"""
    return MockAudioService.analyze_recording(song_id, recording_id)


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-singing-tutor-backend"}
