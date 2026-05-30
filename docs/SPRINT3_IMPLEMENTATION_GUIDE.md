# Sprint 3 Implementation Guide — Performance Comparison Engine

## 🎯 Objective

Implement real pitch and timing comparison logic to score user performances against reference songs using Dynamic Time Warping (DTW) and statistical analysis.

---

## 📋 Architecture Overview

### Current State
- ✅ Audio preprocessing and pitch detection exist
- ✅ Song reference processing exists with melody extraction
- ✅ API endpoint `/api/recordings/{song_id}/analyze` exists but returns mock data
- ✅ Frontend ResultsPage.tsx displays scores and UI
- ❌ **Missing**: Actual comparison and scoring algorithms

### Sprint 3 Flow
```
User Recording (audio file)
    ↓
[Extract pitch contour] (already exists: audio_preprocessor + pitch_detector)
    ↓
[Load reference melody] (already exists: song_storage + reference_builder)
    ↓
[Align sequences using DTW] (NEW)
    ↓
[Calculate metrics] (NEW)
    ├─ Pitch accuracy (deviation from reference)
    ├─ Timing accuracy (alignment with beats)
    ├─ Stability (pitch variation analysis)
    └─ Expression (vibrato + dynamics)
    ↓
[Generate segment scores] (NEW)
    ↓
[Build AnalysisResult] (modify existing)
    ↓
[Return to frontend + store in DB] (modify existing)
```

---

## 🔧 Technical Components

### 1. **Dynamic Time Warping (DTW) Implementation**

**Purpose**: Align two pitch contours of different lengths by finding the optimal warping path.

**File to Create**: `backend/app/services/dtw_aligner.py`

**Algorithm Details:**
```
Input: 
  - user_pitches: array of pitch values (Hz) from user recording
  - reference_pitches: array of pitch values (Hz) from reference song
  
Process:
  1. Normalize both arrays to same scale (e.g., semitones from C4)
  2. Build DTW cost matrix using Euclidean distance
  3. Find minimum cost path using dynamic programming
  4. Return alignment mapping: indices in user_pitches → indices in reference_pitches
  
Output:
  - warping_path: list of (user_idx, ref_idx) tuples
  - accumulated_cost: float (lower = better alignment)
  - local_costs: array of per-frame alignment costs
```

**Key Methods:**
- `normalize_pitch(pitches, reference_freq=261.63)` → normalized semitones
- `euclidean_distance(p1, p2)` → float distance
- `dtw_align(user_pitches, reference_pitches)` → (warping_path, cost, local_costs)
- `pitch_to_semitones(hz, reference_hz)` → semitones from reference

**Dependencies:**
- `numpy` (matrix operations)
- `scipy.spatial.distance` (if using precalculated distances)

---

### 2. **Pitch Accuracy Calculation**

**Purpose**: Measure how close user's pitch is to reference melody.

**File to Create**: `backend/app/services/pitch_accuracy_calculator.py`

**Algorithm Details:**
```
Input:
  - user_pitches: array of user pitch values
  - reference_pitches: array of reference pitch values
  - warping_path: alignment from DTW
  
Process:
  1. For each aligned pair (user_pitch, ref_pitch):
     deviation_cents = 100 * log2(user_pitch / ref_pitch)
  
  2. Calculate statistics:
     - Mean absolute deviation (MAD) in cents
     - Root Mean Square Error (RMSE)
     - Percentage of frames within tolerance (e.g., ±50 cents)
  
  3. Convert to accuracy score (0-100):
     accuracy = max(0, 100 - (MAD / 100) * 50)
     clamp to [0, 100]
  
Output:
  - overall_pitch_accuracy: float (0-100)
  - per_frame_accuracy: array of accuracies for each reference frame
  - deviation_distribution: dict with min/max/mean deviations
```

**Key Methods:**
- `calculate_deviation_cents(user_hz, reference_hz)` → cents
- `calculate_pitch_accuracy(user_pitches, ref_pitches, warping_path)` → accuracy, details
- `frame_accuracy(deviation_cents)` → 0-100 score for single frame

---

### 3. **Timing Accuracy Calculation**

**Purpose**: Measure if user sang in sync with the beat.

**File to Create**: `backend/app/services/timing_accuracy_calculator.py`

