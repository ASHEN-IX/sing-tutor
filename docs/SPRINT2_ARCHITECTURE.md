# Sprint 2 Architecture — Song Reference Processing Engine

## Executive Summary

Sprint 2 implements a complete song ingestion and preprocessing pipeline that transforms raw audio files and lyrics into a structured reference map. This map becomes the canonical blueprint for comparing user performances in Sprint 3.

The pipeline is modular, production-ready, and designed for scalability. All components follow clean architecture principles with clear separation of concerns.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)                │
├─────────────────────────────────────────────────────────────────┤
│  UploadSongPage  →  SongProcessingPage  →  SongPreviewPage      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/FormData
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND API (FastAPI)                          │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/songs/upload                                         │
│  POST /api/songs/{song_id}/process                              │
│  GET  /api/songs/{song_id}/reference                            │
│  GET  /api/songs/{song_id}/preview                              │
│  DELETE /api/songs/{song_id}                                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ↓                      ↓                      ↓
┌───────────────┐   ┌──────────────────┐   ┌─────────────────┐
│ Song Storage  │   │ Processing       │   │ Database        │
│ (Filesystem)  │   │ Services         │   │ (Metadata)      │
├───────────────┤   ├──────────────────┤   ├─────────────────┤
│ songs/        │   │ • Metadata       │   │ song_metadata   │
│  {song_id}/   │   │ • Beat Detection │   │ processing_logs │
│   original.mp3│   │ • Melody Extract │   └─────────────────┘
│   lyrics.txt  │   │ • Lyrics Align   │
│   reference.  │   │ • Reference Build│
│   json        │   └──────────────────┘
└───────────────┘
```

---

## Backend Service Architecture

### Layer 1: Storage Service
**SongStorageService**
- Creates unique song directories
- Manages file I/O (audio, lyrics, reference JSON)
- Provides atomic operations for consistency
- Handles file cleanup on deletion

### Layer 2: Analysis Services
**MetadataExtractor**
- Extracts audio duration using librosa
- Estimates BPM using librosa's onset detection
- Estimates musical key using chroma features
- Returns normalized metadata

**BeatDetector**
- Detects beat positions using librosa onset detection
- Returns beat timestamps with confidence scores
- Tolerant to tempo variations

**MelodyExtractor**
- Extracts fundamental frequency (f0) using librosa.pyin
- Returns pitch contour with confidence scores
- Downsamples to manageable resolution (~10Hz)

**LyricsParser**
- Parses plain text, .txt, and .lrc formats
- Normalizes whitespace and punctuation
- Extracts individual words/syllables

**LyricsAligner**
- Generates approximate timestamps using BPM and beat positions
- Optional WhisperX-based forced alignment (future enhancement)
- Returns word-level timing metadata

### Layer 3: Orchestration Service
**ReferenceBuilder**
- Coordinates all analysis services
- Merges outputs into canonical reference JSON
- Calculates alignment quality scores
- Generates processing diagnostics

### Layer 4: API Routes
**SongsAPI**
- Upload endpoint with file validation
- Processing orchestration endpoint
- Reference retrieval endpoint
- Preview endpoint for frontend
- Deletion endpoint

---

## Data Model Architecture

### Song Reference JSON Schema

```json
{
  "song_id": "string (uuid)",
  "title": "string",
  "artist": "string",
  "language": "string (ISO 639-1)",
  "difficulty": "string (beginner|intermediate|advanced)",
  "duration": "float (seconds)",
  "bpm": "number",
  "key": "string (C Major, A Minor, etc.)",
  "beats": [
    "float (seconds)"
  ],
  "pitch_data": [
    {
      "timestamp": "float",
      "frequency": "float (Hz)",
      "confidence": "float (0-1)"
    }
  ],
  "lyrics": [
    {
      "index": "integer",
      "word": "string",
      "start": "float",
      "end": "float"
    }
  ],
  "sections": [
    {
      "name": "string",
      "start": "float",
      "end": "float",
      "type": "string (verse|chorus|bridge|outro|intro)"
    }
  ],
  "diagnostics": {
    "processing_time_seconds": "float",
    "alignment_quality": "float (0-1)",
    "pitch_coverage": "float (0-1)",
    "processed_at": "string (ISO8601)",
    "processing_version": "string"
  }
}
```

### Database Schema (PostgreSQL)

```sql
CREATE TABLE songs (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  language VARCHAR(5),
  difficulty VARCHAR(50),
  duration FLOAT,
  bpm FLOAT,
  musical_key VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  storage_path VARCHAR(512)
);

CREATE TABLE processing_logs (
  id SERIAL PRIMARY KEY,
  song_id VARCHAR(36),
  status VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (song_id) REFERENCES songs(id)
);
```

---

## Processing Pipeline Flowchart

```
START
  │
  ├─> Validate Input Files
  │    ├─ Audio format check (.mp3, .wav, .m4a, .ogg)
  │    ├─ File size check (max 100MB)
  │    └─ Lyrics format validation
  │
  ├─> Generate Song ID (UUID)
  │
  ├─> Create Storage Directory
  │
  ├─> Save Audio & Lyrics
  │
  ├─> Extract Metadata
  │    ├─ Duration
  │    ├─ BPM
  │    └─ Musical Key
  │
  ├─> Detect Beats
  │    └─ Array of timestamps
  │
  ├─> Extract Melody (Pitch Contour)
  │    ├─ Sample rate 22050 Hz
  │    └─ Downsampled to ~10Hz resolution
  │
  ├─> Parse Lyrics
  │    ├─ Normalize whitespace
  │    └─ Extract word boundaries
  │
  ├─> Align Lyrics to Time
  │    ├─ Use beat positions
  │    └─ Linear interpolation
  │
  ├─> Build Reference JSON
  │    ├─ Merge all outputs
  │    └─ Calculate diagnostics
  │
  ├─> Save reference.json
  │
  ├─> Update Database
  │
  └─> Return Status & Summary
        ├─ Processing time
        └─ Alignment quality score
