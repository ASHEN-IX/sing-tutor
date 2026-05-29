# Frontend / Backend Feature Status

## Purpose

This document consolidates all frontend features, backend capabilities, and the missing pieces that must be implemented. It serves as the master checklist for closing gaps between UI and backend, including user/account flows, database models, endpoints, and real analysis.

## Connected End To End

- Song upload: Figma upload UI calls `POST /api/songs/upload`.
- Song processing: frontend calls `POST /api/songs/{song_id}/process`, polls `GET /api/songs/{song_id}/status`, then loads `GET /api/songs/{song_id}/reference`.
- Song library: frontend calls `GET /api/songs` for completed songs.
- Learning page: frontend loads processed reference data and plays `/songs/{song_id}/original.mp3`.
- Recording pitch analysis: frontend records microphone audio and calls `POST /api/analysis/pitch`.
- Results page: frontend can display pitch-analysis output from the recording flow.

## Backend Exists But Frontend Is Only Partially Using It

- `GET /api/songs/{song_id}/preview`: service exists, but no Figma page currently displays this preview payload.
- `GET /api/songs/{song_id}/reference-pitch`: service exists for compact pitch data, but learning currently uses the full reference endpoint.
- `DELETE /api/songs/{song_id}`: service exists, but the Figma library has no delete action.
- `POST /api/recordings/{song_id}/analyze`: backend route exists, but it is a placeholder and the frontend uses raw pitch analysis instead.
- `WS /ws/pitch/{recording_id}`: backend streams generated pitch points, but the frontend recording page does not consume the WebSocket.

## Frontend Features Without Real Backend Yet

- Authentication screens: sign in, sign up, forgot password are UI-only.
- Dashboard: stats, recent songs, recommendations, progress charts are static demo data.
- Gamification/challenges: badges, quests, XP, streaks are static demo data.
- Profile: user data, favorite songs, weekly progress, logout state are local/static only.
- Song recommendations and ratings: displayed in UI but not backed by API data.
- Practice progress/completion percentage: displayed in learning/profile/dashboard, but not persisted.
- Achievements/XP earned after results: displayed in UI, but not stored in backend.
- Real score breakdown: results page derives a simple confidence score from pitch analysis; backend does not yet compare user pitch against song reference timing/melody.

## Frontend Pages and What They Need

### Auth pages

Files: `frontend/src/app/pages/AuthPages.tsx`

Missing backend pieces:

- User accounts (register, login, logout)
- Password reset flow (request + confirm)
- Auth session / token management
- OAuth provider handling (Google button is UI only)

Suggested API endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Dashboard

Files: `frontend/src/app/pages/Dashboard.tsx`

Current UI uses static data. Backend is needed for:

- Greeting info (user name)
- Streak, level, weekly XP totals
- Recent songs and last practice status
- Recommendations list
- Weekly performance chart data
- Skill summary values

Suggested API endpoints:

- `GET /api/users/me/summary`
- `GET /api/users/me/recent-songs`
- `GET /api/users/me/recommendations`
- `GET /api/users/me/weekly-performance`
- `GET /api/users/me/skills`

### Song library

Files: `frontend/src/app/pages/SongLibrary.tsx`, `frontend/src/app/components/SongCard.tsx`

Currently uses `GET /api/songs` if available; ratings, XP, genre, and cover are derived. Missing backend features:

- Song ratings / popularity
- Genres or tags
- XP value per song
- Song search / filters by difficulty, genre
- User-specific library (favorites, history, progress)

Suggested API endpoints:

- `GET /api/songs` (extend payload)
- `GET /api/songs/search` (query, difficulty, genre, bpm, key)
- `GET /api/users/me/library`
- `POST /api/users/me/favorites`
- `DELETE /api/users/me/favorites/{song_id}`

### Upload song

Files: `frontend/src/app/pages/UploadSongPage.tsx`

Backend exists for upload, process, and status. Missing pieces:

- Progress updates beyond poll status (optional push)
- Validation errors for audio and lyrics formats (improve error payload)
- User ownership of uploads (per-user permissions)

Suggested API enhancements:

- `POST /api/songs/upload` (include `user_id` in DB)
- `GET /api/songs/{song_id}/status` (include `message` updates)
- Optional: `WS /ws/songs/{song_id}/progress`

### Learning

Files: `frontend/src/app/pages/LearningPage.tsx`

Backend provides song reference and audio. Missing pieces:

- User progress persistence (percent complete, last position)
- Time-synced lyrics and sections (already in reference, but not persisted per user)
- Personal coaching hints (currently UI cycle)

Suggested API endpoints:

- `POST /api/users/me/progress` (song_id, elapsed, percent, last_practiced)
- `GET /api/users/me/progress/{song_id}`
- `GET /api/songs/{song_id}/preview` (optional use)

