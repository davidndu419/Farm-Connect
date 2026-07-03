import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ConversationItem } from "./ConversationItem.jsx";

describe("ConversationItem", () => {
  it("renders a fully clickable unread conversation summary", () => {
    const { container } = render(
      <MemoryRouter>
        <ConversationItem
          userId="buyer-1"
          conversation={{
            id: "conversation-1",
            otherUser: {
              id: "farmer-1",
              full_name: "Ada Farmer",
              avatarUrl: "https://example.com/ada.webp"
            },
            productName: "Fresh maize",
            lastMessage: {
              sender_id: "farmer-1",
              body: "The maize is ready."
            },
            lastMessageAt: "2026-07-03T10:00:00.000Z",
            unread: true
          }}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", {
        name: "Open conversation with Ada Farmer"
      })
    ).toHaveAttribute("href", "/messages/conversation-1");
    expect(screen.getByText("Fresh maize")).toBeInTheDocument();
    expect(screen.getByText("The maize is ready.")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/ada.webp"
    );
  });
});
