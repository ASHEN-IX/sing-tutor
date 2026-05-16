# AI Singing Tutor - Architecture

**Version:** 0.1.0  
**Sprint:** 0

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│  (Port 3000, TypeScript + Vite + Tailwind + Framer Motion)      │
└──────────────┬──────────────────────────────────────────────────┘
               │
          (HTTP + WS)
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                      FastAPI Backend                            │
│      (Port 8000, Python 3.10+, async/await)                    │
│                                                                 │
│  ├── REST API (/api/songs, /api/recordings/analyze)           │
│  └── WebSocket (/ws/pitch/{recording_id})                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### 1. Frontend Architecture

```
frontend/
├── src/
│   ├── components/       # Reusable React components
│   │   ├── Navbar.tsx
│   │   ├── PitchVisualizer.tsx
│   │   └── SongCard.tsx
│   │
│   ├── pages/            # Page-level components
│   │   ├── HomePage.tsx
│   │   ├── SongSelectionPage.tsx
│   │   ├── RecordingPage.tsx
│   │   └── ResultsPage.tsx
│   │
│   ├── services/         # API communication layer
│   │   ├── api.ts        # REST API client
│   │   └── websocket.ts  # WebSocket manager
│   │
│   ├── types/            # TypeScript interfaces
│   │   └── api.ts        # API data models
│   │
│   ├── hooks/            # Custom React hooks (future)
│   │
│   ├── App.tsx           # Main app component with routing
│   └── main.tsx          # Entry point
```

**Key Technologies:**
- **Framework:** React 18.2
- **Language:** TypeScript 5.2
- **Build Tool:** Vite 5.0
- **Styling:** Tailwind CSS 3.3
- **Animations:** Framer Motion 10.16
- **HTTP Client:** Axios 1.6
- **Routing:** React Router 6.20

---

### 2. Backend Architecture

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   │
│   ├── api/
│   │   └── routes.py        # REST endpoint definitions
│   │
│   ├── services/
│   │   └── mock_data.py     # Mock data generators
│   │
│   ├── schemas/
│   │   └── pitch.py         # Pydantic data models
│   │
│   ├── models/              # Database models (future)
│   │
│   └── websocket/
│       └── manager.py       # WebSocket connection manager
│
├── songs/                   # Song data directory (future)
│   └── {song_id}/
│       └── reference.json
│
├── requirements.txt         # Python dependencies
└── run.py                   # Entry point
```

**Key Technologies:**
- **Framework:** FastAPI 0.104
- **Server:** Uvicorn 0.24
- **Language:** Python 3.10+
- **Validation:** Pydantic 2.5
- **WebSocket:** websockets 12.0
- **Audio Libraries (installed, not yet used):**
  - Librosa 0.10 (audio analysis)
  - NumPy 1.24 (numerical computing)
  - SciPy 1.11 (scientific computing)
  - CREPE (pitch detection - via transformers)
  - WhisperX (speech recognition)

---

## Data Flow

### Song Selection Flow

```
1. User lands on /songs
   ↓
2. Frontend calls GET /api/songs
   ↓
3. Backend returns list of SongMetadata
   ↓
4. Frontend displays SongCard components
   ↓
5. User clicks "Start Recording"
   ↓
6. Navigate to /recording/{song_id}
```

### Recording Flow

```
1. User on /recording/{song_id}
   ↓
2. Frontend fetches song details via GET /api/songs/{song_id}
   ↓
3. User clicks "Start Recording"
   ↓
4. Frontend initiates WebSocket: WS /ws/pitch/{recording_id}
   ↓
5. Backend streams fake pitch data (100ms intervals)
   ↓
6. Frontend updates PitchVisualizer in real-time
   ↓
7. User clicks "Stop Recording"
   ↓
8. Frontend disconnects WebSocket
   ↓
9. Navigate to /results/{recording_id}
```

### Analysis Flow

```
1. User lands on /results/{recording_id}
   ↓
2. Frontend calls POST /api/recordings/{song_id}/analyze
   ↓
3. Backend returns AnalysisResult with metrics & recommendations
   ↓
4. Frontend displays results with visualizations
   ↓
5. User can try another song or go back home
```

---

## Component Responsibilities

### Frontend Components

**Navbar**
- Navigation links
- Branding
- Sticky top navigation

**PitchVisualizer**
- Real-time frequency bars
- Accuracy meter
- Confidence indicator

**SongCard**
- Song metadata display
- Difficulty indicator
- Launch recording button

**Pages**
- HomePage: Landing page with features
- SongSelectionPage: Browse available songs
- RecordingPage: Record and stream visualization
- ResultsPage: Performance analysis

### Backend Services

**MockAudioService**
- `get_reference_data(song_id)`: Generate reference pitch data
- `analyze_recording(song_id, recording_id)`: Generate analysis results

**MockSongService**
- `get_all_songs()`: List available songs
- `get_song(song_id)`: Get specific song

**PitchStreamManager**
- `connect(websocket)`: Accept WebSocket connection
- `disconnect(websocket)`: Close connection
- `stream_pitch_data(websocket, duration)`: Stream fake pitch data

---

## API Contract Enforcement

All API responses follow Pydantic schemas defined in `backend/app/schemas/pitch.py`. Frontend expects:

1. **Response Format:** JSON with UTF-8 encoding
2. **Status Codes:** Proper HTTP semantics
3. **Error Handling:** Consistent error response format
4. **CORS:** All-origins policy for development

See [API Contract](./api-contract.md) for complete specifications.

---

## Environment Configuration

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

### Backend (.env)
```
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=info
```

---

## Future Architecture Improvements (Sprint 1+)

1. **Authentication:**
   - JWT-based auth
   - User session management

2. **Database:**
   - PostgreSQL for persistence
   - SQLAlchemy ORM
   - Alembic migrations

3. **Audio Processing:**
   - Real CREPE pitch detection
   - Audio file uploads
   - Reference audio preprocessing

4. **Performance:**
   - Caching layer (Redis)
   - Database indexing
   - CDN for audio files

5. **Monitoring:**
   - Error tracking (Sentry)
   - Performance monitoring
   - Structured logging

6. **Deployment:**
   - Docker containerization
   - Kubernetes orchestration
   - CI/CD pipelines

---

**Last Updated:** Sprint 0  
**Maintainers:** AI Team + Development Team
