import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const acceptedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function imageFileFilter(_request, file, callback) {
  if (!acceptedImageTypes.has(file.mimetype)) {
    return callback(
      ApiError.badRequest("Only JPEG, PNG, and WebP images are accepted.")
    );
  }

  return callback(null, true);
}

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: imageFileFilter
}).single("avatar");

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
  fileFilter: imageFileFilter
}).array("images", 5);

export const chatImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: imageFileFilter
}).single("image");
