/**
 * Typed access to Vite public environment variables.
 * Server-side variables never belong here — those live in the Express backend.
 */
export const env = {
  API_URL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000",
  APP_URL:
    import.meta.env.VITE_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080"),
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "",
} as const;
