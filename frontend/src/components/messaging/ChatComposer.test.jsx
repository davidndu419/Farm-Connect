import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatComposer } from "./ChatComposer.jsx";

describe("ChatComposer", () => {
  it("trims a message, sends once, and clears the composer", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<ChatComposer onSend={onSend} />);

    const input = screen.getByLabelText("Message");
    await user.type(input, "  Is this still available?  ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith({
      body: "Is this still available?",
      image: null
    });
    expect(input).toHaveValue("");
  });

  it("previews and sends a selected image without requiring text", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    const createObjectUrl = vi.fn(() => "blob:chat-preview");
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrl
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrl
    });
    const image = new File(["image"], "harvest.png", {
      type: "image/png"
    });
    render(<ChatComposer onSend={onSend} />);

    await user.upload(screen.getByLabelText("Attach image"), image);
    expect(
      await screen.findByAltText("Selected attachment preview")
    ).toHaveAttribute("src", "blob:chat-preview");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith({ body: null, image });
    expect(createObjectUrl).toHaveBeenCalledWith(image);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:chat-preview");
  });
});
