import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProductCard } from "./ProductCard.jsx";

const product = {
  id: "product-1",
  title: "Fresh tomatoes",
  price: 2500,
  unit: "basket",
  city: "Jos",
  state: "Plateau",
  product_images: []
};

describe("ProductCard", () => {
  it("labels sold-out products and keeps their details accessible", () => {
    render(
      <MemoryRouter>
        <ProductCard product={{ ...product, status: "sold_out" }} />
      </MemoryRouter>
    );

    expect(screen.getByText("Sold out")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Fresh tomatoes" })
    ).toHaveAttribute("href", "/products/product-1");
  });

  it("labels archived products without linking to public details", () => {
    render(
      <MemoryRouter>
        <ProductCard product={{ ...product, status: "archived" }} />
      </MemoryRouter>
    );

    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Fresh tomatoes" })
    ).not.toBeInTheDocument();
  });
});
