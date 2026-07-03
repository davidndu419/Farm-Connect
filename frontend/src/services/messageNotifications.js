export const NOTIFICATION_PREFERENCE_KEY =
  "farm-connect-message-notifications";

export function isViewingConversation(pathname, conversationId) {
  const normalizedPath = pathname.replace(/\/+$/, "");
  return normalizedPath === `/messages/${conversationId}`;
}

export function messagePreview(body, maximumLength = 90) {
  const normalized = (body || "Sent an image").replace(/\s+/g, " ").trim();
  return normalized.length > maximumLength
    ? `${normalized.slice(0, maximumLength - 1)}…`
    : normalized;
}

export function conversationSender(conversation, senderId) {
  if (conversation.buyer_id === senderId) return conversation.buyer;
  if (conversation.farmer_id === senderId) return conversation.farmer;
  return null;
}

export async function showMessageNotification({
  conversationId,
  senderName,
  body,
  senderAvatarUrl
}) {
  const url = `/messages/${conversationId}`;
  const options = {
    body: `${senderName}: ${messagePreview(body)}`,
    icon: senderAvatarUrl || "/branding/app-icon.png",
    badge: "/icons/icon-192.png",
    tag: `farm-connect-conversation-${conversationId}`,
    data: { url }
  };

  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration?.showNotification) {
    await registration.showNotification(
      "New message on Farm Connect",
      options
    );
    return;
  }

  const notification = new Notification(
    "New message on Farm Connect",
    options
  );
  notification.onclick = () => {
    window.focus();
    window.location.assign(url);
    notification.close();
  };
}
