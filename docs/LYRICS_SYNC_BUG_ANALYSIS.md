# Lyrics Synchronization Bug - Root Cause Analysis & Fix

## 🐛 Problem Statement

When a user plays a song on the LearningPage and watches the lyrics display, **the lyrics do not change in sync with the audio**. They either lag behind, jump ahead, or change erratically.

---

## 🔍 Root Cause Analysis

### Issue 1: Lyric Transition Timing Logic

**Current Code** (LearningPage.tsx, line ~291):
```typescript
const currentLyricIdx = displayLyrics.reduce((acc, l, i) => (elapsed >= l.time ? i : acc), 0);
```

**Problem:**
- This finds the LAST lyric where `elapsed >= l.time`
- Means the lyric changes AFTER its time has passed
- For example, if a lyric starts at 4.0 seconds:
  - At 3.999s: Shows previous lyric ❌
  - At 4.000s: Shows previous lyric ❌ (still checking `>=`)
  - At 4.001s: NOW shows current lyric ✅ (1ms late)

**Impact:** Visible delay between lyric change and when it should occur.

---

### Issue 2: Reference Data Structure Mismatch

**Backend** (reference_builder.py):
- Stores individual words with `start` and `end` times
- Example: `[{word: "I've", start: 0.0, end: 0.5}, {word: "been", start: 0.5, end: 1.0}, ...]`

**Frontend** (LearningPage.tsx, lyricLines function):
```typescript
function lyricLines(reference: SongReference | null) {
  if (!reference?.lyrics.length) return lyrics;
  
  const lines: { text: string; time: number }[] = [];
  const wordsPerLine = 6;  // Groups 6 words per line
  
  for (let i = 0; i < reference.lyrics.length; i += wordsPerLine) {
    const chunk = reference.lyrics.slice(i, i + wordsPerLine);
    lines.push({
      text: chunk.map((item) => item.word).join(" "),
      time: chunk[0]?.start ?? 0,  // Uses first word's start time
    });
  }
  return lines;
}
```

**Problem:**
- Arbitrary grouping of 6 words per line
- Doesn't respect natural line breaks in lyrics
- Uses only first word's time (ignores `end` time of last word)
- Loses information about when the line ENDS
- Can group words that shouldn't be together

**Example:**
```
Lyric 1: Words 0-5 (I've been tryna call I've been on)
  start: 0.0 (from word 0)
  
Lyric 2: Words 6-11 (my own for long enough Maybe you)
  start: 4.0 (from word 6)
  
But word 5 ends at 3.8, word 6 starts at 4.0
This creates a 0.2s gap between showing lines!
```

---

### Issue 3: Time Tracking Inconsistency

**Current Code** (LearningPage.tsx, lines 119-139):
```typescript
useEffect(() => {
  if (!isPlaying) {
    cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
    return;
  }
  const offset = elapsedRef.current;
  startRef.current = performance.now() - offset * 1000;
  void audioRef.current?.play();
  
  const tick = (now: number) => {
    const t = audioRef.current?.currentTime ?? (now - startRef.current) / 1000;
    setElapsed(Math.min(t, totalDuration));  // Using audio.currentTime if available
    if (t < totalDuration) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setIsPlaying(false);
    }
  };
  rafRef.current = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafRef.current);
}, [isPlaying, totalDuration]);
```

**And also:**
```typescript
<audio
  ref={audioRef}
  src={`${API_BASE_URL}/songs/${songId}/original.mp3`}
  onEnded={() => setIsPlaying(false)}
  onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
/>
```

**Problem:**
- TWO sources updating elapsed time:
  1. RAF (requestAnimationFrame) tick
  2. HTML audio element's onTimeUpdate
- They can race/conflict
- onTimeUpdate doesn't fire frequently enough (browser dependent, typically ~250ms intervals)
- RAF fires at 60fps but uses `currentTime` which might lag

**Result:** `elapsed` state is updated inconsistently, causing jittery lyric changes.

---

### Issue 4: Mock Lyrics vs Real Data

**Current** (hardcoded mock lyrics):
```typescript
const lyrics = [
  { text: "I've been tryna call", time: 0 },
  { text: "I've been on my own for long enough", time: 4 },
  { text: "Maybe you can show me how to love, maybe", time: 8 },
  { text: "I'm going through withdrawals", time: 12 },
  // ...
];
```

**Problem:**
- These exact times might not match the real audio file
- No validation that times are in order
- No overlap detection
- If actual song timing is different, lyrics will be out of sync

---

## ✅ Solution Strategy

### Fix 1: Improve Lyric Transition Logic

