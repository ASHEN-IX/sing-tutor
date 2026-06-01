/**
 * Frontend service for song management API
 * Handles upload, processing, retrieval, and deletion
 */

import axios from 'axios';
import { API_BASE_URL } from './api';
import { getAccessToken } from './authStore';
import { getFriendlyApiErrorMessage } from './errorMessages';
import {
  SongUploadResponse,
  ProcessingStatus,
  SongReference,
  SongPreviewResponse,
  UploadFormData,
} from "../types/songReference";

const authApi = axios.create({
  baseURL: API_BASE_URL,
});

authApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const BASE_URL = "/api/songs";

/**
 * Upload song audio and lyrics for processing
 */
export async function uploadSong(formData: UploadFormData): Promise<SongUploadResponse> {
  const data = new FormData();
  data.append("audio", formData.audio);
  data.append("lyrics", formData.lyrics);
  data.append("title", formData.title);
  data.append("artist", formData.artist);
  data.append("language", formData.language);
  data.append("difficulty", formData.difficulty);

  const response = await authApi.post<SongUploadResponse>(`${BASE_URL}/upload`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

/**
 * Start processing a song
 * Processing runs asynchronously; use getProcessingStatus() to check progress
 */
export async function processSong(songId: string): Promise<ProcessingStatus> {
  const response = await authApi.post<ProcessingStatus>(
    `${BASE_URL}/${songId}/process`
  );
  return response.data;
}

/**
 * Get current processing status
 */
export async function getProcessingStatus(songId: string): Promise<ProcessingStatus> {
  const response = await authApi.get<ProcessingStatus>(
    `${BASE_URL}/${songId}/status`
  );
  return response.data;
}

/**
 * Poll for processing completion
 * Checks status every `interval` ms until complete or timeout
 */
export async function waitForProcessingCompletion(
  songId: string,
  options: {
    interval?: number;
    timeout?: number;
  } = {}
): Promise<SongReference> {
  const interval = options.interval || 1000; // Poll every second
  const timeout = options.timeout || 300000; // 5 minute timeout
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = await getProcessingStatus(songId);

    if (status.status === "completed") {
      return getReference(songId);
    }

    if (status.status === "failed") {
      throw new Error(`Processing failed: ${status.error || "Unknown error"}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Processing timeout after ${timeout / 1000}s`);
}

/**
 * Get complete reference JSON
 * Only available after processing completes
 */
export async function getReference(songId: string): Promise<SongReference> {
  const response = await authApi.get<SongReference>(
    `${BASE_URL}/${songId}/reference`
  );
  return response.data;
}

/**
 * Get lightweight preview (summary) of song
 * For quick display without loading full reference
 */
export async function getSongPreview(songId: string): Promise<SongPreviewResponse> {
  const response = await authApi.get<SongPreviewResponse>(
    `${BASE_URL}/${songId}/preview`
  );
  return response.data;
}

/**
 * Delete a song and all its files
 */
export async function deleteSong(songId: string): Promise<void> {
  await authApi.delete(`${BASE_URL}/${songId}`);
}

/**
 * Handle API errors with user-friendly messages
 */
export function handleSongServiceError(error: unknown): string {
  return getFriendlyApiErrorMessage(error, "Song request failed. Please try again.");
}
