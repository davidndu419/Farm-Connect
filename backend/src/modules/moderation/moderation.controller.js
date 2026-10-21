import { sendData } from "../../utils/responses.js";
import * as service from "./moderation.service.js";

export async function submitReport(request, response) {
  sendData(response, await service.submitReport(request.supabase, request.body), 201);
}

export async function dashboard(request, response) {
  sendData(response, await service.getDashboard(request.supabase));
}

export async function users(request, response) {
  sendData(response, await service.searchUsers(request.supabase, request.validated.query));
}

export async function products(request, response) {
  sendData(response, await service.searchProducts(request.supabase, request.validated.query));
}

export async function conversations(request, response) {
  sendData(response, await service.searchConversations(request.supabase, request.validated.query));
}

export async function messages(request, response) {
  sendData(
    response,
    await service.getConversationMessages(
      request.supabase,
      request.params.conversationId,
      request.validated.query
    )
  );
}

export async function reports(request, response) {
  sendData(response, await service.searchReports(request.supabase, request.validated.query));
}

export async function audit(request, response) {
  sendData(response, await service.getAuditLog(request.supabase, request.validated.query));
}

export async function accountStatus(request, response) {
  sendData(
    response,
    await service.setAccountStatus(request.supabase, request.params.userId, request.body)
  );
}

export async function membership(request, response) {
  sendData(
    response,
    await service.setAdminMembership(request.supabase, request.params.userId, request.body)
  );
}

export async function productModeration(request, response) {
  sendData(
    response,
    await service.moderateProduct(request.supabase, request.params.productId, request.body)
  );
}

export async function reportStatus(request, response) {
  sendData(
    response,
    await service.updateReport(request.supabase, request.params.reportId, request.body)
  );
}
