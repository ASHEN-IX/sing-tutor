# Sprint 2 Quick Reference

## Quick Start (2 minutes)

```bash
# Terminal 1: Backend
cd backend
python run.py
# Runs on http://localhost:8000

# Terminal 2: Frontend  
cd frontend
npm run dev
# Runs on http://localhost:5173

# Open browser to http://localhost:5173
```

## API Endpoints Quick Reference

### Upload Song
```bash
curl -X POST http://localhost:8000/api/songs/upload \
  -F "audio=@song.mp3" \
  -F "lyrics=@lyrics.txt" \
  -F "title=My Song" \
  -F "artist=My Artist"
# Returns: {song_id, title, artist, status}
```

### Start Processing
```bash
curl -X POST http://localhost:8000/api/songs/{SONG_ID}/process
# Returns: {status: "processing", progress: 0.0}
```

### Check Status
```bash
curl http://localhost:8000/api/songs/{SONG_ID}/status
# Returns: {status, progress, message}
```

### Get Reference
```bash
curl http://localhost:8000/api/songs/{SONG_ID}/reference | jq
# Returns: Complete SongReference JSON
```

### Get Preview (Lightweight)
```bash
curl http://localhost:8000/api/songs/{SONG_ID}/preview
# Returns: Summary with counts, quality score
```

### Delete Song
```bash
curl -X DELETE http://localhost:8000/api/songs/{SONG_ID}
```

## Directory Structure

```
backend/app/
├── api/songs.py ..................... API routes
├── services/
│   ├── song_storage.py .............. File I/O
│   ├── metadata_extractor.py ........ Duration/BPM/Key
│   ├── beat_detector.py ............. Beat positions
│   ├── melody_extractor.py .......... Pitch contour
│   ├── lyrics_parser.py ............. Parse lyrics
│   ├── lyrics_aligner.py ............ Align to beats
│   └── reference_builder.py ......... Orchestrate
├── schemas/song_reference.py ........ Pydantic models
└── tests/test_sprint2_services.py .. Unit tests

frontend/src/
├── components/
│   ├── SongUploadForm.tsx
│   ├── ProcessingProgress.tsx
│   └── ReferencePreview.tsx
├── services/songService.ts
├── pages/
│   ├── UploadSongPage.tsx
│   ├── SongProcessingPage.tsx
│   └── SongPreviewPage.tsx
└── types/songReference.ts
```

## Service Layer Overview

| Service | Responsibility | Input | Output |
|---------|---|---|---|
| SongStorage | File I/O, directory mgmt | file paths | binary data |
| MetadataExtractor | Duration, BPM, key | audio signal | {duration, bpm, key} |
| BeatDetector | Detect beat positions | audio signal | [timestamps] |
| MelodyExtractor | Extract pitch contour | audio signal | [{time, freq, conf}] |
| LyricsParser | Parse lyrics text | text | [words] |
| LyricsAligner | Align words to beats | words, beats, duration | [{word, start, end}] |
| ReferenceBuilder | Orchestrate all | paths, metadata | SongReference JSON |

## Data Model at a Glance

```typescript
interface SongReference {
  song_id: string
  title: string
  artist: string
  language: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: number
  bpm: number
  key: string
  beats: number[]                    // Beat timestamps
  pitch_data: [{                     // Pitch contour
    timestamp: number
    frequency: number
    confidence: number
  }]
  lyrics: [{                         // Aligned lyrics
    index: number
    word: string
    start: number
    end: number
  }]
  sections: [{                       // Song structure
    name: string
    start: number
    end: number
    section_type: string
  }]
  diagnostics: {
    processing_time_seconds: number
    alignment_quality: number        // 0-1 score
    pitch_coverage: number           // 0-1 score
    processed_at: string             // ISO8601
    processing_version: string
  }
}
```

## Testing Quick Commands

```bash
# Run all backend tests
cd backend
pytest app/tests/test_sprint2_services.py -v

# Run specific test class
pytest app/tests/test_sprint2_services.py::TestBeatDetector -v

# Run with coverage
pytest app/tests/test_sprint2_services.py --cov=app/services

# Frontend tests
cd frontend
npm test

# Test workflow (see SPRINT2_TESTING.md for full details)
bash test_workflow.sh
```

## Common Issues

### Port Already in Use
```bash
# Backend on different port (edit run.py or use env var)
# Frontend (Vite auto-finds available port)
```

### librosa Import Fails
```bash
pip install librosa --force-reinstall
```

### Audio File Won't Load
```bash
# Verify with ffprobe
ffprobe audio.mp3

# Try converting
ffmpeg -i input.mp3 -q:a 9 -n output.mp3
```

### CORS Errors
Check backend is running and CORS_ORIGINS includes frontend URL

## Performance Targets

- Upload endpoint: < 1s
- Process endpoint: Start immediately (background task)
- Status polling: < 100ms response
- Reference retrieval: < 200ms
- Full processing: 30-60s for typical song
- Alignment quality: typically 0.85-0.95

## Key Dependencies

Backend:
- fastapi ..................... Web framework
- librosa ..................... Audio analysis
- pydantic .................... Data validation
- python-multipart ............ File uploads

Frontend:
- react 18 .................... UI library
- typescript 5 ................ Type safety
- axios ....................... HTTP client
- tailwind .................... Styling

## Config File Locations

- Backend: `backend/config.py`
- Frontend env: `frontend/.env.local`
- Docker: `docker-compose.yml`

## Key Files to Review

1. **Architecture Overview**: `docs/SPRINT2_ARCHITECTURE.md`
2. **Setup Instructions**: `docs/SPRINT2_IMPLEMENTATION.md`
3. **Testing Guide**: `docs/SPRINT2_TESTING.md`
4. **This Reference**: `docs/SPRINT2_QUICK_REFERENCE.md` (you are here)

## Environment Variables (Optional)

```bash
# Backend
export API_TITLE="AI Singing Tutor"
export API_VERSION="2.0"
export HOST="0.0.0.0"
export PORT="8000"
export SONGS_DIR="backend/songs"
export LIBROSA_SR="22050"
```

## Debugging Tips

**Backend Debug Logging:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug("Debug message")
```

**Frontend Debug:**
```typescript
console.log("Debug:", variable);
console.error("Error:", error);
```

**Check Running Services:**
```bash
# Backend health check
curl http://localhost:8000/health

# Frontend (if running)
curl http://localhost:5173
```

## Next Steps

1. **Run the app**: Start backend + frontend
2. **Test upload**: Upload test audio file
3. **Monitor progress**: Check status endpoint
4. **View results**: Get reference JSON
5. **Explore code**: Review service implementations
6. **Run tests**: Execute test suite
7. **Read docs**: Review architecture and implementation guides

## Contact & Support

- Architecture Questions: See SPRINT2_ARCHITECTURE.md
- Setup Issues: See SPRINT2_IMPLEMENTATION.md
- Testing Help: See SPRINT2_TESTING.md
- Code Questions: Review inline comments in services

---

**Ready? Start with**: `cd backend && python run.py`
