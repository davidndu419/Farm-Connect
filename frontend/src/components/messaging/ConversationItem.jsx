import { Link } from "react-router-dom";
import { formatConversationTime } from "../../utils/formatMessageTime.js";
import { Avatar } from "../common/Avatar.jsx";

export function ConversationItem({ conversation, userId }) {
  const otherUser = conversation.otherUser;
  const lastMessage = conversation.lastMessage;
  const sentByCurrentUser = lastMessage?.sender_id === userId;
  const preview =
    lastMessage?.body ||
    (["image", "mixed"].includes(lastMessage?.message_type)
      ? "Photo"
      : "No messages yet");

  return (
    <Link
      className="group flex min-w-0 gap-3 border-b border-ink/8 px-4 py-4 transition last:border-b-0 hover:bg-cream/70 active:bg-mint/25 sm:gap-4 sm:px-5"
      to={`/messages/${conversation.id}`}
      aria-label={`Open conversation with ${otherUser.full_name}`}
    >
      <Avatar
        className="size-12 sm:size-14"
        name={otherUser.full_name}
        src={otherUser.avatarUrl}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`truncate text-[0.98rem] ${
              conversation.unread ? "font-extrabold" : "font-bold"
            }`}
          >
            {otherUser.full_name}
          </p>
          <time
            className={`shrink-0 text-xs ${
              conversation.unread ? "font-bold text-leaf" : "text-ink/45"
            }`}
            dateTime={conversation.lastMessageAt ?? undefined}
          >
            {formatConversationTime(conversation.lastMessageAt)}
          </time>
        </div>
        <p className="mt-0.5 truncate text-xs font-semibold text-harvest">
          {conversation.productName}
        </p>
        <div className="mt-1 flex min-w-0 items-center justify-between gap-3">
          <p
            className={`truncate text-sm ${
              conversation.unread ? "font-semibold text-ink" : "text-ink/55"
            }`}
          >
            {`${sentByCurrentUser && lastMessage ? "You: " : ""}${preview}`}
          </p>
          {conversation.unread ? (
            <span className="shrink-0 rounded-full bg-leaf px-2 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-white">
              New
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
