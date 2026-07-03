import { describe, expect, it } from "vitest";
import {
  conversationSender,
  isViewingConversation,
  messagePreview
} from "./messageNotifications.js";

describe("message notifications", () => {
  const conversation = {
    buyer_id: "buyer-1",
    farmer_id: "farmer-1",
    buyer: { id: "buyer-1", full_name: "Ada Buyer" },
    farmer: { id: "farmer-1", full_name: "Femi Farmer" }
  };

  it("identifies the sender from existing conversation participants", () => {
    expect(conversationSender(conversation, "buyer-1")?.full_name).toBe(
      "Ada Buyer"
    );
    expect(conversationSender(conversation, "farmer-1")?.full_name).toBe(
      "Femi Farmer"
    );
    expect(conversationSender(conversation, "other")).toBeNull();
  });

  it("normalizes and shortens message previews", () => {
    expect(messagePreview("  Fresh   tomatoes\nare ready. ")).toBe(
      "Fresh tomatoes are ready."
    );
    expect(messagePreview("123456789", 6)).toBe("12345…");
  });

  it("recognizes only the conversation currently being viewed", () => {
    expect(isViewingConversation("/messages/chat-1", "chat-1")).toBe(true);
    expect(isViewingConversation("/messages/chat-1/", "chat-1")).toBe(true);
    expect(isViewingConversation("/messages", "chat-1")).toBe(false);
    expect(isViewingConversation("/messages/chat-2", "chat-1")).toBe(false);
  });
});
