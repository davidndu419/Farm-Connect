import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError.js";

export function publicStorageUrl(supabase, bucket, path) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadAvatar(supabase, userId, file) {
  const path = `${userId}/${randomUUID()}.webp`;
  const { processImage } = await import("./image.service.js");
  const image = await processImage(file.buffer, {
    maxWidth: 1024,
    maxHeight: 1024
  });

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, image, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false
    });

  if (error) {
    throw ApiError.badRequest("The avatar could not be uploaded.");
  }

  return path;
}

export async function removeStoredFile(supabase, bucket, path) {
  if (!path) {
    return;
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new ApiError(502, "STORAGE_ERROR", "The stored image could not be removed.");
  }
}
