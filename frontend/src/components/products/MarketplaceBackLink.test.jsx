import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "../../contexts/authContextObject.js";
import { MarketplaceBackLink } from "./MarketplaceBackLink.jsx";

function renderBackLink(isAuthenticated) {
  render(
    <AuthContext.Provider value={{ isAuthenticated }}>
      <MemoryRouter>
        <MarketplaceBackLink />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("MarketplaceBackLink", () => {
  it("returns guests to the public home page", () => {
    renderBackLink(false);

    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("returns authenticated users to their profile", () => {
    renderBackLink(true);

    expect(
      screen.getByRole("link", { name: "Back to profile" })
    ).toHaveAttribute("href", "/profile");
  });
});
