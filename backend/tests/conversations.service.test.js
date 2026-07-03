import { describe, expect, it, vi } from "vitest";
import { listConversations } from "../src/modules/conversations/conversations.service.js";

function conversationQuery(data) {
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn().mockResolvedValue({ data, error: null })
  };
  return query;
}

describe("conversation summaries", () => {
  it("returns the counterpart, avatar, product context, message time, and unread status", async () => {
    const buyerId = "10000000-0000-4000-8000-000000000001";
    const farmerId = "10000000-0000-4000-8000-000000000002";
    const data = [
      {
        id: "20000000-0000-4000-8000-000000000001",
        buyer_id: buyerId,
        farmer_id: farmerId,
        buyer_last_read_at: "2026-07-03T09:00:00.000Z",
        farmer_last_read_at: "2026-07-03T10:00:00.000Z",
        product_title_snapshot: "Fresh maize",
        last_message_at: "2026-07-03T10:00:00.000Z",
        buyer: {
          id: buyerId,
          full_name: "Bola Buyer",
          role: "buyer",
          avatar_path: null
        },
        farmer: {
          id: farmerId,
          full_name: "Ada Farmer",
          role: "farmer",
          avatar_path: `${farmerId}/avatar.webp`
        },
        last_message: {
          id: "30000000-0000-4000-8000-000000000001",
          sender_id: farmerId,
          body: "The maize is ready.",
          created_at: "2026-07-03T10:00:00.000Z"
        }
      }
    ];
    const query = conversationQuery(data);
    const supabase = {
      from: vi.fn(() => query),
      storage: {
        from: vi.fn(() => ({
          getPublicUrl: (path) => ({
            data: { publicUrl: `https://storage.example/${path}` }
          })
        }))
      }
    };

    const result = await listConversations(supabase, 20, buyerId);

    expect(result[0]).toMatchObject({
      productName: "Fresh maize",
      unread: true,
      lastMessageAt: "2026-07-03T10:00:00.000Z",
      otherUser: {
        id: farmerId,
        full_name: "Ada Farmer",
        role: "farmer",
        avatarUrl: `https://storage.example/${farmerId}/avatar.webp`
      },
      lastMessage: {
        body: "The maize is ready."
      }
    });
  });
});
