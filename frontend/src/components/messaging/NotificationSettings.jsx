import { Button } from "../common/Button.jsx";
import { useNotifications } from "../../hooks/useNotifications.js";

export function NotificationSettings() {
  const notifications = useNotifications();

  if (!notifications.supported) {
    return (
      <aside className="mb-6 rounded-2xl border border-ink/10 bg-white p-5">
        <p className="font-bold">Message notifications unavailable</p>
        <p className="mt-1 text-sm text-ink/60">
          This browser does not support local notifications in the current
          context. Messages will continue to work normally.
        </p>
      </aside>
    );
  }

  if (notifications.permission === "denied") {
    return (
      <aside className="mb-6 rounded-2xl border border-ink/10 bg-white p-5">
        <p className="font-bold">Message notifications are blocked</p>
        <p className="mt-1 text-sm text-ink/60">
          You can allow Farm Connect notifications from your browser’s site
          settings. Chat will continue to work without them.
        </p>
      </aside>
    );
  }

  if (notifications.enabled) {
    return (
      <aside className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-leaf/20 bg-mint/25 p-5">
        <div>
          <p className="font-bold">Message notifications are on</p>
          <p className="mt-1 text-sm text-ink/60">
            We’ll notify you about new messages while Farm Connect is running.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={notifications.disableNotifications}
        >
          Turn off
        </Button>
      </aside>
    );
  }

  return (
    <aside className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-harvest/25 bg-white p-5">
      <div>
        <p className="font-bold">Don’t miss a buyer or farmer reply</p>
        <p className="mt-1 text-sm text-ink/60">
          Enable local notifications for new messages while Farm Connect is
          running.
        </p>
      </div>
      <Button type="button" onClick={notifications.requestPermission}>
        Enable notifications
      </Button>
    </aside>
  );
}
