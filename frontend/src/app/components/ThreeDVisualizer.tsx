import { useEffect, useRef, useState } from "react";

interface ThreeDVisualizerProps {
  isPlaying?: boolean;
  color1?: string;
  color2?: string;
  reduceMotion?: boolean;
}

export function ThreeDVisualizer({
  isPlaying = true,
  color1 = "#9D5CFF",
  color2 = "#FF3CAC",
  reduceMotion = false,
}: ThreeDVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduceMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      setMouse({ x, y });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [reduceMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = containerRef.current?.clientWidth || 400;
    let height = canvas.height = 240;

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      width = canvas.width = containerRef.current.clientWidth;
      height = canvas.height = 240;
    };
    window.addEventListener("resize", handleResize);

    // 3D Particles Definition
    const numRows = 16;
    const numCols = 16;
    const particles: { x: number; y: number; z: number; baseHeight: number }[] = [];

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        // Center the coordinate grid around (0,0)
        const px = (c - numCols / 2) * 24;
        const pz = (r - numRows / 2) * 24;
        particles.push({
          x: px,
          y: 0,
          z: pz,
          baseHeight: 0,
        });
      }
    }

    let time = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += isPlaying ? (reduceMotion ? 0.01 : 0.03) : reduceMotion ? 0.002 : 0.005;

      // 3D rotation angles based on time and mouse coordinates
      const mx = reduceMotion ? 0 : mouse.x;
      const my = reduceMotion ? 0 : mouse.y;
      const angleX = 0.5 + my * 0.15;
      const angleY = time * 0.35 + mx * 0.25;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Camera focal length
      const f = 300;

      // Draw particle landscape
      particles.forEach((p) => {
        // Calculate height based on 3D distance and sine waves (ripple effect)
        const dist = Math.sqrt(p.x * p.x + p.z * p.z);
        p.y = Math.sin(dist * 0.04 - time * 2) * 20 * (isPlaying ? 1.5 : 0.4);

        // Apply Y rotation
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;

        // Apply X rotation
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Perspective Projection
        const zoom = 1.3;
        const screenX = (x1 * f) / (z2 + 350) * zoom + width / 2;
        const screenY = (y2 * f) / (z2 + 350) * zoom + height / 2 + 10;
        const scale = f / (z2 + 350);

        if (screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height) {
          // Glow effect size
          const radius = Math.max(1, scale * 3.5);

          // Color gradient based on particle depth (z2)
          ctx.beginPath();
          ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);

          // Neon gradient from color1 to color2
          const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius * 2);
          grad.addColorStop(0, color1);
          grad.addColorStop(0.5, color2);
          grad.addColorStop(1, "rgba(0,0,0,0)");

          ctx.fillStyle = grad;
          ctx.fill();
        }
      });

      // Draw connecting premium neon glowing grid lines (subtle overlay)
      ctx.strokeStyle = "rgba(157, 92, 255, 0.08)";
      ctx.lineWidth = 0.5;
      for (let r = 0; r < numRows; r++) {
        ctx.beginPath();
        for (let c = 0; c < numCols; c++) {
          const idx = r * numCols + c;
          const p = particles[idx];
          
          const dist = Math.sqrt(p.x * p.x + p.z * p.z);
          const y = Math.sin(dist * 0.04 - time * 2) * 20 * (isPlaying ? 1.5 : 0.4);

          const x1 = p.x * cosY - p.z * sinY;
          const z1 = p.x * sinY + p.z * cosY;
          const y2 = y * cosX - z1 * sinX;
          const z2 = y * sinX + z1 * cosX;

          const zoom = 1.3;
          const screenX = (x1 * f) / (z2 + 350) * zoom + width / 2;
          const screenY = (y2 * f) / (z2 + 350) * zoom + height / 2 + 10;

          if (c === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, mouse, color1, color2]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[240px] rounded-3xl overflow-hidden"
      style={{
        background: "radial-gradient(circle at center, rgba(26,20,48,0.4) 0%, rgba(11,15,26,0) 100%)",
        border: "1px solid rgba(157, 92, 255, 0.12)",
        backdropFilter: "blur(12px)",
      }}
      aria-hidden="true"
      role="presentation"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      {/* Visual Enhancers */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span style={{ color: "#7B7FA8", fontFamily: "'Space Grotesk', sans-serif" }} className="text-[10px] font-bold tracking-widest">
          3D AUDIO CORE ENGINE ACTIVE
        </span>
      </div>
    </div>
  );
}