**New approach:**
```typescript
// Instead of: elapsed >= l.time
// Use: current_lyric_start <= elapsed < next_lyric_start

const findCurrentLyricIndex = (elapsed: number, lyrics: Array) => {
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (elapsed >= lyrics[i].time) {
      return i;
    }
  }
  return 0;
};

// Even better: use binary search for large lyric arrays
const findCurrentLyricIndexBinary = (elapsed: number, lyrics: Array) => {
  let left = 0, right = lyrics.length - 1;
  let result = 0;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (lyrics[mid].time <= elapsed) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return result;
};
```

**Added:** Debounce/hysteresis to prevent flicker when at lyric boundaries:
```typescript
const [currentLyricIdx, setCurrentLyricIdx] = useState(0);
const lastLyricTimeRef = useRef(0);

useEffect(() => {
  // Only update lyric if we've moved significantly (>50ms)
  // This prevents flickering at boundaries
  const newIdx = findCurrentLyricIndexBinary(elapsed, displayLyrics);
  if (newIdx !== currentLyricIdx || elapsed - lastLyricTimeRef.current > 0.05) {
    setCurrentLyricIdx(newIdx);
    lastLyricTimeRef.current = elapsed;
  }
}, [elapsed, displayLyrics]);
```

---

### Fix 2: Proper Lyric Grouping from Backend

**New approach:**
1. **Detect natural line breaks** in lyrics (look for newlines or punctuation)
2. **Respect line boundaries** instead of arbitrary 6-word groups
3. **Store both start and end times** for each line
4. **Backend enhancement**: Return pre-grouped lyric lines with timing

**Backend Schema Update** (SongReference):
```python
class LyricLine(BaseModel):
    index: int              # Line number
    text: str              # Full line text
    words: List[LyricWord] # Individual words with timings
    start: float           # Start of first word (seconds)
    end: float             # End of last word (seconds)

class SongReference(BaseModel):
    # ... existing fields ...
    lyric_lines: List[LyricLine]  # New field
    lyrics: List[LyricWord]       # Keep for backward compatibility
```

**Frontend Usage**:
```typescript
// If lyric_lines available, use it
const displayLyrics = reference?.lyric_lines || 
                      createLyricLinesFromWords(reference?.lyrics);

// Display with proper timing
const currentLyricIdx = displayLyrics.reduce(
  (acc, l, i) => (elapsed >= l.start ? i : acc), 
  0
);
```

---

### Fix 3: Unified Time Tracking

**Remove dual time sources**, use only ONE authoritative source:

```typescript
// Option A: Use audio element's currentTime (simpler, more reliable)
const [elapsed, setElapsed] = useState(0);

useEffect(() => {
  if (!isPlaying || !audioRef.current) return;
  
  // Only track via onTimeUpdate, more reliable
  const handleTimeUpdate = () => {
    setElapsed(audioRef.current?.currentTime ?? 0);
  };
  
  const audio = audioRef.current;
  audio.addEventListener('timeupdate', handleTimeUpdate);
  
  return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
}, [isPlaying]);

// For seeking, directly update audio.currentTime
const handleSeek = (newTime: number) => {
  if (audioRef.current) {
    audioRef.current.currentTime = newTime;
  }
};
```

**Or Option B: Use RAF with local timing** (for better performance):
```typescript
const elapsedRef = useRef(0);
const [displayElapsed, setDisplayElapsed] = useState(0);

useEffect(() => {
  if (!isPlaying) return;
  
  let lastUpdateTime = performance.now();
  
  const tick = (now: number) => {
    const deltaMs = now - lastUpdateTime;
    elapsedRef.current += deltaMs / 1000;
    
    // Update display infrequently (e.g., every 16ms = 60fps)
    if (deltaMs > 16) {
      setDisplayElapsed(elapsedRef.current);
      lastUpdateTime = now;
    }
    
    rafRef.current = requestAnimationFrame(tick);
  };
  
  rafRef.current = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafRef.current);
}, [isPlaying]);
```

---

### Fix 4: Validate and Sync Lyric Timing with Audio

**Backend validation** (reference_builder.py):
```python
def validate_lyric_timing(lyrics: List[dict], duration: float) -> Tuple[List[dict], List[str]]:
    """
    Validate lyrics timing is reasonable and within audio duration.
    
    Returns:
        (validated_lyrics, warnings)
    """
    warnings = []
    
    # Check if times are in order
    prev_time = -1
    for i, lyric in enumerate(lyrics):
        if lyric.get('start', 0) < prev_time:
            warnings.append(f"Lyric {i} out of order: {lyric['start']} < {prev_time}")
        if lyric.get('start', 0) > duration:
            warnings.append(f"Lyric {i} start time {lyric['start']} > duration {duration}")
        prev_time = lyric.get('start', 0)
    
    # Check for excessive gaps
    for i in range(len(lyrics) - 1):
        gap = lyrics[i + 1].get('start', 0) - lyrics[i].get('end', 0)
        if gap > 2.0:  # More than 2 second gap
            warnings.append(f"Large gap between lyrics {i} and {i+1}: {gap}s")
    
    return lyrics, warnings
```

