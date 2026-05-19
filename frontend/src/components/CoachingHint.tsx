/**
 * Coaching Hint Component
 * Provides real-time guidance on pitch movement
 */

import { useMemo } from "react";
import { PitchDataPoint } from "../types/songReference";

interface CoachingHintProps {
  pitchData: PitchDataPoint[];
  currentTime: number;
  lookaheadSeconds?: number;
}

export function CoachingHint({
  pitchData,
  currentTime,
  lookaheadSeconds = 2,
}: CoachingHintProps) {
  const hint = useMemo(() => {
    // Find current note
    const currentIdx = pitchData.findIndex(
      (p) => Math.abs(p.timestamp - currentTime) < 0.15
    );

    if (currentIdx < 0 || currentIdx >= pitchData.length) {
      return {
        text: "Get ready to sing",
        icon: "🎤",
        color: "bg-slate-700",
      };
    }

    const currentNote = pitchData[currentIdx];
    const upcomingEnd = currentTime + lookaheadSeconds;

    // Find next note(s) within lookahead window
    const upcomingNotes = pitchData.filter(
      (p) => p.timestamp > currentTime && p.timestamp <= upcomingEnd
    );

    if (upcomingNotes.length === 0) {
      return {
        text: "Hold the note",
        icon: "➡️",
        color: "bg-blue-600",
      };
    }

    const nextNote = upcomingNotes[0];
    const midiDiff = nextNote.midi - currentNote.midi;

    // Determine direction and magnitude
    if (Math.abs(midiDiff) < 0.5) {
      return {
        text: "Keep the same pitch",
        icon: "➡️",
        color: "bg-blue-600",
      };
    } else if (midiDiff > 3) {
      return {
        text: "Raise your voice significantly",
        icon: "📈",
        color: "bg-yellow-600",
      };
    } else if (midiDiff > 0) {
      return {
        text: "Raise your voice",
        icon: "📈",
        color: "bg-blue-600",
      };
    } else if (midiDiff < -3) {
      return {
        text: "Lower your voice significantly",
        icon: "📉",
        color: "bg-orange-600",
      };
    } else {
      return {
        text: "Lower your voice",
        icon: "📉",
        color: "bg-blue-600",
      };
    }
  }, [pitchData, currentTime, lookaheadSeconds]);

  return (
    <div
      className={`${hint.color} rounded-lg p-6 transition-all duration-300 transform`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-slate-300 opacity-75">Next Move</p>
          <p className="text-2xl font-bold text-white">{hint.text}</p>
        </div>
        <div className="text-5xl">{hint.icon}</div>
      </div>

      {/* Tips section */}
      <div className="mt-4 pt-4 border-t border-white border-opacity-20 text-sm text-white opacity-75">
        <p>💡 <strong>Tip:</strong> Focus on smooth transitions between notes. Avoid sudden jumps.</p>
      </div>
    </div>
  );
}
