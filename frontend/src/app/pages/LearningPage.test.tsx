import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LearningPage, displayTimeline } from "./LearningPage";
import { SongReference } from "../../types/songReference";
import { getReference } from "../../services/songService";

vi.mock("../components/MelodyCurve", () => ({
  MelodyCurve: () => <div data-testid="melody-curve" />,
}));

vi.mock("../../services/songService", () => ({
  getReference: vi.fn(),
}));

const baseReference: SongReference = {
  song_id: "song-1",
  title: "Reference Song",
  artist: "Reference Artist",
  language: "en",
  difficulty: "beginner",
  duration: 12,
  bpm: 120,
  key: "C Major",
  beats: [],
  pitch_data: [],
  lyrics: [],
  lyric_lines: [],
  rhythm_segments: [],
  sections: [],
  diagnostics: {
    processing_time_seconds: 1,
    alignment_quality: 1,
    pitch_coverage: 0,
    processed_at: "2026-05-31T00:00:00Z",
    processing_version: "2.0",
  },
};

describe("LearningPage lyric timeline", () => {
  beforeEach(() => {
    vi.mocked(getReference).mockReset();
  });

  it("renders sentence text from lyric_lines", async () => {
    vi.mocked(getReference).mockResolvedValue({
      ...baseReference,
      lyric_lines: [
        {
          index: 0,
          text: "Keep the punctuation, please.",
          words: [],
          start: 0,
          end: 3,
        },
        {
          index: 1,
          text: "Next sentence stays intact!",
          words: [],
          start: 3,
          end: 6,
        },
      ],
    });

    render(<LearningPage onNavigate={vi.fn()} songId="song-1" />);

    expect(await screen.findByText("Keep the punctuation, please.")).toBeInTheDocument();
    expect(screen.getByText("Next sentence stays intact!")).toBeInTheDocument();
  });

  it("renders rhythm segments when lyric_lines is empty", async () => {
    vi.mocked(getReference).mockResolvedValue({
      ...baseReference,
      lyric_lines: [],
      rhythm_segments: [
        { index: 0, text: "Beat 1", start: 0, end: 2, beat: 0 },
        { index: 1, text: "Beat 2", start: 2, end: 4, beat: 2 },
        { index: 2, text: "Beat 3", start: 4, end: 6, beat: 4 },
      ],
    });

    render(<LearningPage onNavigate={vi.fn()} songId="song-1" />);

    expect(await screen.findByLabelText("Rhythm timeline")).toBeInTheDocument();
    expect(screen.getByText("Beat 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Beat 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Beat 3")).toBeInTheDocument();
  });

  it("continues with rhythm fallback after the final lyric line", () => {
    const timeline = displayTimeline(
      {
        ...baseReference,
        lyric_lines: [
          { index: 0, text: "First line", words: [], start: 0, end: 3 },
          { index: 1, text: "Second line", words: [], start: 7, end: 10 },
        ],
        rhythm_segments: [
          { index: 0, text: "Beat 1", start: 0, end: 2, beat: 0 },
          { index: 1, text: "Beat 2", start: 2, end: 4, beat: 2 },
          { index: 2, text: "Beat 3", start: 4, end: 6, beat: 4 },
          { index: 3, text: "Beat 4", start: 6, end: 7, beat: 6 },
        ],
      },
      12
    );

    expect(timeline.map((item) => item.kind)).toEqual(["lyric", "rhythm", "rhythm", "rhythm", "lyric", "rhythm"]);
    expect(timeline.at(-1)?.end).toBe(12);
  });
});
