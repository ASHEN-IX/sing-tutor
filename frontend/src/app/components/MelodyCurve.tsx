import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

interface MelodyCurveProps {
  isPlaying?: boolean;
  userPitch?: number[];
  height?: number;
  showUserOverlay?: boolean;
  color?: string;
}

const referencePitches = [
  50, 52, 55, 60, 62, 65, 62, 58, 55, 52, 50, 48, 50, 55, 60, 65,
  70, 68, 65, 60, 58, 55, 52, 55, 58, 62, 65, 68, 70, 68, 65, 60,
  55, 52, 50, 48, 45, 48, 50, 52, 55, 58, 60, 62, 65, 62, 58, 55,
];

function normalize(values: number[], min = 35, max = 80, height = 120) {
  return values.map((v) => height - ((v - min) / (max - min)) * (height * 0.8) - height * 0.1);
}

function buildPath(ys: number[], width: number) {
  const step = width / (ys.length - 1);
  let d = `M 0 ${ys[0]}`;
  for (let i = 1; i < ys.length; i++) {
    const x = i * step;
    const cpx = (i - 0.5) * step;
    d += ` Q ${cpx} ${ys[i - 1]} ${x} ${ys[i]}`;
  }
  return d;
}

export function MelodyCurve({
  isPlaying = false,
  userPitch,
  height = 140,
  showUserOverlay = false,
  color = "#9D5CFF",
}: MelodyCurveProps) {
  const [playhead, setPlayhead] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const duration = 8000;

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      setPlayhead(0);
      return;
    }
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startRef.current) % duration;
      setPlayhead(elapsed / duration);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  const width = 800;
  const refYs = normalize(referencePitches, 35, 80, height);
  const refPath = buildPath(refYs, width);

  const userYs = userPitch ? normalize(userPitch, 35, 80, height) : [];
  const userPath = userYs.length > 1 ? buildPath(userYs, (width * userYs.length) / referencePitches.length) : "";

  const playheadX = playhead * width;
  const playheadIdx = Math.floor(playhead * (refYs.length - 1));
  const playheadY = refYs[playheadIdx] ?? height / 2;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height }}>
      {/* Background glow */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(157,92,255,0.05) 0%, rgba(11,15,26,0) 100%)",
        }}
      />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9D5CFF" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#FF3CAC" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#3CFFA0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="played">
            <rect x="0" y="0" width={playheadX} height={height} />
          </clipPath>
          <clipPath id="unplayed">
            <rect x={playheadX} y="0" width={width - playheadX} height={height} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y * height}
            x2={width}
            y2={y * height}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Unplayed curve (dim) */}
        <path
          d={refPath}
          fill="none"
          stroke="url(#curveGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.35"
          clipPath="url(#unplayed)"
        />

        {/* Played curve (bright, glowing) */}
        <path
          d={refPath}
          fill="none"
          stroke="url(#curveGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#glow)"
          clipPath="url(#played)"
        />

        {/* User pitch overlay */}
        {showUserOverlay && userPath && (
          <path
            d={userPath}
            fill="none"
            stroke="url(#userGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
            filter="url(#glow)"
          />
        )}

        {/* Playhead */}
        {isPlaying && (
          <>
            <line
              x1={playheadX}
              y1="0"
              x2={playheadX}
              y2={height}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <circle
              cx={playheadX}
              cy={playheadY}
              r="6"
              fill="#ffffff"
              filter="url(#glow)"
            />
            <circle
              cx={playheadX}
              cy={playheadY}
              r="3"
              fill={color}
            />
          </>
        )}
      </svg>
    </div>
  );
}
