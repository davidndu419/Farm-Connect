import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processImage } from "../src/services/image.service.js";

describe("processImage", () => {
  it("strips and converts a valid image to bounded WebP", async () => {
    const input = await sharp({
      create: {
        width: 1400,
        height: 900,
        channels: 3,
        background: "#2f6f48"
      }
    })
      .jpeg()
      .toBuffer();

    const output = await processImage(input, {
      maxWidth: 600,
      maxHeight: 600
    });
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(600);
    expect(metadata.height).toBeLessThanOrEqual(600);
  });

  it("rejects bytes that are not a decodable image", async () => {
    await expect(
      processImage(Buffer.from("not an image"), {
        maxWidth: 600,
        maxHeight: 600
      })
    ).rejects.toThrow("not a valid image");
  });
});
