import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { BackToMyProductsLink } from "./BackToMyProductsLink.jsx";

describe("BackToMyProductsLink", () => {
  it("returns product forms to My Products", () => {
    render(
      <MemoryRouter>
        <BackToMyProductsLink />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", { name: "Back to my products" })
    ).toHaveAttribute("href", "/my-products");
  });
});