**Algorithm Details:**
```
Input:
  - user_recording_duration: float (seconds)
  - reference_duration: float (seconds)
  - reference_beats: array of beat timestamps (seconds)
  - reference_lyrics: list of {word, start_time, end_time}
  - warping_path: alignment from DTW
  
Process:
  1. Calculate timing drift:
     expected_end = reference_duration
     actual_end = user_recording_duration
     overall_drift = (actual_end - expected_end) / expected_end
  
  2. For each beat, calculate deviation:
     For reference_beat_time:
       - Find corresponding user_idx from warping_path
       - Calculate actual_time in user recording
       - beat_deviation = actual_time - reference_beat_time
  
  3. Calculate statistics:
     - Mean absolute beat deviation (seconds)
     - Percentage of beats within tolerance (e.g., ±100ms)
     - Tempo consistency (variance of beat deviations)
  
  4. Convert to accuracy score (0-100):
     accuracy = max(0, 100 - (mean_beat_deviation_ms / 200) * 100)
     clamp to [0, 100]
  
  5. Segment-level timing:
     For each lyric segment, calculate if it was sung at correct time
  
Output:
  - overall_timing_accuracy: float (0-100)
  - per_beat_accuracy: array for each reference beat
  - overall_drift: float (0-1, 0 = perfect sync)
  - segment_timings: dict mapping lyrics to timing scores
```

**Key Methods:**
- `calculate_overall_drift(user_duration, reference_duration)` → float
- `calculate_beat_deviations(user_warping_indices, reference_beats)` → deviations
- `calculate_timing_accuracy(drift, beat_deviations)` → accuracy, details
- `calculate_segment_timing(segments, warping_path, user_duration)` → segment_scores

---

### 4. **Stability Metric Calculation**

**Purpose**: Measure pitch consistency and vibrato presence.

**File to Create**: `backend/app/services/stability_calculator.py`

**Algorithm Details:**
```
Input:
  - user_pitches: array of pitch values
  - timestamps: array of frame timestamps (seconds)
  
Process:
  1. For each sustained note (identified by low variation):
     - Calculate variance of pitch values
     - If variance is within bounds: stable note
     - If variance shows oscillation: vibrato detection
  
  2. Pitch stability score:
     - Low variance = high stability
     - Some oscillation = vibrato (good!)
     - Erratic = instability (bad)
  
  3. Detect held notes (no pitch change expected):
     - For reference notes marked as "held"
     - Check user pitch variance
     - Score based on consistency
  
  4. Convert to stability score (0-100):
     Based on proportion of stable notes and natural vibrato
  
Output:
  - stability_score: float (0-100)
  - vibrato_quality: float (0-100) or null if not detected
  - stability_by_segment: array of scores per lyric segment
```

**Key Methods:**
- `detect_sustained_regions(pitches, timestamps, min_duration=0.5)` → regions
- `calculate_pitch_variance(pitches, region)` → variance
- `detect_vibrato(pitches, region, expected_freq_hz)` → score or null
- `calculate_stability_score(regions, variances)` → score

---

### 5. **Expression Metric Calculation**

**Purpose**: Measure dynamics, articulation, and emotional delivery.

**File to Create**: `backend/app/services/expression_calculator.py`

**Algorithm Details:**
```
Input:
  - reference_pitches: array of reference melody
  - user_pitches: array of user pitch
  - user_loudness: array of amplitude/RMS values (from audio)
  - reference_loudness: array of reference amplitude
  - warping_path: DTW alignment
  
Process:
  1. Phrase detection:
     - Group notes into phrases (based on reference lyrics)
     - Each phrase should have dynamic contour
  
  2. Dynamics analysis:
     - For each phrase, calculate loudness envelope
     - User dynamics should follow reference pattern
     - Score based on correlation of envelope shapes
  
  3. Articulation analysis:
     - Detect consonant/vowel transitions
     - Score based on clarity and timing
  
  4. Note attack/release:
     - Check start and end timing of each note
     - Should be precise (not sloppy)
  
  5. Convert to expression score (0-100):
     Based on dynamics matching + articulation + attack/release quality
  
Output:
  - expression_score: float (0-100)
  - dynamics_score: float (0-100)
  - articulation_score: float (0-100)
  - phrase_scores: array per lyric phrase
```

