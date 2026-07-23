import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.memoryStorage();

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export const uploadImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter(_req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`, "UPLOAD_BAD_TYPE"));
    }
    cb(null, true);
  },
});
