/**
 * Processing Progress Component
 * Shows real-time processing status and progress
 */

import { useEffect, useState } from "react";
import { getProcessingStatus } from "../services/songService";
import { ProcessingStatus } from "../types/songReference";
import { motion, useReducedMotion } from "framer-motion";

interface ProcessingProgressProps {
  songId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
  pollInterval?: number;
}

export function ProcessingProgress({
  songId,
  onComplete,
  onError,
  pollInterval = 1000,
}: ProcessingProgressProps) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const getStatusMessage = (status: ProcessingStatus): string => {
    switch (status.status) {
      case "pending":
        return "Waiting to process...";
      case "processing":
        return status.message || "Processing...";
      case "completed":
        return "Processing completed!";
      case "failed":
        return `Processing failed: ${status.error || "Unknown error"}`;
      default:
        return "Unknown status";
    }
  };

  const getProgressPercentage = (status: ProcessingStatus): number => {
    if (status.status === "completed") return 100;
    if (status.status === "failed") return 0;
    return Math.round((status.progress || 0) * 100);
  };

  useEffect(() => {
    if (!isPolling) return;

    const pollStatus = async () => {
      try {
        const currentStatus = await getProcessingStatus(songId);
        setStatus(currentStatus);

        if (currentStatus.status === "completed") {
          setIsPolling(false);
          onComplete?.();
        } else if (currentStatus.status === "failed") {
          setIsPolling(false);
          onError?.(currentStatus.error || "Processing failed");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to check status";
        onError?.(errorMessage);
        setIsPolling(false);
      }
    };

    // Poll immediately, then set interval
    pollStatus();
    const interval = setInterval(pollStatus, pollInterval);

    return () => clearInterval(interval);
  }, [songId, pollInterval, isPolling, onComplete, onError]);

  if (!status) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <span className="ml-3 text-soft">Loading status...</span>
      </div>
    );
  }

  const progressPercent = getProgressPercentage(status);
  const statusMessage = getStatusMessage(status);

  return (
    <div className="surface-card mx-auto max-w-2xl p-6">
      <h2 className="text-2xl font-bold mb-4 text-light">Processing Status</h2>

      {/* Status Badge */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className={`px-4 py-2 rounded-full font-semibold text-white ${
            status.status === "completed"
              ? "bg-emerald-500"
              : status.status === "failed"
                ? "bg-red-500"
                : status.status === "processing"
                  ? "bg-primary"
                  : "bg-gray-500"
          }`}
        >
          {status.status.toUpperCase()}
        </div>
        {status.status === "processing" && (
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
        )}
      </div>

      {/* Status Message */}
      <p className="mb-6 text-lg text-soft">{statusMessage}</p>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-soft">Progress</span>
          <span className="text-sm font-semibold text-light">{progressPercent}%</span>
        </div>
        <div className="w-full bg-dark/80 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={shouldReduceMotion ? false : { width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-3 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Processing Steps */}
      <div className="border-t border-primary/20 pt-6">
        <h3 className="mb-4 font-semibold text-light">Processing Steps</h3>
        <div className="space-y-3">
          {[
            { name: "Upload Verification", progress: 10 },
            { name: "Audio Analysis", progress: 35 },
            { name: "Beat Detection", progress: 50 },
            { name: "Melody Extraction", progress: 70 },
            { name: "Lyrics Alignment", progress: 85 },
            { name: "Reference Generation", progress: 100 },
          ].map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white ${
                  progressPercent >= step.progress
                    ? "bg-emerald-500"
                    : progressPercent > step.progress - 20
                      ? "bg-primary"
                      : "bg-gray-500"
                }`}
              >
                {progressPercent > step.progress ? "✓" : "○"}
              </div>
              <span className="text-soft">{step.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Details */}
      {status.status === "failed" && status.error && (
        <div className="mt-6 rounded-md border border-red-400/40 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">
            <span className="font-semibold">Error Details:</span>
            <br />
            {status.error}
          </p>
        </div>
      )}

      {/* Song ID */}
      <div className="mt-6 rounded-md border border-primary/20 bg-dark/50 p-4">
        <p className="text-xs text-soft">
          <span className="font-semibold">Song ID:</span> {songId}
        </p>
      </div>
    </div>
  );
}
