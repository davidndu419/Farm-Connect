export const MAX_CHAT_IMAGE_SIZE = 5 * 1024 * 1024;

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function chatImageValidationError(file) {
  if (!acceptedTypes.has(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (file.size > MAX_CHAT_IMAGE_SIZE) {
    return "Chat images must be 5 MB or smaller.";
  }
  return null;
}
