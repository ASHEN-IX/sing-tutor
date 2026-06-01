import axios from "axios";

export function getFriendlyApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail ?? error.response?.data?.message;

    if (typeof detail === "string" && detail.trim()) {
      const normalized = detail.toLowerCase();

      if (status === 401) {
        return "Your session expired. Please sign in again.";
      }

      if (status === 404) {
        return "The requested song could not be found.";
      }

      if (status === 413) {
        return "The uploaded file is too large. Please choose a smaller file.";
      }

      if (status === 400) {
        if (normalized.includes("audio")) {
          return "Please upload a valid audio file.";
        }
        if (normalized.includes("title") || normalized.includes("artist")) {
          return "Please fill in the song title and artist.";
        }
        return "Please check your input and try again.";
      }

      if (status && status >= 500) {
        return fallback;
      }

      return detail;
    }

    if (status === 401) {
      return "Your session expired. Please sign in again.";
    }

    if (status === 404) {
      return "The requested song could not be found.";
    }

    if (status === 413) {
      return "The uploaded file is too large. Please choose a smaller file.";
    }

    if (status && status >= 500) {
      return fallback;
    }

    return fallback;
  }

  if (error instanceof Error) {
    if (error.message.includes("Request failed with status code 401")) {
      return "Your session expired. Please sign in again.";
    }

    if (error.message.includes("Request failed with status code 404")) {
      return "The requested song could not be found.";
    }

    if (error.message.includes("Request failed with status code 413")) {
      return "The uploaded file is too large. Please choose a smaller file.";
    }

    return error.message;
  }

  return fallback;
}