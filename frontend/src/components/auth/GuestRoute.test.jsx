import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "../../contexts/authContextObject.js";
import { GuestRoute } from "./GuestRoute.jsx";

describe("GuestRoute", () => {
  it("allows the login and registration pages even when a session exists", async () => {
    const router = createMemoryRouter(
      [
        {
          element: <GuestRoute />,
          children: [{ path: "/login", element: <p>Login page</p> }]
        }
      ],
      { initialEntries: ["/login"] }
    );

    render(
      <AuthContext.Provider
        value={{ isLoading: false, isAuthenticated: true }}
      >
        <RouterProvider router={router} />
      </AuthContext.Provider>
    );

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });
});
