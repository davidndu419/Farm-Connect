import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteProduct,
  listMyProducts,
  updateProductStatus
} from "../api/productsApi.js";
import { MyProductsPage } from "./MyProductsPage.jsx";

vi.mock("../api/productsApi.js", () => ({
  deleteProduct: vi.fn(),
  listMyProducts: vi.fn(),
  updateProductStatus: vi.fn()
}));

const products = [
  { id: "active-1", title: "Maize", status: "active" },
  { id: "sold-1", title: "Yam", status: "sold_out" },
  { id: "archived-1", title: "Rice", status: "archived" }
].map((product) => ({
  ...product,
  price: 1000,
  unit: "bag",
  city: "Ikeja",
  state: "Lagos",
  product_images: []
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MyProductsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("MyProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMyProducts.mockResolvedValue({ data: products });
    updateProductStatus.mockResolvedValue({ data: {} });
    deleteProduct.mockResolvedValue(null);
  });

  it("shows the controls appropriate for each visible status", async () => {
    renderPage();

    expect(await screen.findByText("Maize")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark as Sold Out" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark as Active" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unarchive" })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(3);
  });

  it("unarchives directly back to active", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Unarchive" }));

    expect(updateProductStatus).toHaveBeenCalledWith("archived-1", "active");
  });
});
