/**
 * Melody Curve Component
 * Visualizes pitch contour over time using MIDI notes
 */

import { useEffect, useRef, useMemo } from "react";
import { PitchDataPoint } from "../types/songReference";

interface MelodyCurveProps {
  pitchData: PitchDataPoint[];
  currentTime: number;
  duration: number;
  width?: number;
  height?: number;
}

export function MelodyCurve({
  pitchData,
  currentTime,
  duration,
  width = 800,
  height = 200,
}: MelodyCurveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padding = 40;

  // Calculate MIDI range for scaling
  const midiRange = useMemo(() => {
    if (pitchData.length === 0) return { min: 60, max: 72 };
    const midiValues = pitchData.map((p) => p.midi);
    const min = Math.min(...midiValues);
    const max = Math.max(...midiValues);
    // Add padding for visual comfort
    const padding = 2;
    return {
      min: Math.floor(min) - padding,
      max: Math.ceil(max) + padding,
    };
  }, [pitchData]);

  useEffect(() => {
    if (!canvasRef.current || pitchData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas
    ctx.fillStyle = "#0f172a"; // dark background
    ctx.fillRect(0, 0, width, height);

    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    // Draw grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;

    // Horizontal grid lines (MIDI notes)
    for (let midi = midiRange.min; midi <= midiRange.max; midi++) {
      const y = height - padding - ((midi - midiRange.min) / (midiRange.max - midiRange.min)) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Label every other note
      if (midi % 2 === 0) {
        ctx.fillStyle = "#64748b";
        ctx.font = "12px monospace";
        ctx.textAlign = "right";
        ctx.fillText(midiToNoteName(midi), padding - 5, y + 4);
      }
    }

    // Vertical grid lines (every 5 seconds)
    for (let t = 0; t <= duration; t += 5) {
      const x = padding + (t / duration) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();

      // Label
      ctx.fillStyle = "#64748b";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${t}s`, x, height - 10);
    }

    // Draw pitch curve
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    let firstPoint = true;
    for (const point of pitchData) {
      const x = padding + (point.timestamp / duration) * plotWidth;
      const y = height - padding - ((point.midi - midiRange.min) / (midiRange.max - midiRange.min)) * plotHeight;

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw playhead (current time)
    const playheadX = padding + (currentTime / duration) * plotWidth;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, padding);
    ctx.lineTo(playheadX, height - padding);
    ctx.stroke();

    // Playhead dot at current pitch
    const currentPitch = pitchData.find(
      (p) => Math.abs(p.timestamp - currentTime) < 0.1
    );
    if (currentPitch) {
      const dotY =
        height - padding - ((currentPitch.midi - midiRange.min) / (midiRange.max - midiRange.min)) * plotHeight;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(playheadX, dotY, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw axis labels
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Time (seconds)", width / 2, height - 5);

    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("MIDI Note", 0, 0);
    ctx.restore();
  }, [pitchData, currentTime, duration, midiRange, width, height]);

  return (
    <div className="w-full bg-slate-900 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-blue-300 mb-3">Melody Curve</h3>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full border border-slate-700 rounded"
      />
      <div className="mt-3 text-sm text-slate-400 text-center">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}

function midiToNoteName(midi: number): string {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  const note = notes[midi % 12];
  return `${note}${octave}`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
