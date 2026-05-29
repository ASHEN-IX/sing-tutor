# 🟢 Sprint 3 — Performance Comparison Engine

## 🎯 Sprint Objective

Build the engine that compares a user's singing performance against the processed reference song generated in Sprint 2.

This sprint transforms raw vocal analysis into measurable singing evaluation.

The system should objectively determine:

* How accurate the singer's pitch is
* Whether the singer sang at the correct time
* Whether notes were held correctly
* How stable the voice was
* Which sections were good or problematic

---

# 🧠 What We Are Building

A complete performance evaluation pipeline that:
oa
1. Loads the reference song blueprint
2. Loads the user's singing analysis
3. Aligns both sequences in time
4. Compares pitch and timing
5. Generates detailed metrics
6. Scores each segment
7. Produces structured feedback data

This becomes the core intelligence layer of the platform.

---

# 🏗️ Core Features

## ✅ Pitch Alignment

Align the user's pitch contour to the reference melody.

## ✅ Timing Comparison

Measure whether the user starts and ends notes at the correct moments.

## ✅ Note Matching

Determine whether the sung notes correspond to the expected notes.

## ✅ Segment Scoring

Score phrases, lyrics, and song sections independently.

## ✅ Performance Metrics

Generate objective singing quality scores.

---

# 📥 Inputs

## 1. Reference Song Blueprint

Generated in Sprint 2.

Example:

```json
{
  "song_id": "song_001",
  "pitch_data": [
    {
      "timestamp": 0.52,
      "frequency": 440.0,
      "midi": 69
    }
  ],
  "lyrics": [
    {
      "word": "love",
      "start": 33.8,
      "end": 34.4
    }
  ]
}
```

---

## 2. User Singing Analysis

Generated in Sprint 1.

Example:

```json
{
  "recording_id": "rec_001",
  "pitch_data": [
    {
      "timestamp": 0.53,
      "frequency": 435.0,
      "midi": 68.8
    }
  ]
}
```

---

# 📤 Outputs

## Performance Report

```json
{
  "overall_score": 87.2,
  "pitch_accuracy": 91.5,
  "timing_accuracy": 82.4,
  "stability_score": 79.1,
  "segments": [
    {
      "start": 30.0,
      "end": 40.0,
      "score": 92.3
    }
  ]
}
```

---

# 🧠 Theoretical Concepts Used

## Music Information Retrieval

* Melody comparison
* Note alignment

## Digital Signal Processing

* Pitch contour analysis
* Smoothing

## Dynamic Time Warping (DTW)

* Sequence alignment

## Statistical Analysis

* Mean error
* Variance
* Stability estimation

---

# 🏗️ System Architecture

```text
User Recording
       │
       ▼
Pitch Extraction
       │
       ▼
Reference Loader
       │
       ▼
Sequence Alignment
       │
       ▼
Pitch Comparison
       │
       ▼
Timing Analysis
       │
       ▼
Metric Calculation
       │
       ▼
Segment Scoring
       │
       ▼
Final Performance Report
```

---

# 📁 Backend Architecture

```text
backend/app/
├── api/
│   └── comparison.py
│
├── services/
│   ├── reference_loader.py
│   ├── pitch_aligner.py
│   ├── timing_analyzer.py
│   ├── note_matcher.py
│   ├── stability_analyzer.py
│   ├── segment_scorer.py
│   └── performance_report_builder.py
│
├── schemas/
│   └── comparison.py
│
└── utils/
    ├── midi.py
    └── smoothing.py
```

---

# ⚙️ Main Processing Pipeline

## Step 1 — Load Reference Data

Load:

* melody contour
* lyric timestamps
* BPM
* section markers

---

## Step 2 — Load User Recording Analysis

Load:

* detected pitches
* timestamps
* confidence scores

---

## Step 3 — Normalize Data

Convert all frequencies to MIDI note values.

Formula:

```math
n = 69 + 12 \log_2(f / 440)
```

This allows consistent musical comparison.

---

# 🎵 Step 4 — Pitch Alignment

## Problem

The user may sing:

* slightly slower
* slightly faster
* with pauses

Direct timestamp comparison will fail.

