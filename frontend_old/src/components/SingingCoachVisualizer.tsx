/**
 * Singing Coach Visualizer Component
 * Main interface combining audio player, lyrics, melody curve, and coaching hints
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { SongReference } from "../types/songReference";
import { MelodyCurve } from "./MelodyCurve";
import { LyricsHighlighter } from "./LyricsHighlighter";
import { CoachingHint } from "./CoachingHint";

interface SingingCoachVisualizerProps {
  reference: SongReference;
  audioUrl: string;
}

export function SingingCoachVisualizer({
  reference,
  audioUrl,
}: SingingCoachVisualizerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const pitchStats = useMemo(() => {
    if (!reference.pitch_data.length) {
      return { min: 0, max: 0, mean: 0 };
    }
    const freqs = reference.pitch_data.map((p) => p.frequency);
    const sum = freqs.reduce((acc, v) => acc + v, 0);
    return {
      min: Math.min(...freqs),
      max: Math.max(...freqs),
      mean: sum / freqs.length,
    };
  }, [reference.pitch_data]);

  // Update current time as audio plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", () => setIsPlaying(true));
      audio.removeEventListener("pause", () => setIsPlaying(false));
    };
  }, []);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Audio Player */}
      <audio
        ref={audioRef}
        src={audioUrl}
        crossOrigin="anonymous"
        className="w-full"
      />

      {/* Mini Player (mobile) */}
      <div className="sm:hidden bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{reference.title}</p>
            <p className="truncate text-xs text-blue-200">{reference.artist}</p>
          </div>
          <button
            onClick={handlePlayPause}
            className="bg-white text-blue-600 rounded-full p-3 hover:bg-blue-50 transition-colors shadow-md"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="text-xs font-mono text-blue-100">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-blue-700 rounded appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>

      {/* Full Player */}
      <div className="hidden sm:block bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 shadow-lg">
        <div className="space-y-4">
          {/* Song Info */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              {reference.title}
            </h2>
            <p className="text-blue-100">{reference.artist}</p>
            <p className="text-sm text-blue-200 mt-1">BPM: {reference.bpm} • Key: {reference.key}</p>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePlayPause}
              className="bg-white text-blue-600 rounded-full p-4 hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg"
            >
              {isPlaying ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Time Display */}
            <div className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Seek Bar */}
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-blue-700 rounded appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>

      {/* Coaching Hint */}
      <CoachingHint
        pitchData={reference.pitch_data}
        currentTime={currentTime}
      />

      {/* Lyrics Display */}
      <LyricsHighlighter
        lyrics={reference.lyrics}
        currentTime={currentTime}
      />

      {/* Melody Curve Visualization */}
      <MelodyCurve
        pitchData={reference.pitch_data}
        currentTime={currentTime}
        duration={duration || reference.duration}
        beats={reference.beats}
      />

      {/* Playback Stats */}
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-800 p-4 sm:grid-cols-3">
        <div>
          <p className="text-slate-400 text-sm">Duration</p>
          <p className="text-white font-semibold">{formatTime(reference.duration)}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">BPM</p>
          <p className="text-white font-semibold">{Math.round(reference.bpm)}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Key</p>
          <p className="text-white font-semibold">{reference.key}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Pitch Min / Max</p>
          <p className="text-white font-semibold">
            {Math.round(pitchStats.min)} - {Math.round(pitchStats.max)} Hz
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Pitch Mean</p>
          <p className="text-white font-semibold">{Math.round(pitchStats.mean)} Hz</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Beat Count</p>
          <p className="text-white font-semibold">{reference.beats.length}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Words</p>
          <p className="text-white font-semibold">{reference.lyrics.length}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Alignment Quality</p>
          <p className="text-white font-semibold">
            {(reference.diagnostics.alignment_quality * 100).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Processing Time</p>
          <p className="text-white font-semibold">
            {reference.diagnostics.processing_time_seconds.toFixed(1)}s
          </p>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