**Key Methods:**
- `extract_loudness_envelope(audio_samples, frame_length)` → array
- `detect_phrases(lyrics, pitches)` → phrase_regions
- `calculate_dynamics_correlation(user_envelope, ref_envelope, warping_path)` → score
- `calculate_articulation_score(pitches, loudness, timestamps)` → score
- `calculate_expression_score(dynamics, articulation, attack_release)` → score

---

### 6. **Segment-Level Scoring**

**Purpose**: Break down performance by lyric segment for detailed feedback.

**File to Create**: `backend/app/services/segment_scorer.py`

**Algorithm Details:**
```
Input:
  - All accuracy metrics (pitch, timing, stability, expression)
  - Segment boundaries (from reference lyrics)
  - Per-frame scores aligned with segments
  
Process:
  1. For each lyric segment (e.g., verse, chorus):
     - Find corresponding frames in user recording
     - Extract scores for this segment
     - Calculate average accuracy for segment
  
  2. Identify problem areas:
     - Segments with low pitch accuracy → "flat/sharp"
     - Segments with low timing accuracy → "rushed/dragged"
     - Segments with low stability → "wavering"
  
  3. Create segment summary:
     {
       segment_id: "verse_1",
       lyrics: "Some lyrics here",
       pitch_accuracy: 85,
       timing_accuracy: 90,
       stability_score: 75,
       expression_score: 80,
       overall_score: 82.5,
       strengths: ["Good pitch", "Great timing"],
       weaknesses: ["Unstable", "Could project more"]
     }
  
Output:
  - segments: array of segment summaries
  - top_strengths: list of most consistent strengths
  - top_weaknesses: list of most common issues
```

**Key Methods:**
- `extract_segment_frames(segment_start, segment_end, warping_path)` → frame_indices
- `calculate_segment_scores(segment_frames, all_metrics)` → segment_scores
- `identify_problem_patterns(segments)` → strengths, weaknesses

---

### 7. **Overall Score Calculation**

**Purpose**: Combine all metrics into final overall accuracy score.

**File to Create**: `backend/app/services/overall_scorer.py`

**Algorithm Details:**
```
Input:
  - pitch_accuracy: float (0-100)
  - timing_accuracy: float (0-100)
  - stability_score: float (0-100)
  - expression_score: float (0-100)
  - weights: dict of weights (optional)
  
Process:
  Default weights (can be tuned):
  - pitch: 0.40 (most important)
  - timing: 0.30
  - stability: 0.20
  - expression: 0.10
  
  overall = (pitch * 0.40) + (timing * 0.30) + (stability * 0.20) + (expression * 0.10)
  
  Grade mapping:
  - 90-100: A (Excellent)
  - 80-89: B (Good)
  - 70-79: C (Average)
  - 60-69: D (Fair)
  - <60: F (Needs work)
  
Output:
  - overall_accuracy: float (0-100)
  - grade: string (A-F)
  - score_breakdown: dict of component scores
```

**Key Methods:**
- `calculate_overall_accuracy(pitch, timing, stability, expression, weights)` → overall
- `assign_grade(overall_accuracy)` → grade_string

---

## 📊 Data Models

### Modify: `backend/app/schemas/pitch.py`

Add to AnalysisResult:
```python
class SegmentScore(BaseModel):
    segment_id: str
    lyrics: str
    start_time: float
    end_time: float
    pitch_accuracy: float
    timing_accuracy: float
    stability_score: float
    expression_score: float
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]

class AnalysisResult(BaseModel):
    recording_id: str
    song_id: str
    
    # Overall scores
    overall_accuracy: float
    pitch_accuracy: float
    timing_accuracy: float
    stability_score: float
    expression_score: float
    
    # Breakdowns
    segments: List[SegmentScore]
    top_strengths: List[str]
    top_weaknesses: List[str]
    
    # Detailed metrics
    pitch_deviation_cents: float  # mean absolute deviation
    timing_drift: float  # 0-1 scale
    grade: str  # A-F
    
    # Feedback and recommendations
    feedback: str
    recommendations: List[str]
    
    # Metadata
    created_at: datetime
    duration: float
```

---

## 🔌 API Integration

### Modify: `backend/app/api/analysis.py`

**Current endpoint** (to modify):
```
POST /api/recordings/{song_id}/analyze
```

