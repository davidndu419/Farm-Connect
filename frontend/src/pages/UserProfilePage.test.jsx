import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { getBasicProfile } from "../api/profilesApi.js";
import { UserProfilePage } from "./UserProfilePage.jsx";

vi.mock("../api/profilesApi.js", () => ({
  getBasicProfile: vi.fn()
}));

describe("UserProfilePage", () => {
  it("uses the full profile card without a listings section", async () => {
    getBasicProfile.mockResolvedValue({
      data: {
        id: "buyer-1",
        full_name: "Bola Buyer",
        role: "buyer",
        phone: "+2348022222222",
        address: "14 Marina Road",
        city: "Surulere",
        state: "Lagos",
        avatarUrl: null
      }
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/users/buyer-1"]}>
          <Routes>
            <Route path="/users/:userId" element={<UserProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole("heading", { name: "Bola Buyer" })
    ).toBeInTheDocument();
    expect(screen.getByText("buyer profile")).toBeInTheDocument();
    expect(screen.getByText("14 Marina Road")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+2348022222222" })).toHaveAttribute(
      "href",
      "tel:+2348022222222"
    );
    expect(
      screen.queryByRole("heading", { name: /listings/i })
    ).not.toBeInTheDocument();
  });
});
