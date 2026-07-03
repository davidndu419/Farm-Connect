import { publicStorageUrl } from "../../services/storage.service.js";
import { ApiError } from "../../utils/ApiError.js";

const select = `
  *,
  buyer:profiles!conversations_buyer_id_fkey(id, full_name, role, avatar_path, state, city),
  farmer:profiles!conversations_farmer_id_fkey(id, full_name, role, avatar_path, state, city),
  last_message:messages!conversations_last_message_id_fkey(id, sender_id, body, message_type, created_at)
`;

function participantWithAvatar(supabase, participant) {
  if (!participant) return null;
  return {
    ...participant,
    avatarUrl: participant.avatar_path
      ? publicStorageUrl(supabase, "avatars", participant.avatar_path)
      : null
  };
}

function serializeConversation(supabase, conversation, userId) {
  const buyer = participantWithAvatar(supabase, conversation.buyer);
  const farmer = participantWithAvatar(supabase, conversation.farmer);
  const isBuyer = conversation.buyer_id === userId;
  const otherUser = isBuyer ? farmer : buyer;
  const lastReadAt = isBuyer
    ? conversation.buyer_last_read_at
    : conversation.farmer_last_read_at;
  const lastMessageAt =
    conversation.last_message?.created_at ?? conversation.last_message_at;
  const unread = Boolean(
    conversation.last_message &&
      conversation.last_message.sender_id !== userId &&
      (!lastReadAt || new Date(lastMessageAt) > new Date(lastReadAt))
  );

  return {
    ...conversation,
    buyer,
    farmer,
    otherUser,
    productName: conversation.product_title_snapshot,
    lastMessage: conversation.last_message,
    lastMessageAt,
    unread
  };
}

export async function listConversations(supabase, limit, userId) {
  const { data, error } = await supabase
    .from("conversations")
    .select(select)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw ApiError.badRequest("Conversations could not be loaded.");
  return data.map((conversation) =>
    serializeConversation(supabase, conversation, userId)
  );
}

export async function getConversation(supabase, id, userId) {
  const { data, error } = await supabase
    .from("conversations")
    .select(select)
    .eq("id", id)
    .single();
  if (error || !data) throw ApiError.notFound("Conversation not found.");
  return serializeConversation(supabase, data, userId);
}

export async function startConversation(supabase, productId, userId) {
  const { data, error } = await supabase.rpc("start_conversation", {
    target_product_id: productId
  });
  if (error) {
    throw ApiError.badRequest(
      error.message ?? "Conversation could not be started."
    );
  }
  const result = data[0];
  return {
    conversation: await getConversation(
      supabase,
      result.conversation_id,
      userId
    ),
    created: result.created
  };
}

export async function markRead(supabase, id) {
  const { data, error } = await supabase.rpc("mark_conversation_read", {
    target_conversation_id: id
  });
  if (error) throw ApiError.forbidden("Conversation access denied.");
  return data;
}
