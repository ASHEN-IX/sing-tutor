# Sprint 2 Testing Guide

## Running Tests

### Backend Unit Tests

```bash
# Install test dependencies (if not already installed)
pip install pytest pytest-cov

# Run all tests
cd backend
pytest app/tests/test_sprint2_services.py -v

# Run specific test class
pytest app/tests/test_sprint2_services.py::TestSongStorageService -v

# Run with coverage
pytest app/tests/test_sprint2_services.py -v --cov=app/services
```

### Frontend Tests

```bash
# Run frontend tests
cd frontend
npm test

# Run with coverage
npm test -- --coverage
```

---

## API Integration Testing with curl

### Prerequisites

1. Start backend:
   ```bash
   cd backend
   python run.py
   ```

2. Backend should be running at `http://localhost:8000`

### Test Workflow

#### 1. Upload a Song

Create test files first:

```bash
# Create test audio (silent WAV file)
ffmpeg -f lavfi -i anullsrc=r=22050:cl=mono -t 10 test_song.wav -y

# Create test lyrics
cat > test_lyrics.txt << 'EOF'
I love to sing
This is a beautiful song
Let me share my voice
With all the world around
EOF
```

Upload the song:

```bash
curl -X POST http://localhost:8000/api/songs/upload \
  -F "audio=@test_song.wav" \
  -F "lyrics=@test_lyrics.txt" \
  -F "title=Test Song" \
  -F "artist=Test Artist" \
  -F "language=en" \
  -F "difficulty=beginner"
```

**Response:**
```json
{
  "song_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Test Song",
  "artist": "Test Artist",
  "status": "uploaded",
  "message": "Files uploaded successfully. Ready for processing."
}
```

Save the `song_id` for next steps: `SONG_ID=550e8400-e29b-41d4-a716-446655440000`

#### 2. Start Processing

```bash
curl -X POST http://localhost:8000/api/songs/$SONG_ID/process
```

**Response:**
```json
{
  "song_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 0.0,
  "message": "Processing started..."
}
```

#### 3. Check Processing Status

```bash
# Poll status (check multiple times until complete)
curl http://localhost:8000/api/songs/$SONG_ID/status
```

**While Processing:**
```json
{
  "song_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 0.45,
  "message": "Extracting melody..."
}
```

**After Completion:**
```json
{
  "song_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 1.0,
  "message": "Processing completed!"
}
```

#### 4. Get Complete Reference

```bash
curl http://localhost:8000/api/songs/$SONG_ID/reference | jq .
```

**Response (Partial):**
```json
{
  "song_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Test Song",
  "artist": "Test Artist",
  "language": "en",
  "difficulty": "beginner",
  "duration": 10.0,
  "bpm": 120.0,
  "key": "C Major",
  "beats": [0.0, 0.5, 1.0, 1.5, ...],
  "pitch_data": [
    {
      "timestamp": 0.032,
      "frequency": 440.2,
      "confidence": 0.97
    },
    ...
  ],
  "lyrics": [
    {
      "index": 0,
      "word": "I",
      "start": 0.0,
      "end": 0.5
    },
    ...
  ],
  "sections": [...],
  "diagnostics": {
    "processing_time_seconds": 12.5,
    "alignment_quality": 0.88,
    "pitch_coverage": 0.95,
    "processed_at": "2026-05-17T14:30:00.000000",
    "processing_version": "2.0"
  }
}
```

#### 5. Get Preview (Lightweight)

```bash
curl http://localhost:8000/api/songs/$SONG_ID/preview | jq .
```

**Response:**
```json
{
  "song_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Test Song",
  "artist": "Test Artist",
  "duration": 10.0,
  "bpm": 120.0,
  "key": "C Major",
  "difficulty": "beginner",
  "beats_count": 20,
  "pitch_samples_count": 320,
  "lyrics_words_count": 12,
  "sections_count": 3,
  "alignment_quality": 0.88,
  "processed_at": "2026-05-17T14:30:00.000000"
}
```

#### 6. Delete Song

```bash
curl -X DELETE http://localhost:8000/api/songs/$SONG_ID
```

**Response:** 204 No Content (empty)

---

## Full Workflow Script

Save this as `test_workflow.sh`:

