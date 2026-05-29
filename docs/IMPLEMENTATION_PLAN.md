# Implementation Plan - Frontend/Backend Completion

## Goal

Finish the product end to end by implementing all missing backend features, removing mock/static frontend data, aligning contracts, and adding tests for each completed part.

## Scope Summary

- Build user/auth and persistence layers.
- Implement recording lifecycle and real scoring vs reference.
- Persist progress, history, and profile stats.
- Implement gamification, quests, and leaderboard.
- Remove mock data from the frontend and switch to API data.
- Add unit + integration tests for backend and frontend.

## Phase 0 - Project Readiness

### Tasks

- Confirm backend test runner (pytest) and frontend test runner (vitest or jest).
- Add or update test config for frontend (if missing).
- Add seed data for local dev (songs, users) without relying on mock UI data.

### Definition of Done

- `pytest` runs with at least one passing test.
- Frontend test runner executes at least one test.
- Local dev can load with real data (seeded or created in UI).

## Phase 1 - Authentication and User Model

### Backend

#### Data models

- `users` collection
  - `id`, `email`, `password_hash`, `name`, `created_at`, `updated_at`, `avatar_url` (optional)
- `sessions` or `refresh_tokens` collection
  - `id`, `user_id`, `token_hash`, `created_at`, `expires_at`

#### Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

#### Security

- Password hashing (bcrypt or argon2)
- Access token (JWT) + refresh token
- Protected routes with auth middleware

### Frontend

- Replace auth page mock behavior with real API calls.
- Store auth token securely (httpOnly cookies preferred, else in memory + refresh flow).
- Update Navbar and protected routes based on real auth state.

### Tests

- Unit tests: auth service, password hashing
- Integration tests: register, login, auth-protected endpoint

### Definition of Done

- Users can register, login, and persist session.
- Auth pages no longer route via mock logic.
- Tests pass: `pytest` and frontend tests.

## Phase 2 - Recording Lifecycle and Analysis

### Backend

#### Data models

- `recordings` collection
  - `id`, `user_id`, `song_id`, `audio_path`, `duration`, `status`, `created_at`
- `analysis_results` collection
  - `recording_id`, `scores`, `segment_scores`, `feedback`, `created_at`

#### Endpoints

- `POST /api/recordings` (create session)
- `POST /api/recordings/{recording_id}/upload` (audio file)
- `POST /api/recordings/{recording_id}/analyze`
- `GET /api/recordings/{recording_id}/results`
- `WS /ws/pitch/{recording_id}` (real streaming or remove until implemented)

#### Scoring logic

- Align user pitch contour to reference pitch
- Timing error and pitch deviation
- Segment scoring based on reference sections
- Derive overall scores and feedback

### Frontend

- Recording page creates a recording session and uploads audio.
- Results page consumes real analysis result payload.
- Remove static charts and use API data.

### Tests

- Unit tests: scoring functions
- Integration tests: upload + analyze flow

### Definition of Done

- Recording flow uses backend endpoints end to end.
- Results show real computed analysis.
- Tests pass.

## Phase 3 - Progress and Profile Data

### Backend

#### Data models

- `progress` collection
  - `user_id`, `song_id`, `percent_complete`, `last_position`, `updated_at`
- `practice_history` collection
  - `user_id`, `song_id`, `score`, `duration`, `created_at`

#### Endpoints

- `POST /api/users/me/progress`
- `GET /api/users/me/progress/{song_id}`
- `GET /api/users/me/history`
- `GET /api/users/me/stats`

### Frontend

- Learning page updates progress.
- Dashboard and Profile consume real stats and history.
- Remove mock data for charts and lists.

### Tests

- Unit tests: progress calculations
- Integration tests: progress update and retrieval

### Definition of Done

- Real user stats appear on Dashboard and Profile.
- Mock data removed in these pages.
- Tests pass.

## Phase 4 - Gamification, Quests, and Leaderboards

### Backend

#### Data models

- `xp_ledger` collection
  - `user_id`, `delta`, `reason`, `created_at`
- `badges` collection
  - `id`, `name`, `criteria`
- `user_badges` collection
  - `user_id`, `badge_id`, `earned_at`
- `quests` and `quest_progress` collections
- `leaderboard_weekly` collection

#### Endpoints

- `GET /api/users/me/xp`
- `GET /api/users/me/quests`
- `POST /api/users/me/quests/complete`
- `GET /api/leaderboard/weekly`
- `GET /api/users/me/badges`

### Frontend

- Gamification page uses real XP, quests, badges, and leaderboard data.
- Remove all static quests and badges.

### Tests

- Unit tests: XP calculation and badge criteria
- Integration tests: quest completion and leaderboard

### Definition of Done

- Gamification page is fully dynamic.
- Mock data removed.
- Tests pass.

## Phase 5 - Recommendations and Song Metadata

### Backend

#### Data models

- `song_ratings` collection
  - `song_id`, `avg_rating`, `rating_count`
- `recommendations` collection (optional)

#### Endpoints

- `GET /api/songs` (extend payload with rating, genre, xp)
- `GET /api/songs/search`
- `GET /api/users/me/recommendations`
- `POST /api/users/me/favorites`
- `DELETE /api/users/me/favorites/{song_id}`

### Frontend

- Library page uses real metadata.
- Dashboard recommendations use real data.

### Tests

- Unit tests: ranking and filtering
- Integration tests: search and recommendation endpoints

### Definition of Done

- Library and Dashboard are fully dynamic.
- No mock data in song list or recommendations.
- Tests pass.

## Contract Alignment Checklist

- Align `AnalysisResult` schema between backend and frontend.
- Ensure `SongMetadata` includes what UI needs or add a `SongCard` payload type.
- Standardize error response shape across endpoints.

## Testing Strategy

- Backend: pytest + TestClient, use test database and temp storage.
- Frontend: add tests for services and state updates; avoid snapshot-only tests.
- Integration: full flow tests for upload -> process -> learning -> recording -> results.

## Milestone Order

1. Auth and user model
2. Recording and analysis
3. Progress and profile data
4. Gamification and leaderboard
5. Recommendations and metadata

## Acceptance Criteria

- No mock/static data remains in production UI components.
- All UI pages load data from backend.
- All required endpoints exist and match documented contracts.
- All unit and integration tests pass after each phase.
