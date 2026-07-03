import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NotificationContext } from "../../contexts/notificationContextObject.js";
import { NotificationSettings } from "./NotificationSettings.jsx";

function renderSettings(overrides = {}) {
  const value = {
    disableNotifications: vi.fn(),
    enabled: false,
    permission: "default",
    preference: "disabled",
    requestPermission: vi.fn(),
    supported: true,
    ...overrides
  };

  render(
    <NotificationContext.Provider value={value}>
      <NotificationSettings />
    </NotificationContext.Provider>
  );

  return value;
}

describe("NotificationSettings", () => {
  it("requests permission only after the user enables notifications", async () => {
    const user = userEvent.setup();
    const notifications = renderSettings();

    await user.click(
      screen.getByRole("button", { name: "Enable notifications" })
    );

    expect(notifications.requestPermission).toHaveBeenCalledOnce();
  });

  it("allows an enabled preference to be turned off", async () => {
    const user = userEvent.setup();
    const notifications = renderSettings({
      enabled: true,
      permission: "granted",
      preference: "enabled"
    });

    await user.click(screen.getByRole("button", { name: "Turn off" }));

    expect(notifications.disableNotifications).toHaveBeenCalledOnce();
  });

  it("explains denied permission without blocking messages", () => {
    renderSettings({ permission: "denied" });

    expect(
      screen.getByText("Message notifications are blocked")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
