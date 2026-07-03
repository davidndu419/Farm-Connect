import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getConversation } from "../api/conversationsApi.js";
import { useAuth } from "../hooks/useAuth.js";
import {
  conversationSender,
  isViewingConversation,
  NOTIFICATION_PREFERENCE_KEY,
  showMessageNotification
} from "../services/messageNotifications.js";
import { realtimeClient } from "../services/supabaseRealtime.js";
import { NotificationContext } from "./notificationContextObject.js";

function notificationsAreSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    window.isSecureContext
  );
}

function initialPreference() {
  if (typeof window === "undefined") return "disabled";
  try {
    return (
      window.localStorage.getItem(NOTIFICATION_PREFERENCE_KEY) ?? "disabled"
    );
  } catch {
    return "disabled";
  }
}

export function NotificationProvider({ children }) {
  const { accessToken, isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const supported = notificationsAreSupported();
  const [preference, setPreference] = useState(initialPreference);
  const [permission, setPermission] = useState(() =>
    supported ? Notification.permission : "unsupported"
  );
  const enabled =
    supported && preference === "enabled" && permission === "granted";

  const storePreference = useCallback((value) => {
    try {
      window.localStorage.setItem(NOTIFICATION_PREFERENCE_KEY, value);
    } catch {
      // Browser privacy settings may prevent storage; the session still works.
    }
    setPreference(value);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return "unsupported";
    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      storePreference(nextPermission === "granted" ? "enabled" : "disabled");
      return nextPermission;
    } catch {
      storePreference("disabled");
      return "error";
    }
  }, [storePreference, supported]);

  const disableNotifications = useCallback(() => {
    storePreference("disabled");
  }, [storePreference]);

  useEffect(() => {
    if (!supported) return undefined;
    const syncPermission = () => setPermission(Notification.permission);
    window.addEventListener("focus", syncPermission);
    return () => window.removeEventListener("focus", syncPermission);
  }, [supported]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !accessToken ||
      !user?.id ||
      !import.meta.env.VITE_SUPABASE_URL
    ) {
      return undefined;
    }

    let active = true;
    const client = realtimeClient(accessToken);
    const channel = client
      .channel(
        `message-notifications:${user.id}:${Math.random().toString(36).slice(2)}`
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async ({ new: message }) => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({
            queryKey: ["conversation", message.conversation_id]
          });
          queryClient.invalidateQueries({
            queryKey: ["messages", message.conversation_id]
          });

          if (
            !active ||
            !enabled ||
            message.sender_id === user.id ||
            isViewingConversation(
              window.location.pathname,
              message.conversation_id
            )
          ) {
            return;
          }

          try {
            const response = await getConversation(message.conversation_id);
            if (
              !active ||
              isViewingConversation(
                window.location.pathname,
                message.conversation_id
              )
            ) {
              return;
            }

            const sender = conversationSender(response.data, message.sender_id);
            await showMessageNotification({
              conversationId: message.conversation_id,
              senderName: sender?.full_name ?? "Someone",
              body: message.body,
              senderAvatarUrl: sender?.avatarUrl
            });
          } catch {
            // A notification failure must never interrupt realtime chat.
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      client.removeChannel(channel);
    };
  }, [
    accessToken,
    enabled,
    isAuthenticated,
    queryClient,
    user?.id
  ]);

  const value = useMemo(
    () => ({
      disableNotifications,
      enabled,
      permission,
      preference,
      requestPermission,
      supported
    }),
    [
      disableNotifications,
      enabled,
      permission,
      preference,
      requestPermission,
      supported
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
