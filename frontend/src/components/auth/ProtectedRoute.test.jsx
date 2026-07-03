import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "../../contexts/authContextObject.js";
import { ProtectedRoute } from "./ProtectedRoute.jsx";

describe("ProtectedRoute", () => {
  it("redirects anonymous visitors to login and preserves their destination", async () => {
    const router = createMemoryRouter(
      [
        {
          element: <ProtectedRoute />,
          children: [{ path: "/messages", element: <p>Private messages</p> }]
        },
        { path: "/login", element: <p>Login destination</p> }
      ],
      { initialEntries: ["/messages"] }
    );

    render(
      <AuthContext.Provider
        value={{ isLoading: false, isAuthenticated: false }}
      >
        <RouterProvider router={router} />
      </AuthContext.Provider>
    );

    expect(await screen.findByText("Login destination")).toBeInTheDocument();
    expect(router.state.location.state.from.pathname).toBe("/messages");
  });
});
