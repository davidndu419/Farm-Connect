import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../contexts/authContextObject.js";
import { NotificationContext } from "../contexts/notificationContextObject.js";
import { ProfilePage } from "./ProfilePage.jsx";

describe("ProfilePage", () => {
  it("allows the address and existing profile fields to be edited", async () => {
    const user = userEvent.setup();
    const updateProfile = vi.fn().mockResolvedValue({});
    const auth = {
      profile: {
        full_name: "Ada Farmer",
        email: "ada@example.com",
        phone: "+2348012345678",
        address: "Old Farm Road",
        state: "Enugu",
        city: "Nsukka",
        role: "farmer",
        avatarUrl: null
      },
      updateProfile,
      switchRole: vi.fn(),
      updateAvatar: vi.fn(),
      removeAvatar: vi.fn()
    };

    render(
      <AuthContext.Provider value={auth}>
        <NotificationContext.Provider value={{ supported: false }}>
          <ProfilePage />
        </NotificationContext.Provider>
      </AuthContext.Provider>
    );

    const address = screen.getByLabelText("Address");
    await user.clear(address);
    await user.type(address, "22 New Market Road");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({
        fullName: "Ada Farmer",
        phone: "+2348012345678",
        address: "22 New Market Road",
        state: "Enugu",
        city: "Nsukka"
      })
    );
  });
});
