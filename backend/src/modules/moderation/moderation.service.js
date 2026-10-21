import { publicStorageUrl } from "../../services/storage.service.js";
import { ApiError } from "../../utils/ApiError.js";

function rpcError(error, fallback) {
  if (error?.code === "42501") return ApiError.forbidden(error.message);
  if (error?.code === "23505") return ApiError.conflict(error.message);
  if (error?.code === "P0002") return ApiError.notFound(error.message);
  return ApiError.badRequest(error?.message ?? fallback);
}

async function rpc(supabase, name, parameters, fallback) {
  const { data, error } = await supabase.rpc(name, parameters);
  if (error) throw rpcError(error, fallback);
  return data;
}

function avatarUrl(supabase, path) {
  return path ? publicStorageUrl(supabase, "avatars", path) : null;
}

async function signChatMedia(supabase, items, pathSelector, urlKey) {
  const paths = [
    ...new Set(items.map(pathSelector).filter(Boolean))
  ];
  if (!paths.length) return items;

  const { data, error } = await supabase.storage
    .from("chat-media")
    .createSignedUrls(paths, 60 * 60);
  if (error) return items;

  const signed = new Map(
    data.filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl])
  );
  return items.map((item) => ({
    ...item,
    [urlKey]: signed.get(pathSelector(item)) ?? null
  }));
}

export function submitReport(supabase, input) {
  return rpc(
    supabase,
    "submit_user_report",
    {
      target_user_id: input.reportedUserId,
      report_category: input.category,
      report_details: input.details,
      target_conversation_id: input.conversationId ?? null,
      target_message_id: input.messageId ?? null
    },
    "The report could not be submitted."
  );
}

export function getDashboard(supabase) {
  return rpc(
    supabase,
    "admin_dashboard",
    undefined,
    "The dashboard could not be loaded."
  );
}

export async function searchUsers(supabase, filters) {
  const data = await rpc(
    supabase,
    "admin_search_users",
    {
      search_text: filters.search ?? null,
      status_filter: filters.status,
      role_filter: filters.role,
      admin_filter: filters.admin,
      page_limit: filters.limit,
      page_offset: filters.offset
    },
    "Users could not be loaded."
  );

  return {
    ...data,
    items: data.items.map((user) => ({
      ...user,
      avatarUrl: avatarUrl(supabase, user.avatarPath)
    }))
  };
}

export async function searchProducts(supabase, filters) {
  const data = await rpc(
    supabase,
    "admin_search_products",
    {
      search_text: filters.search ?? null,
      status_filter: filters.status,
      moderation_filter: filters.moderation,
      page_limit: filters.limit,
      page_offset: filters.offset
    },
    "Products could not be loaded."
  );

  return {
    ...data,
    items: data.items.map((product) => ({
      ...product,
      images: product.images.map((image) => ({
        ...image,
        url: publicStorageUrl(supabase, "product-images", image.storagePath)
      }))
    }))
  };
}

export async function searchConversations(supabase, filters) {
  const data = await rpc(
    supabase,
    "admin_search_conversations",
    {
      search_text: filters.search ?? null,
      page_limit: filters.limit,
      page_offset: filters.offset
    },
    "Conversations could not be loaded."
  );

  return {
    ...data,
    items: data.items.map((conversation) => ({
      ...conversation,
      buyer: {
        ...conversation.buyer,
        avatarUrl: avatarUrl(supabase, conversation.buyer.avatarPath)
      },
      farmer: {
        ...conversation.farmer,
        avatarUrl: avatarUrl(supabase, conversation.farmer.avatarPath)
      }
    }))
  };
}

export async function getConversationMessages(supabase, id, filters) {
  const data = await rpc(
    supabase,
    "admin_conversation_messages",
    {
      target_conversation_id: id,
      page_limit: filters.limit,
      page_offset: filters.offset
    },
    "Conversation messages could not be loaded."
  );

  return {
    ...data,
    messages: await signChatMedia(
      supabase,
      data.messages,
      (message) => message.mediaPath,
      "mediaUrl"
    )
  };
}

export async function searchReports(supabase, filters) {
  const data = await rpc(
    supabase,
    "admin_search_reports",
    {
      status_filter: filters.status,
      page_limit: filters.limit,
      page_offset: filters.offset
    },
    "Reports could not be loaded."
  );

  const items = await signChatMedia(
    supabase,
    data.items,
    (report) => report.evidence?.mediaPath,
    "evidenceMediaUrl"
  );
  return { ...data, items };
}

export function getAuditLog(supabase, filters) {
  return rpc(
    supabase,
    "admin_audit_log",
    {
      page_limit: filters.limit,
      page_offset: filters.offset
    },
    "The audit log could not be loaded."
  );
}

export function setAccountStatus(supabase, userId, input) {
  return rpc(
    supabase,
    "admin_set_account_status",
    {
      target_user_id: userId,
      target_status: input.status,
      action_reason: input.reason
    },
    "The account status could not be updated."
  );
}

export function setAdminMembership(supabase, userId, input) {
  return rpc(
    supabase,
    "admin_set_membership",
    {
      target_user_id: userId,
      make_admin: input.isAdmin,
      action_reason: input.reason
    },
    "Administrator access could not be updated."
  );
}

export function moderateProduct(supabase, productId, input) {
  return rpc(
    supabase,
    "admin_moderate_product",
    {
      target_product_id: productId,
      hide_product: input.hidden,
      action_reason: input.reason
    },
    "The product moderation action could not be completed."
  );
}

export function updateReport(supabase, reportId, input) {
  return rpc(
    supabase,
    "admin_update_report",
    {
      target_report_id: reportId,
      target_status: input.status,
      target_resolution_notes: input.resolutionNotes
    },
    "The report could not be updated."
  );
}
