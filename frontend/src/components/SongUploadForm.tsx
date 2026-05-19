/**
 * Song Upload Form Component
 * Handles file input, metadata form, and upload submission
 */

import React, { useState } from "react";
import { uploadSong, processSong } from "../services/songService";
import { SongUploadResponse, UploadFormData } from "../types/songReference";

interface SongUploadFormProps {
  onUploadComplete?: (response: SongUploadResponse) => void;
  onError?: (error: string) => void;
}

export function SongUploadForm({ onUploadComplete, onError }: SongUploadFormProps) {
  const [formData, setFormData] = useState<UploadFormData>({
    audio: null!,
    lyrics: null!,
    title: "",
    artist: "",
    language: "en",
    difficulty: "beginner",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.audio) errors.audio = "Audio file is required";
    if (!formData.lyrics) errors.lyrics = "Lyrics file is required";
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.artist.trim()) errors.artist = "Artist is required";

    // Validate file types
    if (formData.audio && !isValidAudioFile(formData.audio)) {
      errors.audio = "Please upload a valid audio file (.mp3, .wav, .m4a, .ogg)";
    }

    if (formData.lyrics && !isValidLyricsFile(formData.lyrics)) {
      errors.lyrics = "Please upload a valid lyrics file (.txt, .lrc)";
    }

    // Validate file sizes
    if (formData.audio && formData.audio.size > 100 * 1024 * 1024) {
      errors.audio = "Audio file is too large (max 100MB)";
    }

    if (formData.lyrics && formData.lyrics.size > 1 * 1024 * 1024) {
      errors.lyrics = "Lyrics file is too large (max 1MB)";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidAudioFile = (file: File): boolean => {
    const validTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg"];
    const validExtensions = [".mp3", ".wav", ".m4a", ".ogg"];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    return hasValidType || hasValidExtension;
  };

  const isValidLyricsFile = (file: File): boolean => {
    const validTypes = ["text/plain", "application/octet-stream"];
    const validExtensions = [".txt", ".lrc"];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    return hasValidType || hasValidExtension;
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "audio" | "lyrics"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fileType]: file,
      }));
      // Clear error for this field
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[fileType];
        return updated;
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Upload song
      const uploadResponse = await uploadSong(formData);
      setUploadProgress(50);

      // Start processing
      await processSong(uploadResponse.song_id);
      setUploadProgress(100);

      // Notify parent component
      onUploadComplete?.(uploadResponse);

      // Reset form
      setFormData({
        audio: null!,
        lyrics: null!,
        title: "",
        artist: "",
        language: "en",
        difficulty: "beginner",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface-card mx-auto max-w-2xl p-6 sm:p-8">
      <h2 className="text-3xl font-bold mb-6 text-light">Upload Song</h2>

      {/* Audio File Input */}
      <div className="mb-6">
        <label htmlFor="audio" className="block text-sm font-medium text-soft mb-2">
          Audio File <span className="text-secondary">*</span>
        </label>
        <input
          id="audio"
          type="file"
          accept=".mp3,.wav,.m4a,.ogg,audio/mpeg,audio/wav,audio/mp4,audio/ogg"
          onChange={(e) => handleFileChange(e, "audio")}
          disabled={isLoading}
          className="block w-full min-h-11 rounded-lg border border-primary/30 bg-dark/60 px-4 py-2 text-light file:mr-3 file:rounded-md file:border-0 file:bg-primary/20 file:px-3 file:py-2 file:text-sm file:text-light focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        {formData.audio && (
          <p className="mt-2 text-sm text-emerald-300">✓ {formData.audio.name}</p>
        )}
        {validationErrors.audio && (
          <p className="mt-2 text-sm text-red-300">{validationErrors.audio}</p>
        )}
      </div>

      {/* Lyrics File Input */}
      <div className="mb-6">
        <label htmlFor="lyrics" className="block text-sm font-medium text-soft mb-2">
          Lyrics File <span className="text-secondary">*</span>
        </label>
        <input
          id="lyrics"
          type="file"
          accept=".txt,.lrc"
          onChange={(e) => handleFileChange(e, "lyrics")}
          disabled={isLoading}
          className="block w-full min-h-11 rounded-lg border border-primary/30 bg-dark/60 px-4 py-2 text-light file:mr-3 file:rounded-md file:border-0 file:bg-primary/20 file:px-3 file:py-2 file:text-sm file:text-light focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        {formData.lyrics && (
          <p className="mt-2 text-sm text-emerald-300">✓ {formData.lyrics.name}</p>
        )}
        {validationErrors.lyrics && (
          <p className="mt-2 text-sm text-red-300">{validationErrors.lyrics}</p>
        )}
      </div>

      {/* Title Input */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-soft mb-2">
          Title <span className="text-secondary">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          disabled={isLoading}
          placeholder="e.g., Perfect"
          className="block w-full min-h-11 rounded-lg border border-primary/30 bg-dark/60 px-4 py-2 text-light placeholder:text-light/40 focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        {validationErrors.title && (
          <p className="mt-2 text-sm text-red-300">{validationErrors.title}</p>
        )}
      </div>

      {/* Artist Input */}
      <div className="mb-6">
        <label htmlFor="artist" className="block text-sm font-medium text-soft mb-2">
          Artist <span className="text-secondary">*</span>
        </label>
        <input
          type="text"
          id="artist"
          name="artist"
          value={formData.artist}
          onChange={handleInputChange}
          disabled={isLoading}
          placeholder="e.g., Ed Sheeran"
          className="block w-full min-h-11 rounded-lg border border-primary/30 bg-dark/60 px-4 py-2 text-light placeholder:text-light/40 focus:ring-2 focus:ring-primary disabled:opacity-50"
        />
        {validationErrors.artist && (
          <p className="mt-2 text-sm text-red-300">{validationErrors.artist}</p>
        )}
      </div>

      {/* Language Select */}
      <div className="mb-6">
        <label htmlFor="language" className="block text-sm font-medium text-soft mb-2">
          Language
        </label>
        <select
          id="language"
          name="language"
          value={formData.language}
          onChange={handleInputChange}
          disabled={isLoading}
          className="block w-full min-h-11 rounded-lg border border-primary/30 bg-dark/60 px-4 py-2 text-light focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
          <option value="ko">Korean</option>
        </select>
      </div>

      {/* Difficulty Select */}
      <div className="mb-6">
        <label htmlFor="difficulty" className="block text-sm font-medium text-soft mb-2">
          Difficulty Level
        </label>
        <select
          id="difficulty"
          name="difficulty"
          value={formData.difficulty}
          onChange={handleInputChange}
          disabled={isLoading}
          className="block w-full min-h-11 rounded-lg border border-primary/30 bg-dark/60 px-4 py-2 text-light focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Progress Bar */}
      {isLoading && (
        <div className="mb-6" aria-live="polite">
          <div className="w-full bg-dark/80 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-soft mt-2">
            {uploadProgress < 50 ? "Uploading..." : "Starting processing..."}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? "Uploading..." : "Upload & Process"}
        </button>
      </div>
    </form>
  );
}
