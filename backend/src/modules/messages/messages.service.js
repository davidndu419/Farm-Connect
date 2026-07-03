import { randomUUID } from "node:crypto";
import { processImage } from "../../services/image.service.js";
import { removeStoredFile } from "../../services/storage.service.js";
import { ApiError } from "../../utils/ApiError.js";

const CHAT_MEDIA_BUCKET = "chat-media";
const MAX_CHAT_IMAGE_SIZE = 5 * 1024 * 1024;
const SIGNED_URL_LIFETIME_SECONDS = 60 * 60;

async function withSignedMediaUrls(supabase, messages) {
  const paths = [
    ...new Set(
      messages.map((message) => message.media_path).filter(Boolean)
    )
  ];
  if (!paths.length) return messages;

  const { data, error } = await supabase.storage
    .from(CHAT_MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_LIFETIME_SECONDS);
  if (error) {
    return messages.map((message) => ({
      ...message,
      media_url: message.media_path ? null : message.media_url
    }));
  }

  const signedUrls = new Map(
    data
      .filter((item) => item.signedUrl)
      .map((item) => [item.path, item.signedUrl])
  );
  return messages.map((message) => ({
    ...message,
    media_url: message.media_path
      ? signedUrls.get(message.media_path) ?? null
      : message.media_url
  }));
}

function safeOriginalName(name) {
  const cleaned = [...name]
    .filter((character) => {
      const code = character.codePointAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim()
    .slice(0, 255);
  return cleaned || "chat-image";
}

async function ensureParticipant(supabase, conversationId) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .single();
  if (error || !data) {
    throw ApiError.forbidden("Conversation access denied.");
  }
}

export async function listMessages(supabase, conversationId, filters) {
  let query = supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(filters.limit);
  if (filters.before) query = query.lt("created_at", filters.before);
  const { data, error } = await query;
  if (error) throw ApiError.forbidden("Conversation access denied.");

  const messages = await withSignedMediaUrls(supabase, data.reverse());
  return {
    messages,
    nextCursor:
      data.length === filters.limit ? data[0]?.created_at : null
  };
}

export async function sendMessage(
  supabase,
  userId,
  conversationId,
  body,
  file
) {
  const normalizedBody = body?.trim() || null;
  if (!normalizedBody && !file) {
    throw ApiError.badRequest("Enter a message or choose an image.");
  }

  let media = {
    url: null,
    path: null,
    mimeType: null,
    size: null,
    originalName: null
  };

  if (file) {
    await ensureParticipant(supabase, conversationId);
    const processed = await processImage(file.buffer, {
      maxWidth: 1600,
      maxHeight: 1600
    });
    if (processed.length > MAX_CHAT_IMAGE_SIZE) {
      throw ApiError.badRequest(
        "The processed chat image must be 5 MB or smaller."
      );
    }

    media = {
      url: null,
      path: `${userId}/${conversationId}/${randomUUID()}.webp`,
      mimeType: "image/webp",
      size: processed.length,
      originalName: safeOriginalName(file.originalname)
    };
    const { error: uploadError } = await supabase.storage
      .from(CHAT_MEDIA_BUCKET)
      .upload(media.path, processed, {
        contentType: media.mimeType,
        cacheControl: "3600",
        upsert: false
      });
    if (uploadError) {
      throw ApiError.badRequest("The chat image could not be uploaded.");
    }
  }

  const { data, error } = await supabase.rpc("send_message", {
    target_conversation_id: conversationId,
    message_body: normalizedBody,
    message_media_url: media.url,
    message_media_path: media.path,
    message_media_mime_type: media.mimeType,
    message_media_size: media.size,
    message_media_original_name: media.originalName
  });

  if (error) {
    if (media.path) {
      await removeStoredFile(supabase, CHAT_MEDIA_BUCKET, media.path).catch(
        () => {}
      );
    }
    if (error.code === "42501") {
      throw ApiError.forbidden("Conversation access denied.");
    }
    throw ApiError.badRequest(error.message ?? "Message could not be sent.");
  }

  return (await withSignedMediaUrls(supabase, [data]))[0];
}
