import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MessageList } from "./MessageList.jsx";

describe("MessageList", () => {
  it("renders mixed media and opens a larger image preview", async () => {
    const user = userEvent.setup();
    render(
      <MessageList
        userId="buyer-1"
        messages={[
          {
            id: "message-1",
            sender_id: "buyer-1",
            body: "This is the basket I mean.",
            message_type: "mixed",
            media_path: "buyer-1/conversation-1/photo.webp",
            media_url: "https://example.com/signed-photo.webp",
            media_original_name: "basket.png",
            created_at: "2026-07-03T10:00:00.000Z"
          }
        ]}
      />
    );

    expect(screen.getByText("This is the basket I mean.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View basket.png" }));

    expect(
      screen.getByRole("dialog", { name: "Image preview" })
    ).toBeInTheDocument();
    expect(screen.getAllByAltText("basket.png")).toHaveLength(2);
    await user.click(
      screen.getByRole("button", { name: "Close image preview" })
    );
    expect(
      screen.queryByRole("dialog", { name: "Image preview" })
    ).not.toBeInTheDocument();
  });
});
