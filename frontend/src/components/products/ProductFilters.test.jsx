import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductFilters } from "./ProductFilters.jsx";

describe("ProductFilters", () => {
  it("reports controlled marketplace filter changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ProductFilters values={{}} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Category"), "tubers");
    await user.selectOptions(screen.getByLabelText("State"), "Oyo");

    expect(onChange).toHaveBeenCalledWith("category", "tubers");
    expect(onChange).toHaveBeenCalledWith("state", "Oyo");
  });
});