```

---

## Key Technical Decisions

### 1. Audio Processing Library: librosa
**Why librosa:**
- Well-established for music information retrieval (MIR)
- Excellent documentation and community support
- Pure Python (no additional dependencies like FFmpeg)
- Accurate for educational music analysis
- Sufficient for MVP (WhisperX can be added later for better alignment)

**Limitations:**
- BPM detection is approximate (±5-10 bpm typical)
- Key detection is not always accurate for complex harmonies
- Pitch detection has known challenges with vibrato and polyphony

### 2. Pitch Detection: librosa.pyin
**Why pyin (Probabilistic YIN):**
- More robust than YIN to subharmonics and octave errors
- Handles vibrato well
- Provides confidence scores for each f0 estimate
- Fast (~2-3x real-time on CPU)

**Resolution:**
- Framerate ~100 Hz (typical librosa default)
- Downsampled to ~10 Hz for storage (~263 samples/min)
- Reduces storage and improves alignment reliability

### 3. Lyrics Alignment: Approximate Timeline
**Why approximate first:**
- Forced alignment (WhisperX) requires trained models and is slower
- Approximate alignment using beat positions is good enough for MVP
- Can be enhanced later without changing core architecture
- Linear interpolation between beats provides reasonable word timings

**Limitations:**
- ±50-200ms typical error on word boundaries
- Does not account for rubato or tempo variation
- Requires accurate beat detection (addresses in future sprints)

### 4. Storage: Filesystem-Based
**Why local filesystem:**
- Simple, no database dependency for media files
- Easy to backup and migrate
- Suitable for MVP scale (< 1000 songs)
- Can migrate to object storage (S3) later

**Structure:**
```
songs/
├── {song_id}/
│   ├── original.mp3
│   ├── lyrics.txt
│   └── reference.json
```

---

## Error Handling Strategy

### Input Validation
- File type checking (magic bytes, not just extension)
- File size limits (100 MB max)
- Audio validity (playable, not corrupted)
- Lyrics parsing robustness

### Processing Errors
- Graceful degradation if BPM detection fails (use default)
- Continue even if key detection is uncertain (mark confidence)
- Skip section detection if metadata is insufficient
- Log all errors to database for debugging

### Recovery
- All processing is idempotent (can re-run without side effects)
- Failed uploads are cleaned up automatically
- Database state is atomic

---

## Scalability Considerations

### Current MVP (< 10,000 songs)
- Local filesystem storage
- Single worker process
- In-memory processing

### Future Scaling (> 100,000 songs)
- Object storage (AWS S3, Azure Blob)
- Async task queue (Celery + Redis)
- Distributed beat/pitch detection
- Caching layer for frequent queries

### Performance Targets
- 10-minute song processing time: ~30-45 seconds
- API response time: < 200ms
- Upload file transfer: depends on network

---

## Security & Validation

### Input Validation
1. MIME type verification (audio files)
2. File size limits
3. Malicious filename sanitization
4. Audio codec whitelisting

### Rate Limiting
- 10 uploads per IP per day (configurable)
- Processing queue throttling

### File Safety
- Uploaded files scanned for malware (future enhancement)
- Isolated processing environment

---

## Testing Strategy

### Unit Tests
- Service-level: mock audio/lyrics inputs, verify outputs
- Utility functions: edge cases, error handling
- Target: 80%+ code coverage

### Integration Tests
- Full pipeline: upload → process → retrieve
- End-to-end: API endpoints
- File I/O verification

### Test Data
- Sample songs included in repo (3-5 diverse genres)
- Synthetic test signals (known frequencies, tempos)

---

## Deployment Checklist

- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Create songs directory: `mkdir -p backend/songs`
- [ ] Run migrations (if needed)
- [ ] Start backend: `python run.py`
- [ ] Verify API endpoints: `curl http://localhost:8000/health`
- [ ] Start frontend: `npm run dev`

---

## Future Enhancements (Post-MVP)

1. **Improved Alignment:**
   - Integrate WhisperX for phoneme-level alignment
   - Support multilingual lyrics

2. **Advanced Metadata:**
   - Genre classification (zero-shot)
   - Artist embeddings for similarity search
   - Cover detection

3. **Performance:**
   - Async processing with Celery
   - Caching layer (Redis)
   - Batch processing API

4. **User Experience:**
   - Processing history dashboard
   - Batch upload support
   - Real-time progress WebSocket
   - Audio preview in UI

5. **Analysis:**
   - Harmonic analysis (chord detection)
   - Vocal range estimation
   - Melody complexity scoring

---

## Summary

Sprint 2 provides a **robust, modular, and scalable** foundation for processing reference songs. The architecture balances complexity with maintainability, uses well-established libraries, and is honest about limitations. All code is fully typed, tested, and documented for production use.
