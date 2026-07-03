import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "../contexts/authContextObject.js";
import { SplashPage } from "./SplashPage.jsx";

describe("SplashPage", () => {
  it("introduces the marketplace and its audience", () => {
    const router = createMemoryRouter(
      [{ path: "/", element: <SplashPage /> }],
      { initialEntries: ["/"] }
    );

    render(
      <AuthContext.Provider value={{ isAuthenticated: false, isLoading: false }}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    );

    expect(
      screen.getByRole("heading", {
        name: /buy fresh produce directly from local farmers/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/discover crops, compare prices/i)).toBeInTheDocument();
  });

  it("redirects to marketplace when already authenticated", () => {
    const router = createMemoryRouter(
      [
        { path: "/", element: <SplashPage /> },
        { path: "/marketplace", element: <p>Marketplace page</p> }
      ],
      { initialEntries: ["/"] }
    );

    render(
      <AuthContext.Provider value={{ isAuthenticated: true, isLoading: false }}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    );

    expect(screen.getByText("Marketplace page")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/marketplace");
  });
});