**Implementation details:**
1. Accept recording_id from request
2. Load user recording pitch data from storage
3. Load song reference from storage
4. Run all comparison algorithms
5. Build AnalysisResult
6. Store result in database (new collection: `recordings` or `analyses`)
7. Return result

**Pseudo-code:**
```python
@router.post("/api/recordings/{recording_id}/analyze")
async def analyze_recording(recording_id: str, song_id: str):
    # 1. Load user recording pitch
    user_pitches = load_user_pitch_data(recording_id)
    
    # 2. Load reference song
    reference = load_song_reference(song_id)
    reference_pitches = reference.melody.pitches
    reference_beats = reference.beats
    reference_lyrics = reference.lyrics
    
    # 3. Align using DTW
    warping_path, dtw_cost, local_costs = dtw_align(user_pitches, reference_pitches)
    
    # 4. Calculate metrics
    pitch_acc = calculate_pitch_accuracy(user_pitches, reference_pitches, warping_path)
    timing_acc = calculate_timing_accuracy(...)
    stability = calculate_stability(user_pitches)
    expression = calculate_expression(...)
    
    # 5. Generate segment scores
    segments = calculate_segment_scores(...)
    
    # 6. Overall score
    overall_acc = calculate_overall_accuracy(pitch_acc, timing_acc, stability, expression)
    
    # 7. Generate feedback
    feedback, recommendations = generate_feedback(segments, overall_acc)
    
    # 8. Build result
    result = AnalysisResult(
        recording_id=recording_id,
        song_id=song_id,
        overall_accuracy=overall_acc,
        pitch_accuracy=pitch_acc,
        timing_accuracy=timing_acc,
        stability_score=stability,
        expression_score=expression,
        segments=segments,
        feedback=feedback,
        recommendations=recommendations
    )
    
    # 9. Store in database
    save_analysis_result(result)
    
    # 10. Return
    return result
```

---

## 🎨 Frontend Integration

### Modify: `frontend/src/services/analysisService.ts`

**Update existing function**:
```typescript
async analyzeRecording(recordingId: string, songId: string): Promise<AnalysisResult> {
    // Call backend endpoint (will now return real data instead of mock)
    const response = await api.post(`/api/recordings/${recordingId}/analyze`, {
        song_id: songId
    });
    return response.data;
}
```

### Modify: `frontend/src/pages/ResultsPage.tsx`

**Update to display real data**:
- Replace hardcoded mock data with API response
- Update pitch accuracy chart with real values
- Update timing accuracy with real values
- Display real segment breakdown
- Show actual feedback and recommendations

---

## 🧪 Testing Strategy

### Unit Tests: `backend/app/tests/test_performance_comparison.py`

**Test files to create:**
1. `test_dtw_aligner.py`
   - Test DTW alignment with simple cases
   - Test cost calculation
   - Test with identical sequences (should align perfectly)
   - Test with shifted sequences (should find offset)

2. `test_pitch_accuracy_calculator.py`
   - Test deviation calculation in cents
   - Test accuracy scoring
   - Test frame-level accuracy

3. `test_timing_accuracy_calculator.py`
   - Test beat deviation calculation
   - Test overall drift calculation
   - Test timing accuracy scoring

4. `test_stability_calculator.py`
   - Test stable note detection
   - Test vibrato detection
   - Test stability scoring

5. `test_expression_calculator.py`
   - Test dynamics correlation
   - Test articulation scoring
   - Test expression scoring

6. `test_segment_scorer.py`
   - Test segment extraction
   - Test per-segment scoring

7. `test_overall_scorer.py`
   - Test overall accuracy calculation
   - Test grade assignment

### Integration Tests: `backend/app/tests/test_analysis_endpoint.py`

- Test full analysis flow with real recording + reference
- Test endpoint returns valid AnalysisResult schema
- Test scores are reasonable (0-100 range)
- Test multiple recordings produce different scores

### Frontend Tests: `frontend/src/services/analysisService.test.ts`

- Mock API response with real AnalysisResult
- Test service correctly parses response
- Test error handling

---

## 📦 Database Models

### New Collection: `analyses`

