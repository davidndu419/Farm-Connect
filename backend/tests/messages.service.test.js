import { describe, expect, it, vi } from "vitest";
import { sendMessage } from "../src/modules/messages/messages.service.js";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

function participantQuery() {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({
      data: { id: "20000000-0000-4000-8000-000000000001" },
      error: null
    })
  };
  return query;
}

describe("media messages", () => {
  it("processes, uploads, persists, and signs a chat image", async () => {
    const query = participantQuery();
    const upload = vi.fn().mockResolvedValue({ error: null });
    const createSignedUrls = vi.fn(async (paths) => ({
      data: paths.map((path) => ({
        path,
        signedUrl: `https://storage.example/${path}?signed=true`
      })),
      error: null
    }));
    const storageBucket = { upload, createSignedUrls };
    const rpc = vi.fn(async (_name, input) => ({
      data: {
        id: "30000000-0000-4000-8000-000000000001",
        body: input.message_body,
        message_type: "mixed",
        media_path: input.message_media_path,
        media_url: null
      },
      error: null
    }));
    const supabase = {
      from: vi.fn(() => query),
      rpc,
      storage: { from: vi.fn(() => storageBucket) }
    };

    const message = await sendMessage(
      supabase,
      "10000000-0000-4000-8000-000000000001",
      "20000000-0000-4000-8000-000000000001",
      "Fresh harvest",
      {
        buffer: onePixelPng,
        originalname: "harvest.png",
        mimetype: "image/png"
      }
    );

    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(
        /^10000000-0000-4000-8000-000000000001\/20000000-0000-4000-8000-000000000001\/.+\.webp$/
      ),
      expect.any(Buffer),
      expect.objectContaining({ contentType: "image/webp" })
    );
    expect(rpc).toHaveBeenCalledWith(
      "send_message",
      expect.objectContaining({
        message_body: "Fresh harvest",
        message_media_mime_type: "image/webp",
        message_media_original_name: "harvest.png"
      })
    );
    expect(message.media_url).toMatch(/\?signed=true$/);
  });

  it("rejects a message without text or an image", async () => {
    await expect(
      sendMessage({}, "user-1", "conversation-1", "   ", null)
    ).rejects.toThrow(/Enter a message or choose an image/);
  });
});
