import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import {
  getConversation,
  markConversationRead
} from "../api/conversationsApi.js";
import { listMessages, sendMessage } from "../api/messagesApi.js";
import { AuthContext } from "../contexts/authContextObject.js";
import { ChatPage } from "./ChatPage.jsx";

vi.mock("../api/conversationsApi.js", () => ({
  getConversation: vi.fn(),
  markConversationRead: vi.fn()
}));

vi.mock("../api/messagesApi.js", () => ({
  listMessages: vi.fn(),
  sendMessage: vi.fn()
}));

vi.mock("../hooks/useRealtimeChat.js", () => ({
  useRealtimeChat: vi.fn()
}));

describe("ChatPage", () => {
  it("shows participant context, profile navigation, and distinct bubbles", async () => {
    getConversation.mockResolvedValue({
      data: {
        id: "conversation-1",
        productName: "Fresh maize",
        otherUser: {
          id: "farmer-1",
          full_name: "Ada Farmer",
          role: "farmer",
          avatarUrl: null
        }
      }
    });
    listMessages.mockResolvedValue({
      data: [
        {
          id: "message-1",
          sender_id: "farmer-1",
          body: "The maize is available.",
          created_at: "2026-07-03T10:00:00.000Z"
        },
        {
          id: "message-2",
          sender_id: "buyer-1",
          body: "I will take one bag.",
          created_at: "2026-07-03T10:01:00.000Z"
        }
      ]
    });
    markConversationRead.mockResolvedValue({ data: {} });
    sendMessage.mockResolvedValue({ data: {} });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    render(
      <QueryClientProvider client={client}>
        <AuthContext.Provider value={{ user: { id: "buyer-1" } }}>
          <MemoryRouter initialEntries={["/messages/conversation-1"]}>
            <Routes>
              <Route
                path="/messages/:conversationId"
                element={<ChatPage />}
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole("heading", { name: "Ada Farmer" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Ada Farmer's profile" })
    ).toHaveAttribute("href", "/farmers/farmer-1");
    expect(
      screen.getByRole("link", { name: "Back to messages" })
    ).toHaveAttribute("href", "/messages");
    expect(screen.getByText("Fresh maize")).toBeInTheDocument();
    expect(screen.getByText("The maize is available.").parentElement).toHaveClass(
      "mr-auto"
    );
    expect(screen.getByText("I will take one bag.").parentElement).toHaveClass(
      "ml-auto"
    );
    expect(screen.getByPlaceholderText("Type a message")).toBeInTheDocument();
  });
});
