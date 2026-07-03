import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../contexts/authContextObject.js";
import { SessionAwareLayout } from "./SessionAwareLayout.jsx";

function renderPage(auth, pathname = "/products/product-id") {
  const router = createMemoryRouter(
    [
      {
        element: <SessionAwareLayout />,
        children: [
          { path: "/products/:productId", element: <p>Product details</p> }
        ]
      }
    ],
    { initialEntries: [pathname] }
  );

  render(
    <AuthContext.Provider value={auth}>
      <RouterProvider router={router} />
    </AuthContext.Provider>
  );
}

describe("SessionAwareLayout", () => {
  it("keeps account navigation visible on product details for signed-in users", async () => {
    renderPage({
      isAuthenticated: true,
      isLoading: false,
      profile: { full_name: "Ada Farmer", role: "farmer" },
      logout: vi.fn()
    });

    expect(await screen.findByText("Product details")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Marketplace" })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "My products" })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Profile" })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Messages" })[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("keeps account-only navigation hidden from guests", async () => {
    renderPage({
      isAuthenticated: false,
      isLoading: false,
      profile: null,
      logout: vi.fn()
    });

    expect(await screen.findByText("Product details")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });
});
