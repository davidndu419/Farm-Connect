import { sendData } from "../../utils/responses.js";
import * as service from "./conversations.service.js";

export async function list(request, response) {
  sendData(
    response,
    await service.listConversations(
      request.supabase,
      request.validated.query.limit,
      request.user.id
    )
  );
}
export async function start(request, response) {
  const result = await service.startConversation(
    request.supabase,
    request.body.productId,
    request.user.id
  );
  sendData(response, result.conversation, result.created ? 201 : 200);
}
export async function get(request, response) {
  sendData(
    response,
    await service.getConversation(
      request.supabase,
      request.params.conversationId,
      request.user.id
    )
  );
}
export async function read(request, response) {
  sendData(response, await service.markRead(request.supabase, request.params.conversationId));
}