```json
{
  "_id": ObjectId,
  "recording_id": ObjectId,
  "song_id": ObjectId,
  "user_id": ObjectId,
  "overall_accuracy": 85.5,
  "pitch_accuracy": 87.0,
  "timing_accuracy": 83.0,
  "stability_score": 85.0,
  "expression_score": 82.0,
  "segments": [...],
  "top_strengths": [...],
  "top_weaknesses": [...],
  "grade": "B",
  "feedback": "...",
  "recommendations": [...],
  "created_at": ISODate,
  "duration": 180.5
}
```

### Modify Collection: `recordings` (to be created in Phase 2)

```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "song_id": ObjectId,
  "audio_path": "...",
  "pitch_data": {
    "times": [...],
    "frequencies": [...],
    "confidence": [...]
  },
  "analysis_id": ObjectId,  // reference to analyses collection
  "created_at": ISODate
}
```

---

## 🛠️ Implementation Sequence

### Phase 1: Core Comparison Algorithms
1. Create `dtw_aligner.py` with DTW implementation
2. Create `pitch_accuracy_calculator.py`
3. Create `timing_accuracy_calculator.py`
4. Write unit tests for each

### Phase 2: Expression & Stability
1. Create `stability_calculator.py`
2. Create `expression_calculator.py`
3. Write unit tests

### Phase 3: Scoring Integration
1. Create `segment_scorer.py`
2. Create `overall_scorer.py`
3. Create `feedback_generator.py` (for recommendations)
4. Write unit tests

### Phase 4: API Integration
1. Modify `analysis.py` endpoint to use new logic
2. Update database schema for analyses collection
3. Add integration tests

### Phase 5: Frontend Display
1. Update `analysisService.ts`
2. Update `ResultsPage.tsx` to display real data
3. Add frontend tests

---

## 📈 Performance Considerations

- **DTW Complexity**: O(n*m) where n, m are pitch array lengths
  - For typical songs (3-4 min @ 10ms frames): ~200k operations
  - Should complete in <100ms on modern hardware
  - Optimization: Use only non-zero confidence frames

- **Caching**: Store analyses results in database to avoid re-computation
  
- **Chunk Processing**: For real-time (Sprint 5), process pitch data incrementally

---

## 🎯 Success Criteria

- ✅ All unit tests pass (>30 tests)
- ✅ Scores are reasonable (0-100 range, consistent with performance)
- ✅ DTW properly aligns sequences of different lengths
- ✅ Feedback matches actual performance issues
- ✅ Frontend displays all real metrics correctly
- ✅ No hardcoded mock data in analysis results
- ✅ Performance acceptable (<500ms for full analysis)

---

## 🔮 Optional Enhancements (Post-MVP)

- Machine learning model for better feature detection
- Advanced vibrato/trill detection
- Emotional tone analysis
- Comparison to genre norms
- Historical progress tracking
- Peer comparison (leaderboard integration)

---

## Summary Table

| Component | File | Status | Complexity |
|-----------|------|--------|------------|
| DTW Implementation | `dtw_aligner.py` | 📝 Create | High |
| Pitch Accuracy | `pitch_accuracy_calculator.py` | 📝 Create | Medium |
| Timing Accuracy | `timing_accuracy_calculator.py` | 📝 Create | Medium |
| Stability Metric | `stability_calculator.py` | 📝 Create | Medium |
| Expression Metric | `expression_calculator.py` | 📝 Create | High |
| Segment Scoring | `segment_scorer.py` | 📝 Create | Medium |
| Overall Scoring | `overall_scorer.py` | 📝 Create | Low |
| Feedback Generator | `feedback_generator.py` | 📝 Create | Medium |
| API Integration | `api/analysis.py` | ✏️ Modify | Low |
| Schema Update | `schemas/pitch.py` | ✏️ Modify | Low |
| Frontend Service | `analysisService.ts` | ✏️ Modify | Low |
| Frontend UI | `pages/ResultsPage.tsx` | ✏️ Modify | Low |
| Unit Tests | `tests/test_*.py` | 📝 Create | High |
| Integration Tests | `tests/test_analysis_endpoint.py` | 📝 Create | Medium |

**Total New Files**: ~9 backend services + tests
**Total Modified Files**: 4 (api, schemas, frontend service, frontend UI)
**Estimated LOC**: ~2000-2500 lines of Python + ~300 lines of TypeScript
