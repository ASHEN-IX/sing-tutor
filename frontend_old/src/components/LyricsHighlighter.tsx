/**
 * Lyrics Highlighter Component
 * Displays synchronized lyrics with current word highlighted
 */

import { useMemo } from "react";
import { LyricsWord } from "../types/songReference";

interface LyricsHighlighterProps {
  lyrics: LyricsWord[];
  currentTime: number;
}

export function LyricsHighlighter({
  lyrics,
  currentTime,
}: LyricsHighlighterProps) {
  // Find active word(s) at current time
  const activeWordIndices = useMemo(() => {
    return lyrics
      .map((word, idx) => ({
        idx,
        word,
        isActive: currentTime >= word.start && currentTime <= word.end,
      }))
      .filter((w) => w.isActive)
      .map((w) => w.idx);
  }, [currentTime, lyrics]);

  // Group lyrics into lines for display
  const lyricLines = useMemo(() => {
    const lines: LyricsWord[][] = [];
    let currentLine: LyricsWord[] = [];

    for (const word of lyrics) {
      currentLine.push(word);
      // Split into lines every ~10-15 words or based on timing gaps
      if (
        currentLine.length >= 12 ||
        (currentLine.length > 1 &&
          word.start - currentLine[currentLine.length - 2].end > 1.5)
      ) {
        lines.push(currentLine);
        currentLine = [];
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines;
  }, [lyrics]);

  const activeLineIndex = useMemo(() => {
    if (activeWordIndices.length === 0) return -1;
    const activeWordIdx = activeWordIndices[0];
    let running = 0;
    for (let i = 0; i < lyricLines.length; i++) {
      const lineLength = lyricLines[i].length;
      if (activeWordIdx >= running && activeWordIdx < running + lineLength) {
        return i;
      }
      running += lineLength;
    }
    return -1;
  }, [activeWordIndices, lyricLines]);

  return (
    <div className="w-full bg-slate-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-300 mb-4">Lyrics</h3>
      <div className="text-center space-y-4">
        {lyricLines.map((line, lineIdx) => (
          <div
            key={lineIdx}
            className={`text-3xl font-bold leading-relaxed flex flex-wrap justify-center gap-2 rounded-lg px-3 py-2 transition-colors ${
              lineIdx === activeLineIndex
                ? "bg-blue-500/15"
                : "bg-transparent"
            }`}
          >
            {line.map((word) => {
              const globalIdx = lyrics.indexOf(word);
              const isActive = activeWordIndices.includes(globalIdx);

              return (
                <span
                  key={globalIdx}
                  className={`px-2 py-1 rounded transition-all duration-100 ${
                    isActive
                      ? "bg-blue-500 text-white scale-110 shadow-lg"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {word.word}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* Karaoke timing bars per line */}
      <div className="mt-4 space-y-3">
        {lyricLines.map((line, lineIdx) => {
          const lineStart = line[0]?.start ?? 0;
          const lineEnd = line[line.length - 1]?.end ?? lineStart;
          const lineDuration = Math.max(lineEnd - lineStart, 0.001);
          const progress = Math.min(1, Math.max(0, (currentTime - lineStart) / lineDuration));
          const isLineActive = lineIdx === activeLineIndex;

          return (
            <div key={`bar-${lineIdx}`} className="mx-auto max-w-3xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Line {lineIdx + 1}</span>
                <span>{formatTime(lineStart)} - {formatTime(lineEnd)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-800">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isLineActive ? "bg-blue-500" : "bg-slate-600"
                  }`}
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Word timing info */}
      {activeWordIndices.length > 0 && lyrics[activeWordIndices[0]] && (
        <div className="mt-4 pt-4 border-t border-slate-700 text-center text-sm text-slate-400">
          <span className="font-semibold text-blue-300">
            {lyrics[activeWordIndices[0]].word}
          </span>
          {" • "}
          {formatTime(lyrics[activeWordIndices[0]].start)} -{" "}
          {formatTime(lyrics[activeWordIndices[0]].end)}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
