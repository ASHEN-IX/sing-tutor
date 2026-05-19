/**
 * Song Processing Page
 * Shows real-time processing status and transitions to preview when complete
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ProcessingProgress } from "../components/ProcessingProgress";

export default function SongProcessingPage() {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const shouldReduceMotion = useReducedMotion();

  if (!songId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="surface-card p-6 text-center">
          <p className="text-red-300 text-lg font-semibold">No song ID provided</p>
          <button
            onClick={() => navigate("/upload")}
            className="btn-primary mt-4"
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    // Redirect to preview page after completion
    setTimeout(() => {
      navigate(`/preview/${songId}`);
    }, 2000);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  return (
    <section className="page-container">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <motion.header
          initial={shouldReduceMotion ? false : { opacity: 0, y: -18 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-light mb-2">Processing Your Song</h1>
          <p className="text-soft">
            Our AI is analyzing your song. This typically takes 30-60 seconds.
          </p>
        </motion.header>

        {/* Processing Component */}
        <ProcessingProgress songId={songId} onComplete={handleComplete} onError={handleError} />

        {/* Error Display */}
        {error && (
          <div className="mt-6 max-w-2xl mx-auto rounded-lg border border-red-400/40 bg-red-500/10 p-6">
            <h3 className="font-semibold text-red-100 mb-2">Processing Error</h3>
            <p className="text-red-200">{error}</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => navigate(`/processing/${songId}`)}
                className="btn-primary"
              >
                Retry
              </button>
              <button
                onClick={() => navigate("/upload")}
                className="btn-secondary"
              >
                Upload Different Song
              </button>
            </div>
          </div>
        )}

        {/* Processing Tips */}
        <div className="surface-card mt-12 max-w-2xl mx-auto p-6">
          <h3 className="font-semibold text-primary mb-3">💡 Processing Tips</h3>
          <ul className="text-sm text-soft space-y-2">
            <li>
              • <strong>BPM Detection:</strong> We detect tempo with ±5-10 BPM accuracy. Complex
              rhythms may be slightly off.
            </li>
            <li>
              • <strong>Key Detection:</strong> Musical key is estimated from harmony. Results are
              best-effort, especially for polyphonic music.
            </li>
            <li>
              • <strong>Lyrics Alignment:</strong> Words are aligned using beat positions. Typical
              accuracy is ±50-200ms.
            </li>
            <li>
              • <strong>Pitch Extraction:</strong> We extract 10Hz resolution pitch data, sufficient
              for singing analysis.
            </li>
          </ul>
        </div>

        {/* Keep Processing Running Info */}
        <div className="mt-6 text-center text-sm text-soft">
          <p>Processing happens in the background. Feel free to navigate away and return later.</p>
        </div>
      </div>
    </section>
  );
}
