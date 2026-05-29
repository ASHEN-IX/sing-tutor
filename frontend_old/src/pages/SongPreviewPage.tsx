/**
 * Song Preview Page
 * Displays the processed song reference with all analysis results
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { getReference, deleteSong } from "../services/songService";
import { ReferencePreview } from "../components/ReferencePreview";
import { SongReference } from "../types/songReference";

export default function SongPreviewPage() {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const [reference, setReference] = useState<SongReference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const loadReference = async () => {
      try {
        if (!songId) {
          setError("No song ID provided");
          return;
        }

        const ref = await getReference(songId);
        setReference(ref);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load song reference";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadReference();
  }, [songId]);

  const handleDelete = async () => {
    if (!songId || !confirm("Are you sure you want to delete this song? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSong(songId);
      // Redirect to upload page
      navigate("/upload");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete song";
      setError(errorMessage);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 font-semibold text-soft">Loading song reference...</p>
        </div>
      </div>
    );
  }

  if (error && !reference) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-300 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-light mb-2">Error Loading Song</h2>
          <p className="text-soft mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/upload")}
              className="btn-primary"
            >
              Go to Upload
            </button>
            <button
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reference) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-soft">No song data available</p>
      </div>
    );
  }

  return (
    <section className="page-container">
      {/* Top Navigation */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -16 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        className="mx-auto mb-6 flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center"
      >
        <button
          onClick={() => navigate("/upload")}
          className="btn-secondary"
        >
          ← Upload Another Song
        </button>

        <h1 className="flex-1 text-center text-2xl font-bold text-light">Song Reference</h1>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/songs")}
            className="btn-secondary"
          >
            View Library
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="touch-target rounded-xl bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-400 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="mx-auto mb-6 max-w-6xl rounded-lg border border-red-400/40 bg-red-500/10 p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Reference Preview */}
      <ReferencePreview
        reference={reference}
        onEdit={() => {
          // Edit functionality would go here
          alert("Edit functionality coming soon!");
        }}
      />

      {/* Download / Export Section */}
      <div className="mx-auto mt-12 mb-8 max-w-6xl">
        <div className="surface-card p-6">
          <h2 className="text-2xl font-bold text-light mb-4">Export & Share</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const json = JSON.stringify(reference, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${reference.song_id}-reference.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
               className="tilt-card rounded-lg border-2 border-primary/30 p-4 text-center transition-colors hover:border-primary/60"
             >
               <div className="text-2xl mb-2">📥</div>
               <p className="font-semibold text-light">Download JSON</p>
               <p className="text-sm text-soft">Export as JSON file</p>
             </button>

            <button
              onClick={() => {
                const csv = [
                  "Word,Start (s),End (s)",
                  ...reference.lyrics.map((w) => `"${w.word}",${w.start},${w.end}`),
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${reference.song_id}-lyrics.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
               className="tilt-card rounded-lg border-2 border-emerald-300/30 p-4 text-center transition-colors hover:border-emerald-300/60"
             >
               <div className="text-2xl mb-2">📄</div>
               <p className="font-semibold text-light">Export Lyrics</p>
               <p className="text-sm text-soft">CSV format with timings</p>
             </button>

            <button
              onClick={() => {
                const csv = [
                  "Timestamp (s),Frequency (Hz),Confidence",
                  ...reference.pitch_data.map((p) => `${p.timestamp},${p.frequency},${p.confidence}`),
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${reference.song_id}-pitch.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
               className="tilt-card rounded-lg border-2 border-secondary/30 p-4 text-center transition-colors hover:border-secondary/60"
             >
               <div className="text-2xl mb-2">🎵</div>
               <p className="font-semibold text-light">Export Pitch Data</p>
               <p className="text-sm text-soft">CSV format with F0 contour</p>
             </button>
          </div>
        </div>
      </div>

      {/* Song ID Footer */}
      <div className="mx-auto max-w-6xl text-center text-xs text-soft">
        <p>
          Song ID: <code className="rounded bg-dark/70 px-2 py-1">{reference.song_id}</code>
        </p>
      </div>
    </section>
  );
}