```bash
#!/bin/bash

# Configuration
BACKEND_URL="http://localhost:8000/api/songs"
AUDIO_FILE="test_song.wav"
LYRICS_FILE="test_lyrics.txt"

# Create test files
echo "Creating test files..."
ffmpeg -f lavfi -i anullsrc=r=22050:cl=mono -t 10 $AUDIO_FILE -y > /dev/null 2>&1

cat > $LYRICS_FILE << 'EOF'
I love to sing
This is a beautiful song
Let me share my voice
With all the world around
EOF

# Upload
echo "Uploading song..."
RESPONSE=$(curl -s -X POST $BACKEND_URL/upload \
  -F "audio=@$AUDIO_FILE" \
  -F "lyrics=@$LYRICS_FILE" \
  -F "title=Test Song" \
  -F "artist=Test Artist")

SONG_ID=$(echo $RESPONSE | jq -r '.song_id')
echo "Song uploaded with ID: $SONG_ID"

# Process
echo "Starting processing..."
curl -s -X POST $BACKEND_URL/$SONG_ID/process

# Poll status
echo "Waiting for processing to complete..."
MAX_WAIT=300  # 5 minutes
ELAPSED=0
INTERVAL=2

while [ $ELAPSED -lt $MAX_WAIT ]; do
  STATUS=$(curl -s $BACKEND_URL/$SONG_ID/status)
  STATE=$(echo $STATUS | jq -r '.status')
  PROGRESS=$(echo $STATUS | jq -r '.progress')
  
  echo "Status: $STATE (${PROGRESS}%)"
  
  if [ "$STATE" = "completed" ]; then
    echo "Processing complete!"
    break
  elif [ "$STATE" = "failed" ]; then
    ERROR=$(echo $STATUS | jq -r '.error')
    echo "Processing failed: $ERROR"
    exit 1
  fi
  
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
done

# Get reference
echo "Retrieving reference..."
curl -s $BACKEND_URL/$SONG_ID/reference | jq '.' > reference.json
echo "Reference saved to reference.json"

# Cleanup
echo "Cleaning up test files..."
rm -f $AUDIO_FILE $LYRICS_FILE

echo "Test workflow complete!"
```

Run it:
```bash
chmod +x test_workflow.sh
./test_workflow.sh
```

---

## Error Scenarios

### Invalid Audio File

```bash
echo "invalid" > invalid.mp3
curl -X POST http://localhost:8000/api/songs/upload \
  -F "audio=@invalid.mp3" \
  -F "lyrics=@test_lyrics.txt" \
  -F "title=Test" \
  -F "artist=Test"
```

**Response (400):**
```json
{
  "detail": "Audio file too large (max 100MB)"
}
```

### Missing Required Fields

```bash
curl -X POST http://localhost:8000/api/songs/upload \
  -F "audio=@test_song.wav"
```

**Response (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "lyrics"],
      "msg": "Field required",
      "type": "missing"
    }
  ]
}
```

### Song Not Found

```bash
curl http://localhost:8000/api/songs/invalid-id/reference
```

**Response (404):**
```json
{
  "detail": "Song not found: invalid-id"
}
```

---

## Performance Testing

### Test with Real Audio

Download a sample song and test:

```bash
# Download sample (example)
curl -L https://example.com/sample.mp3 -o real_song.mp3

# Upload
curl -X POST http://localhost:8000/api/songs/upload \
  -F "audio=@real_song.mp3" \
  -F "lyrics=@test_lyrics.txt" \
  -F "title=Real Song" \
  -F "artist=Artist"
```

### Benchmark Processing Time

```bash
#!/bin/bash

# Extract processing time from reference
curl -s http://localhost:8000/api/songs/$SONG_ID/reference | \
  jq '.diagnostics.processing_time_seconds'
```

**Expected Performance:**
- 3-5 minute song: 30-45 seconds
- 10 minute song: 60-90 seconds
- Depends on CPU hardware

---

## Frontend Integration Testing

### Start Frontend

```bash
cd frontend
npm run dev
```

Access at `http://localhost:5173`

### Test Flow

1. Navigate to "Upload Song" page
2. Select test audio file (test_song.wav)
3. Select test lyrics file (test_lyrics.txt)
4. Fill metadata (Title, Artist, etc.)
5. Click "Upload & Process"
6. Watch real-time progress
7. View complete reference preview

### Frontend Test Coverage

```bash
npm test -- --coverage --watchAll=false
```

---

## Database Verification (Optional)

If using PostgreSQL for metadata:

```bash
# Connect to database
psql -h localhost -U singing_tutor -d ai_singing_tutor

# Verify song metadata
SELECT * FROM songs WHERE title = 'Test Song';

# Check processing logs
SELECT * FROM processing_logs WHERE song_id = '550e8400-e29b-41d4-a716-446655440000';
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check Python version
python --version  # Should be 3.10+

# Check dependencies
pip list | grep librosa

# Try reinstalling
pip install -r requirements.txt --force-reinstall
```

### Audio Processing Fails

```bash
# Verify librosa installation
python -c "import librosa; print(librosa.__version__)"

# Check audio file validity
ffprobe test_song.wav
```

### Frontend API Errors

```bash
# Check backend is running
curl http://localhost:8000/health

# Check CORS is enabled
curl -I http://localhost:8000/api/songs/upload
```

---

## Stress Testing

### Upload Multiple Songs

```bash
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/songs/upload \
    -F "audio=@test_song.wav" \
    -F "lyrics=@test_lyrics.txt" \
    -F "title=Song $i" \
    -F "artist=Artist $i"
  echo "Uploaded song $i"
done
```

### Concurrent Processing

```bash
for SONG_ID in $(curl -s http://localhost:8000/api/songs/list | jq -r '.[]'); do
  curl -X POST http://localhost:8000/api/songs/$SONG_ID/process &
done
wait
```

---

## Summary

- **Unit Tests**: Test individual services in isolation
- **Integration Tests**: Test full pipeline from upload to reference
- **Performance Tests**: Verify processing times on real audio
- **Error Tests**: Validate error handling and messages
- **Frontend Tests**: Ensure UI components work with API

All tests should pass before deploying to production.