### Recording

Files: `frontend/src/app/pages/RecordingPage.tsx`

Backend supports `POST /api/analysis/pitch`. Missing pieces:

- Real-time pitch stream via WebSocket (frontend not wired)
- Recording storage (save audio and metadata)
- Recording session lifecycle

Suggested API endpoints:

- `POST /api/recordings` (start session)
- `POST /api/recordings/{recording_id}/upload` (audio)
- `GET /api/recordings/{recording_id}`
- `WS /ws/pitch/{recording_id}` (wire to real stream)

### Results

Files: `frontend/src/app/pages/ResultsPage.tsx`

Currently derives score from confidence in pitch analysis. Missing backend pieces:

- Real scoring by comparing user pitch to reference pitch and timing
- Segment-level scoring (verse/chorus)
- Skill breakdown: pitch, timing, stability, expression
- AI coaching feedback based on mistakes
- Achievement unlocks and XP award persistence

Suggested API endpoints:

- `POST /api/recordings/{recording_id}/analyze`
- `GET /api/recordings/{recording_id}/results`
- `POST /api/users/me/achievements` (optional)

### Gamification

Files: `frontend/src/app/pages/GamificationPage.tsx`

All data is static. Missing backend pieces:

- XP ledger and level calculation
- Badges and achievement rules
- Daily quests and quest progress
- Leaderboard data
- Streak tracking

Suggested API endpoints:

- `GET /api/users/me/xp`
- `GET /api/users/me/quests`
- `POST /api/users/me/quests/complete`
- `GET /api/leaderboard/weekly`
- `GET /api/users/me/streak`

### Profile

Files: `frontend/src/app/pages/ProfilePage.tsx`

All data is static. Missing backend pieces:

- User profile data (name, avatar)
- Stats (songs completed, recordings, badges)
- Performance history
- Weekly practice counts
- Favorite songs
- Achievements list

Suggested API endpoints:

- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/users/me/stats`
- `GET /api/users/me/history`
- `GET /api/users/me/favorites`

## Backend Endpoints That Need Frontend Wiring

Existing backend endpoints not currently used by UI:

- `GET /api/songs/{song_id}/preview`
- `GET /api/songs/{song_id}/reference-pitch`
- `DELETE /api/songs/{song_id}`
- `WS /ws/pitch/{recording_id}`

## Schema and Contract Mismatches

### Recording analysis

Backend placeholder in `POST /api/recordings/{song_id}/analyze` does not match frontend usage.

Frontend expects:

- Request body: `{ recording_id }`
- Response: `AnalysisResult` with `overall_accuracy`, `pitch_accuracy`, `timing_accuracy`, `feedback`, `recommendations`

Backend currently returns:

- `overall_score`, `pitch_score`, `rhythm_score`, `timing_score`, `feedback: ["Good job!"]`

Action: align request and response to the frontend schema or update frontend types and consumers.

### Song metadata

Frontend expects additional fields (rating, XP, genre, cover). Backend only returns core metadata.

Action: extend `SongMetadata` or create a separate `SongCard` payload type for UI lists.

## Database Models Missing

Current DB usage is only `songs` collection. Missing collections:

- `users` (auth, profile, settings)
- `sessions` or `refresh_tokens`
- `recordings` (audio path, duration, analysis status)
- `analysis_results` (scores, breakdown, feedback)
- `progress` (per-song completion, last practice)
- `achievements` (unlock state)
- `quests` and `quest_progress`
- `leaderboards` (weekly aggregates)
- `favorites` (user-song mapping)
- `recommendations` (optional precomputed)

## Priority Build Plan (Suggested)

### Phase 1 - Authentication and user base

- Implement user model, auth endpoints, and session management.
- Create `GET /api/auth/me` for frontend gating.

### Phase 2 - Recording and analysis pipeline

- Store recordings in DB and file storage.
- Implement reference vs user pitch scoring.
- Return structured `AnalysisResult` and detailed breakdown.

### Phase 3 - Progress and profile data

- Persist practice progress and history.
- Provide profile stats and weekly charts.

### Phase 4 - Gamification and recommendations

- XP ledger, badges, quests, leaderboard.
- Recommendation service and favorites.

## Notes and Assumptions

- Backend is FastAPI with MongoDB via Motor.
- Frontend uses Next.js and Axios.
- If OAuth is required, finalize provider(s) and redirect URLs early.
- For real-time pitch streaming, decide whether to stream raw pitch points or pre-processed events.

## Integration Notes

- The frontend now uses same-origin API paths by default and lets Next.js proxy to FastAPI via `BACKEND_INTERNAL_URL`.
- Docker Compose sets `BACKEND_INTERNAL_URL=http://backend:8000` for container-to-container traffic.
- For direct browser-to-backend calls, set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`.
