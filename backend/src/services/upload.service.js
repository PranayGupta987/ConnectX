import { cloudinary } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Upload a Buffer to Cloudinary. Returns { url, publicId, width, height, bytes, format }.
 * @param {Buffer} buffer
 * @param {{ folder?: string; publicId?: string; resourceType?: "image"|"video"|"raw"|"auto" }} [opts]
 */
export function uploadBuffer(buffer, opts = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder ?? "connectx",
        public_id: opts.publicId,
        resource_type: opts.resourceType ?? "image",
        overwrite: true,
      },
      (err, result) => {
        if (err || !result) return reject(ApiError.internal(err?.message ?? "Upload failed", "UPLOAD_FAILED"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function destroyAsset(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}
