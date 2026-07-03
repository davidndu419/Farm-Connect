import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getConversation,
  markConversationRead
} from "../api/conversationsApi.js";
import { listMessages, sendMessage } from "../api/messagesApi.js";
import { Avatar } from "../components/common/Avatar.jsx";
import { ChatComposer } from "../components/messaging/ChatComposer.jsx";
import { MessageList } from "../components/messaging/MessageList.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useRealtimeChat } from "../hooks/useRealtimeChat.js";
import { participantProfilePath } from "../utils/participantProfilePath.js";

export function ChatPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const conversation = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId)
  });
  const messages = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => listMessages(conversationId)
  });
  const send = useMutation({
    mutationFn: (message) => sendMessage(conversationId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId]
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });

  useRealtimeChat(conversationId);

  useEffect(() => {
    if (!messages.data) return;
    markConversationRead(conversationId)
      .then(() =>
        queryClient.invalidateQueries({ queryKey: ["conversations"] })
      )
      .catch(() => {});
  }, [conversationId, messages.data, queryClient]);

  if (conversation.isLoading || messages.isLoading) {
    return (
      <div className="mx-auto grid min-h-96 max-w-4xl place-items-center rounded-3xl bg-white shadow-soft">
        <p className="text-ink/55">Loading conversation…</p>
      </div>
    );
  }
  if (conversation.isError || messages.isError) {
    return (
      <p
        className="mx-auto max-w-4xl rounded-2xl bg-white p-6 text-red-700"
        role="alert"
      >
        Conversation could not be loaded.
      </p>
    );
  }

  const details = conversation.data.data;
  const otherUser = details.otherUser;
  const profilePath = participantProfilePath(otherUser);

  return (
    <main className="mx-auto flex h-[calc(100dvh-12rem)] min-h-[34rem] max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-card">
      <header className="z-10 flex shrink-0 items-center gap-2 border-b border-ink/8 bg-white px-3 py-3 sm:gap-3 sm:px-5">
        <Link
          className="grid size-10 shrink-0 place-items-center rounded-full text-ink transition hover:bg-cream"
          to="/messages"
          aria-label="Back to messages"
        >
          <svg
            aria-hidden="true"
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15 18-6-6 6-6"
            />
          </svg>
        </Link>
        <Link
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 transition hover:bg-cream/70"
          to={profilePath}
          aria-label={`View ${otherUser.full_name}'s profile`}
        >
          <Avatar
            className="size-11"
            name={otherUser.full_name}
            src={otherUser.avatarUrl}
          />
          <div className="min-w-0">
            <h1 className="truncate font-bold">{otherUser.full_name}</h1>
            <p className="truncate text-xs text-ink/55">
              {details.productName}
            </p>
          </div>
        </Link>
      </header>

      <MessageList messages={messages.data.data} userId={user.id} />
      <ChatComposer onSend={(message) => send.mutateAsync(message)} />
    </main>
  );
}