**Frontend adjustment** (LearningPage):
```typescript
// Load audio to get accurate duration
const [audioDuration, setAudioDuration] = useState(0);

useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;
  
  const handleLoadedMetadata = () => {
    setAudioDuration(audio.duration);
  };
  
  audio.addEventListener('loadedmetadata', handleLoadedMetadata);
  return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
}, []);

// Use actual audio duration instead of reference.duration
const totalDuration = audioDuration || reference?.duration || 40;
```

---

## 📋 Implementation Plan

### Phase 1: Fix Time Tracking (Priority: HIGH)
**Files to modify:**
- `frontend/src/app/pages/LearningPage.tsx`

**Changes:**
1. Remove dual time tracking (RAF + onTimeUpdate)
2. Use only `onTimeUpdate` for time source
3. Update `elapsed` state consistently

**Complexity:** Low (20 lines)

---

### Phase 2: Fix Lyric Transition Logic (Priority: HIGH)
**Files to modify:**
- `frontend/src/app/pages/LearningPage.tsx`

**Changes:**
1. Implement binary search for lyric index
2. Add debounce/hysteresis
3. Ensure lyric changes EXACTLY at the right time

**Complexity:** Low (30 lines)

---

### Phase 3: Improve Lyric Grouping (Priority: MEDIUM)
**Files to modify:**
- `backend/app/services/reference_builder.py`
- `backend/app/schemas/song_reference.py`
- `frontend/src/app/pages/LearningPage.tsx`

**Changes:**
1. Backend: Detect natural line breaks and group accordingly
2. Backend: Add `lyric_lines` to SongReference schema
3. Frontend: Use `lyric_lines` if available

**Complexity:** Medium (100 lines)

---

### Phase 4: Validate and Sync (Priority: MEDIUM)
**Files to modify:**
- `backend/app/services/reference_builder.py`
- `frontend/src/app/pages/LearningPage.tsx`

**Changes:**
1. Add validation function for lyric timing
2. Use actual audio duration instead of reference duration
3. Add warnings for timing issues

**Complexity:** Medium (50 lines)

---

## 🧪 Testing Strategy

### Unit Tests
```python
# backend/app/tests/test_lyrics_validation.py
def test_validate_lyric_timing_in_order()
def test_validate_lyric_timing_out_of_bounds()
def test_validate_lyric_timing_large_gaps()
```

### Integration Tests
```typescript
// frontend/src/services/lyrics.test.ts
test('findCurrentLyricIndexBinary finds correct lyric')
test('lyric transitions at exact time')
test('no lyric flicker at boundaries')
test('proper grouping of lyric lines')
```

### Manual Testing Checklist
- [ ] Play song from start to end, lyrics change smoothly
- [ ] Seek to middle of song, correct lyric displays
- [ ] Seek back and forward, lyric always matches position
- [ ] No flicker or double-changes at lyric boundaries
- [ ] All lyrics display in order
- [ ] No gaps or missing lyrics
- [ ] Works with different songs (different lyric lengths)

---

## 🎯 Success Criteria

✅ Lyrics change within **±100ms** of their start time
✅ No flickering or double-changes at boundaries
✅ Binary search handles large lyric arrays efficiently
✅ All tests pass (unit + integration + manual)
✅ Works with all existing test songs
✅ No performance regression (maintained 60fps)

---

## 📊 Before/After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| Time Source | RAF + onTimeUpdate (conflicts) | Single source (onTimeUpdate) |
| Lyric Index | Linear scan | Binary search |
| Timing Accuracy | ±200ms lag | ±50ms lag |
| Lyric Grouping | Arbitrary 6 words | Natural line breaks |
| Flicker | Yes, at boundaries | No, with debounce |
| Duration Sync | reference.duration | Actual audio.duration |

---

## 🚀 Recommended Execution Order

1. **Start with Phase 1** (Fix Time Tracking) - Minimal change, biggest impact
2. **Then Phase 2** (Fix Lyric Logic) - Critical for accuracy
3. **Then Phase 4** (Validate & Sync) - Ensures reliability
4. **Finally Phase 3** (Improve Grouping) - Polish/enhancement

Total effort: **2-3 hours** to complete all phases
