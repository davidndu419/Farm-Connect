import sharp from "sharp";
import { ApiError } from "../utils/ApiError.js";

const supportedFormats = new Set(["jpeg", "png", "webp"]);

export async function processImage(buffer, { maxWidth, maxHeight }) {
  try {
    const pipeline = sharp(buffer, {
      failOn: "warning",
      limitInputPixels: 40_000_000
    });
    const metadata = await pipeline.metadata();

    if (!supportedFormats.has(metadata.format)) {
      throw ApiError.badRequest("Only JPEG, PNG, and WebP images are accepted.");
    }

    return await pipeline
      .rotate()
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 82, effort: 5 })
      .toBuffer();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.badRequest("The uploaded file is not a valid image.");
  }
}
