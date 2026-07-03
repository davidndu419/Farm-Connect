import { sendData } from "../../utils/responses.js";
import * as service from "./messages.service.js";

export async function list(request, response) {
  const result = await service.listMessages(
    request.supabase,
    request.params.conversationId,
    request.validated.query
  );
  sendData(response, result.messages, 200, { nextCursor: result.nextCursor });
}
export async function send(request, response) {
  sendData(
    response,
    await service.sendMessage(
      request.supabase,
      request.user.id,
      request.params.conversationId,
      request.body.body,
      request.file
    ),
    201
  );
}
