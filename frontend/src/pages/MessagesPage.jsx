import { useQuery } from "@tanstack/react-query";
import { listConversations } from "../api/conversationsApi.js";
import { ConversationItem } from "../components/messaging/ConversationItem.jsx";
import { useAuth } from "../hooks/useAuth.js";

export function MessagesPage() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations
  });
  const conversations = query.data?.data ?? [];

  return (
    <main className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-harvest">
          Your conversations
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold">Messages</h1>
      </div>

      <section
        className="overflow-hidden rounded-3xl bg-white shadow-soft"
        aria-label="Conversation inbox"
      >
        <div className="border-b border-ink/8 px-5 py-4">
          <h2 className="font-bold">Inbox</h2>
          <p className="mt-0.5 text-xs text-ink/50">
            Buyer and farmer conversations about your listings
          </p>
        </div>
        {query.isLoading ? (
          <p className="p-8 text-center text-ink/55">
            Loading conversations…
          </p>
        ) : null}
        {query.isError ? (
          <p role="alert" className="m-5 rounded-2xl bg-red-50 p-5 text-red-700">
            {query.error.message}
          </p>
        ) : null}
        {!query.isLoading && !query.isError ? (
          conversations.length ? (
            <div>
              {conversations.map((conversation) => (
                <ConversationItem
                  conversation={conversation}
                  key={conversation.id}
                  userId={user.id}
                />
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="font-display text-xl font-bold">
                No conversations yet
              </p>
              <p className="mt-2 text-sm text-ink/55">
                Product conversations will appear here.
              </p>
            </div>
          )
        ) : null}
      </section>
    </main>
  );
}
