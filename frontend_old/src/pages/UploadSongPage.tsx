/**
 * Upload Song Page
 * Main page for uploading new songs
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SongUploadForm } from "../components/SongUploadForm";
import { SongUploadResponse } from "../types/songReference";

export default function UploadSongPage() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const shouldReduceMotion = useReducedMotion();

  const handleUploadComplete = (response: SongUploadResponse) => {
    setSuccessMessage(`Song "${response.title}" uploaded successfully!`);
    setErrorMessage("");

    // Redirect to processing page after 2 seconds
    setTimeout(() => {
      navigate(`/processing/${response.song_id}`);
    }, 2000);
  };

  const handleError = (error: string) => {
    setErrorMessage(error);
    setSuccessMessage("");
  };

  return (
    <section aria-labelledby="upload-title" className="page-container">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <motion.header
          initial={shouldReduceMotion ? false : { opacity: 0, y: -14 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 id="upload-title" className="text-4xl font-bold text-light sm:text-5xl mb-4">
            Add a New Song
          </h1>
          <p className="text-soft text-base sm:text-xl max-w-3xl mx-auto">
            Upload a song audio file and lyrics to create a reference for comparing performances.
            Our AI will analyze the melody, rhythm, and lyrics to build a comprehensive singing guide.
          </p>
        </motion.header>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-4">
            <p className="font-semibold text-emerald-100">✓ {successMessage}</p>
            <p className="text-sm mt-1 text-emerald-200">Redirecting to processing page...</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-400/40 bg-red-500/10 p-4">
            <p className="font-semibold text-red-100">✗ Error</p>
            <p className="text-red-200">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage("")}
              className="touch-target mt-2 text-sm text-red-200 hover:text-red-100 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload Form */}
        <SongUploadForm onUploadComplete={handleUploadComplete} onError={handleError} />

        {/* Help Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="surface-card tilt-card p-6"
          >
            <div className="text-3xl mb-3">🎵</div>
            <h2 className="text-lg font-semibold text-light mb-2">Supported Formats</h2>
            <ul className="text-sm text-soft space-y-1">
              <li>• Audio: .mp3, .wav, .m4a, .ogg</li>
              <li>• Lyrics: .txt, .lrc</li>
              <li>• Max 100MB audio, 1MB lyrics</li>
            </ul>
          </motion.article>

          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.05 }}
            className="surface-card tilt-card p-6"
          >
            <div className="text-3xl mb-3">⚙️</div>
            <h2 className="text-lg font-semibold text-light mb-2">Processing</h2>
            <p className="text-sm text-soft">
              Our system will analyze your song and generate a reference guide in 30-60 seconds.
              This includes melody detection, beat analysis, and lyrics alignment.
            </p>
          </motion.article>

          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.1 }}
            className="surface-card tilt-card p-6"
          >
            <div className="text-3xl mb-3">📊</div>
            <h2 className="text-lg font-semibold text-light mb-2">Use Cases</h2>
            <p className="text-sm text-soft">
              Perfect for creating singing lesson materials, karaoke tracks, or building a song
              library for voice training.
            </p>
          </motion.article>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 surface-card p-8">
          <h2 className="text-2xl font-bold text-light mb-6">Frequently Asked Questions</h2>

          <details className="mb-4 border-b border-primary/20 pb-4 cursor-pointer hover:bg-white/5 p-3 rounded">
            <summary className="font-semibold text-light">
              What audio formats are supported?
            </summary>
            <p className="mt-2 text-soft">
              We support MP3, WAV, M4A, and OGG formats. Most common audio files will work fine.
              If you have a different format, try converting it online first.
            </p>
          </details>

          <details className="mb-4 border-b border-primary/20 pb-4 cursor-pointer hover:bg-white/5 p-3 rounded">
            <summary className="font-semibold text-light">
              How long does processing take?
            </summary>
            <p className="mt-2 text-soft">
              Typically 30-60 seconds for a 3-5 minute song. Longer songs may take more time.
              Processing happens asynchronously, so you don&apos;t need to wait on this page.
            </p>
          </details>

          <details className="mb-4 border-b border-primary/20 pb-4 cursor-pointer hover:bg-white/5 p-3 rounded">
            <summary className="font-semibold text-light">
              What if my lyrics don&apos;t align perfectly?
            </summary>
            <p className="mt-2 text-soft">
              Our alignment is approximate (±50-200ms typical error). We use beat detection to
              align words to the music. If alignment is poor, it often means the beat detection
              needs adjustment—this is on our roadmap for improvement.
            </p>
          </details>

          <details className="mb-4 cursor-pointer hover:bg-white/5 p-3 rounded">
            <summary className="font-semibold text-light">
              Can I edit the song after processing?
            </summary>
            <p className="mt-2 text-soft">
              Yes! After processing, you can view and edit the song metadata and sections. However,
              re-processing from the original files will regenerate the analysis (this feature is
              coming soon).
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
