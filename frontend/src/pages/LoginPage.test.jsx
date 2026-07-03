import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../contexts/authContextObject.js";
import { LoginPage } from "./LoginPage.jsx";

describe("LoginPage", () => {
  it("submits credentials and returns to the requested protected route", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);
    const router = createMemoryRouter(
      [
        { path: "/login", element: <LoginPage /> },
        { path: "/profile", element: <p>Profile destination</p> }
      ],
      {
        initialEntries: [
          {
            pathname: "/login",
            state: { from: { pathname: "/profile" } }
          }
        ]
      }
    );

    render(
      <AuthContext.Provider value={{ login }}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    );

    await user.type(screen.getByLabelText(/email address/i), "ada@example.com");
    await user.type(screen.getByLabelText(/^password/i), "strong-pass");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(login).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "strong-pass"
    });
    expect(await screen.findByText("Profile destination")).toBeInTheDocument();
  });

  it("opens the marketplace after a direct login", async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);
    const router = createMemoryRouter(
      [
        { path: "/login", element: <LoginPage /> },
        { path: "/marketplace", element: <p>Marketplace destination</p> }
      ],
      { initialEntries: ["/login"] }
    );

    render(
      <AuthContext.Provider value={{ login }}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    );

    await user.type(screen.getByLabelText(/email address/i), "ada@example.com");
    await user.type(screen.getByLabelText(/^password/i), "strong-pass");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByText("Marketplace destination")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/marketplace");
  });
});
