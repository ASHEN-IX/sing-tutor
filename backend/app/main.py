from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import logging
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.api.analysis import router as analysis_router
from app.websocket.manager import pitch_stream_manager
from config import (
    API_TITLE,
    API_DESCRIPTION,
    API_VERSION,
    CORS_ORIGINS,
    CORS_CREDENTIALS,
    CORS_METHODS,
    CORS_HEADERS,
)

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
)

logger = logging.getLogger(__name__)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

# Include routers
app.include_router(api_router)
app.include_router(analysis_router)


@app.websocket("/ws/pitch/{recording_id}")
async def websocket_pitch_stream(websocket: WebSocket, recording_id: str):
    """WebSocket endpoint for streaming pitch data during recording"""
    await pitch_stream_manager.connect(websocket)
    try:
        # Stream pitch data for 30 seconds
        await pitch_stream_manager.stream_pitch_data(websocket, duration=30.0)
    except WebSocketDisconnect:
        pitch_stream_manager.disconnect(websocket)
    except Exception as e:
        logger.exception("WebSocket error")
        pitch_stream_manager.disconnect(websocket)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": API_TITLE,
        "docs": "/docs",
        "version": API_VERSION,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-singing-tutor-backend"}
