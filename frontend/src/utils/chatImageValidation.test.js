import { describe, expect, it } from "vitest";
import {
  chatImageValidationError,
  MAX_CHAT_IMAGE_SIZE
} from "./chatImageValidation.js";

describe("chatImageValidationError", () => {
  it("accepts supported images within five megabytes", () => {
    const image = new File(["image"], "harvest.webp", {
      type: "image/webp"
    });
    expect(chatImageValidationError(image)).toBeNull();
  });

  it("rejects unsupported and oversized files", () => {
    expect(
      chatImageValidationError(
        new File(["pdf"], "document.pdf", { type: "application/pdf" })
      )
    ).toMatch(/JPEG, PNG, or WebP/);
    expect(
      chatImageValidationError({
        type: "image/jpeg",
        size: MAX_CHAT_IMAGE_SIZE + 1
      })
    ).toMatch(/5 MB/);
  });
});
