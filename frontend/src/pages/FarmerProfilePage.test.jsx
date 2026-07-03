import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { listProducts } from "../api/productsApi.js";
import { getFarmerProfile } from "../api/profilesApi.js";
import { FarmerProfilePage } from "./FarmerProfilePage.jsx";

vi.mock("../api/profilesApi.js", () => ({
  getFarmerProfile: vi.fn()
}));

vi.mock("../api/productsApi.js", () => ({
  listProducts: vi.fn()
}));

describe("FarmerProfilePage", () => {
  it("shows public farmer contact information above visible listings", async () => {
    getFarmerProfile.mockResolvedValue({
      data: {
        id: "farmer-1",
        full_name: "Ada Farmer",
        phone: "+2348012345678",
        address: "8 Market Road",
        city: "Nsukka",
        state: "Enugu",
        avatarUrl: "https://example.com/ada.webp"
      }
    });
    listProducts.mockResolvedValue({
      data: [
        {
          id: "product-1",
          title: "Fresh maize",
          status: "active",
          price: 15000,
          unit: "bag",
          city: "Nsukka",
          state: "Enugu",
          product_images: []
        }
      ]
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/farmers/farmer-1"]}>
          <Routes>
            <Route
              path="/farmers/:farmerId"
              element={<FarmerProfilePage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole("heading", { name: "Ada Farmer" })
    ).toBeInTheDocument();
    expect(screen.getByText("8 Market Road")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+2348012345678" })).toHaveAttribute(
      "href",
      "tel:+2348012345678"
    );
    expect(
      screen.getByRole("img", { name: "Ada Farmer's profile" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Fresh maize")).toBeInTheDocument();
    expect(listProducts).toHaveBeenCalledWith("farmerId=farmer-1");
  });
});