---

## Solution — Dynamic Time Warping (DTW)

DTW aligns:

* reference pitch sequence
* user pitch sequence

even if timing differs.

---

## Example

Reference:

```text
69 → 71 → 72 → 74
```

User:

```text
69 → 70 → 71 → 72 → 74
```

DTW finds the optimal alignment path.

---

# 📊 Step 5 — Pitch Accuracy Calculation

## Goal

Measure how close the user is to the target notes.

---

## Formula

```math
error = |reference_midi - user_midi|
```

Convert error into score:

```math
score = max(0, 100 - error * 10)
```

---

# ⏱️ Step 6 — Timing Accuracy

## Goal

Determine whether notes are sung at the correct moments.

---

## Metrics

* note start offset
* note end offset
* average delay

---

## Example

Reference:

```text
Start at 10.0s
```

User:

```text
Starts at 10.3s
```

Timing offset:

```text
+0.3 seconds
```

---

# 📈 Step 7 — Stability Analysis

## Goal

Measure vocal steadiness.

---

## Detect

* unstable pitch jumps
* shaking
* inconsistent sustain

---

## Technique

Calculate variance of pitch over sustained notes.

Lower variance = more stable singing.

---

# 🎼 Step 8 — Segment Scoring

Divide the song into:

* verses
* choruses
* lyric phrases

Generate local scores.

Example:

```json
{
  "segment": "Verse 1",
  "pitch_accuracy": 88,
  "timing_accuracy": 79
}
```

---

# 🧠 Step 9 — Final Score Calculation

Weighted scoring example:

```text
Overall Score =
40% Pitch Accuracy
30% Timing Accuracy
20% Stability
10% Confidence
```

---

# 🌐 API Endpoints

---

## POST `/api/comparison/analyze`

### Request

```json
{
  "song_id": "song_001",
  "recording_id": "rec_001"
}
```

---

### Response

```json
{
  "overall_score": 87.2,
  "pitch_accuracy": 91.5,
  "timing_accuracy": 82.4,
  "stability_score": 79.1
}
```

---

## GET `/api/comparison/{recording_id}`

Returns full comparison report.

---

# 📁 Frontend Architecture

```text
frontend/src/
├── pages/
│   └── ResultsPage.tsx
│
├── components/
│   ├── PerformanceSummary.tsx
│   ├── AccuracyMeter.tsx
│   ├── SegmentBreakdown.tsx
│   ├── MelodyComparison.tsx
│   └── TimingAnalysis.tsx
│
├── services/
│   └── comparisonService.ts
│
└── types/
    └── comparison.ts
```

---

# 🎨 Frontend Visualizations

## Melody Overlay

Display:

* reference melody
* user melody

on the same graph.

---

## Timing Markers

Show:

* early singing
* late singing
* aligned sections

---

## Segment Heatmap

Color-code:

* good segments
* weak segments

---

# 📊 Metrics to Display

## Main Metrics

* Overall Score
* Pitch Accuracy
* Timing Accuracy
* Stability Score

---

## Advanced Metrics

* Average cents deviation
* Maximum delay
* Longest stable note
* Most problematic phrase

---

# 🧪 Testing Requirements

## Unit Tests

Test:

* DTW alignment
* pitch scoring
* timing analysis
* stability calculations

---

## Integration Tests

Test:

* full comparison pipeline
* API responses
* edge cases

---

# ⚠️ Edge Cases

Handle:

* silence
* noisy audio
* missing pitches
* extremely off-key singing
* incomplete recordings

---

# 🚀 Sprint Deliverables

## Backend

* Full comparison pipeline
* Scoring services
* REST endpoints

## Frontend

* Results dashboard
* Comparison visualizations
* Performance metrics

## Documentation

* API contract
* Scoring methodology
* Testing instructions

---

# 🏁 Expected Outcome

At the end of Sprint 3, the system will be able to:

✅ Compare singing performances to reference songs
✅ Measure pitch and timing accuracy
✅ Detect unstable singing
✅ Score different song segments
✅ Generate objective performance reports
✅ Power future intelligent coaching features

This sprint transforms the project from a visualization platform into a true AI singing evaluation system.
