/**
 * Reference Preview Component
 * Displays song reference data with visualizations
 */

import { useMemo } from "react";
import { SongReference, LyricsWord } from "../types/songReference";

interface ReferencePreviewProps {
  reference: SongReference;
  onEdit?: () => void;
}

export function ReferencePreview({ reference, onEdit }: ReferencePreviewProps) {
  const safePitchData = useMemo(() => reference?.pitch_data ?? [], [reference?.pitch_data]);
  const safeLyrics = useMemo(() => reference?.lyrics ?? [], [reference?.lyrics]);

  const frequencyStats = useMemo(() => {
    if (safePitchData.length === 0) {
      return { min: 0, max: 0, mean: 0 };
    }
    const frequencies = safePitchData.map((p) => p.frequency);
    return {
      min: Math.min(...frequencies),
      max: Math.max(...frequencies),
      mean: frequencies.reduce((a, b) => a + b) / frequencies.length,
    };
  }, [safePitchData]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const lyricsLines = useMemo(() => {
    const lines: LyricsWord[][] = [];
    let currentLine: LyricsWord[] = [];

    safeLyrics.forEach((word, index) => {
      currentLine.push(word);
      if (currentLine.length >= 15 || index === safeLyrics.length - 1) {
        lines.push(currentLine);
        currentLine = [];
      }
    });

    return lines;
  }, [safeLyrics]);

  if (!reference || !reference.lyrics || !reference.pitch_data) {
    return (
      <div className="rounded-lg border border-yellow-400/40 bg-yellow-500/10 p-6">
        <p className="text-yellow-100">Loading reference data...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-light sm:text-4xl">{reference.title}</h1>
            <p className="text-lg text-soft">{reference.artist}</p>
          </div>
          <button onClick={onEdit} className="btn-secondary">
            Edit Metadata
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-soft sm:grid-cols-4">
          <div>
            <p className="text-sm opacity-75">Language</p>
            <p className="text-lg font-semibold text-light">{reference.language.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Difficulty</p>
            <p className="text-lg font-semibold capitalize text-light">{reference.difficulty}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Duration</p>
            <p className="text-lg font-semibold text-light">{formatTime(reference.duration)}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Processed At</p>
            <p className="text-lg font-semibold text-light">
              {new Date(reference.diagnostics.processed_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="surface-card p-6">
          <h2 className="mb-2 text-lg font-semibold text-light">Tempo</h2>
          <p className="text-3xl font-bold text-primary">{Math.round(reference.bpm)} BPM</p>
          <p className="mt-2 text-sm text-soft">Beats per minute</p>
        </article>
        <article className="surface-card p-6">
          <h2 className="mb-2 text-lg font-semibold text-light">Musical Key</h2>
          <p className="text-3xl font-bold text-secondary">{reference.key}</p>
          <p className="mt-2 text-sm text-soft">Estimated key</p>
        </article>
        <article className="surface-card p-6">
          <h2 className="mb-2 text-lg font-semibold text-light">Alignment Quality</h2>
          <p className="text-3xl font-bold text-primary">
            {Math.round(reference.diagnostics.alignment_quality * 100)}%
          </p>
          <p className="mt-2 text-sm text-soft">Lyrics-audio alignment</p>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Beat Positions", value: reference.beats.length },
          { label: "Pitch Samples", value: reference.pitch_data.length },
          { label: "Words", value: reference.lyrics.length },
          { label: "Sections", value: reference.sections.length },
        ].map((item) => (
          <article key={item.label} className="surface-card p-4">
            <p className="text-sm text-soft">{item.label}</p>
            <p className="text-2xl font-bold text-light">{item.value}</p>
          </article>
        ))}
      </section>

      {reference.pitch_data.length > 0 && (
        <section className="surface-card p-6">
          <h2 className="mb-4 text-2xl font-bold text-light">Pitch Analysis</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-soft">Min Frequency</p>
              <p className="text-2xl font-semibold text-light">{Math.round(frequencyStats.min)} Hz</p>
            </div>
            <div>
              <p className="text-sm text-soft">Mean Frequency</p>
              <p className="text-2xl font-semibold text-light">
                {Math.round(frequencyStats.mean)} Hz
              </p>
            </div>
            <div>
              <p className="text-sm text-soft">Max Frequency</p>
              <p className="text-2xl font-semibold text-light">{Math.round(frequencyStats.max)} Hz</p>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-primary/20 bg-dark/50 p-4">
            <p className="mb-3 text-xs text-soft">Pitch contour (first 20 samples)</p>
            <div className="flex h-32 items-end gap-1">
              {reference.pitch_data.slice(0, 20).map((sample, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t bg-gradient-to-t from-primary to-secondary opacity-80 transition-opacity hover:opacity-100"
                  style={{
                    height: `${
                      ((sample.frequency - frequencyStats.min) /
                        (frequencyStats.max - frequencyStats.min || 1)) *
                      100
                    }%`,
                    minHeight: "2px",
                  }}
                  title={`${sample.frequency.toFixed(1)} Hz @ ${sample.timestamp.toFixed(2)}s`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {reference.sections.length > 0 && (
        <section className="surface-card p-6">
          <h2 className="mb-4 text-2xl font-bold text-light">Song Structure</h2>
          <div className="space-y-3">
            {reference.sections.map((section, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32">
                  <p className="font-semibold text-light">{section.name}</p>
                  <p className="text-xs capitalize text-soft">{section.section_type}</p>
                </div>
                <div className="h-2 flex-1 rounded-full bg-dark/80">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary"
                    style={{
                      width: `${((section.end - section.start) / reference.duration) * 100}%`,
                    }}
                  />
                </div>
                <div className="w-24 text-right">
                  <p className="text-sm font-mono text-soft">
                    {formatTime(section.start)} - {formatTime(section.end)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {reference.lyrics.length > 0 && (
        <section className="surface-card p-6">
          <h2 className="mb-4 text-2xl font-bold text-light">Lyrics Preview</h2>
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {lyricsLines.map((line, lineIndex) => (
              <div key={lineIndex} className="rounded border border-primary/20 bg-dark/50 p-3">
                <p className="flex flex-wrap gap-2 leading-relaxed text-light">
                  {line.map((word, wordIndex) => (
                    <span
                      key={wordIndex}
                      className="inline-block rounded bg-primary/15 px-2 py-1 text-sm text-primary"
                      title={`${formatTime(word.start)} - ${formatTime(word.end)}`}
                    >
                      {word.word}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="surface-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-light">Processing Diagnostics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-soft">Processing Time</p>
            <p className="font-semibold text-light">
              {reference.diagnostics.processing_time_seconds.toFixed(2)}s
            </p>
          </div>
          <div>
            <p className="text-soft">Alignment Quality</p>
            <p className="font-semibold text-light">
              {(reference.diagnostics.alignment_quality * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-soft">Pitch Coverage</p>
            <p className="font-semibold text-light">
              {(reference.diagnostics.pitch_coverage * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-soft">Version</p>
            <p className="font-semibold text-light">{reference.diagnostics.processing_version}</p>
          </div>
        </div>
      </section>

      <details className="rounded-lg border border-primary/20 bg-dark/70 p-6 font-mono text-xs text-gray-100">
        <summary className="cursor-pointer font-semibold mb-3 hover:text-primary">View Raw JSON</summary>
        <pre className="max-h-96 overflow-x-auto overflow-y-auto">{JSON.stringify(reference, null, 2)}</pre>
      </details>
    </div>
  );
}
