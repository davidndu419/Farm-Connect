import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProductDetailsBackLink } from "./ProductDetailsBackLink.jsx";

function renderLink(canManage) {
  render(
    <MemoryRouter>
      <ProductDetailsBackLink canManage={canManage} />
    </MemoryRouter>
  );
}

describe("ProductDetailsBackLink", () => {
  it("returns an owner to My Products", () => {
    renderLink(true);

    expect(
      screen.getByRole("link", { name: "Back to my products" })
    ).toHaveAttribute("href", "/my-products");
  });

  it("returns other viewers to Marketplace", () => {
    renderLink(false);

    expect(
      screen.getByRole("link", { name: "Back to marketplace" })
    ).toHaveAttribute("href", "/marketplace");
  });
});
