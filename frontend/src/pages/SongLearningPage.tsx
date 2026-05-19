/**
 * Song Learning Page
 * Displays the interactive learning interface for a song
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SingingCoachVisualizer } from "../components/SingingCoachVisualizer";
import { SongReference } from "../types/songReference";

export default function SongLearningPage() {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const [reference, setReference] = useState<SongReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!songId) {
      setError("Song ID not found");
      setLoading(false);
      return;
    }

    const loadReference = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/songs/${songId}/reference`
        );

        if (!response.ok) {
          throw new Error(`Failed to load reference: ${response.statusText}`);
        }

        const data = await response.json();
        setReference(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reference");
      } finally {
        setLoading(false);
      }
    };

    loadReference();
  }, [songId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-soft">Loading reference...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark to-gray-900 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-6">
            <h2 className="text-xl font-bold text-white mb-2">Error</h2>
            <p className="mb-4 text-red-200">{error}</p>
            <button
              onClick={() => navigate("/upload")}
              className="btn-primary"
            >
              Upload New Song
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reference) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark to-gray-900 flex items-center justify-center">
        <p className="text-soft">No reference found</p>
      </div>
    );
  }

  const audioUrl = `http://localhost:8000/songs/${songId}/original.mp3`;

  return (
    <section className="page-container">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.header
          initial={shouldReduceMotion ? false : { opacity: 0, y: -18 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <button
            onClick={() => navigate(-1)}
            className="touch-target mb-4 inline-flex items-center justify-center rounded-md px-3 text-primary transition-colors hover:text-secondary"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            {reference.title}
          </h1>
          <p className="text-soft">by {reference.artist}</p>
          <p className="mt-2 text-sm text-soft">Learn the melody</p>
        </motion.header>

        {/* Main Visualizer */}
        <SingingCoachVisualizer
          reference={reference}
          audioUrl={audioUrl}
        />

        {/* Tips Section */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="surface-card tilt-card p-6"
          >
            <h2 className="mb-3 text-lg font-semibold text-primary">
              📚 How to Use
            </h2>
            <ul className="space-y-2 text-sm text-soft">
              <li>• Press play to start the song</li>
              <li>• Watch the lyrics highlight in real time</li>
              <li>• Follow the melody curve on the chart</li>
              <li>• Read coaching hints for pitch guidance</li>
              <li>• Practice singing along multiple times</li>
            </ul>
          </motion.article>

          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: 0.06 }}
            className="surface-card tilt-card p-6"
          >
            <h2 className="mb-3 text-lg font-semibold text-primary">
              💡 Tips for Learning
            </h2>
            <ul className="space-y-2 text-sm text-soft">
              <li>• Start slowly, increase speed gradually</li>
              <li>• Focus on the rising/falling curve patterns</li>
              <li>• Repeat sections you struggle with</li>
              <li>• Use headphones for better pitch feedback</li>
              <li>• Record yourself to compare later</li>
            </ul>
          </motion.article>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={() => navigate("/upload")}
            className="btn-primary"
          >
            Upload Another Song
          </button>
          <button
            onClick={() => navigate("/preview/" + songId)}
            className="btn-secondary"
          >
            View Reference Data
          </button>
        </div>
      </div>
    </section>
  );
}
