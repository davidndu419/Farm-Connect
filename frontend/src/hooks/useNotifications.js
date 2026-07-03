import { useContext } from "react";
import { NotificationContext } from "../contexts/notificationContextObject.js";

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider.");
  }
  return context;
}
