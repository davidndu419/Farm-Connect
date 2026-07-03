import { sendData } from "../../utils/responses.js";
import {
  deleteAvatar,
  getBasicParticipantProfile,
  getOwnProfile,
  getPublicFarmerProfile,
  replaceAvatar,
  switchOwnRole,
  updateOwnProfile
} from "./profiles.service.js";

export async function getMe(request, response) {
  sendData(response, await getOwnProfile(request.supabase, request.user));
}

export async function updateMe(request, response) {
  sendData(
    response,
    await updateOwnProfile(request.supabase, request.user, request.body)
  );
}

export async function switchRole(request, response) {
  sendData(response, await switchOwnRole(request.supabase, request.body.role));
}

export async function uploadMyAvatar(request, response) {
  sendData(
    response,
    await replaceAvatar(request.supabase, request.user.id, request.file)
  );
}

export async function removeMyAvatar(request, response) {
  await deleteAvatar(request.supabase, request.user.id);
  response.sendStatus(204);
}

export function getPublicProfile(publicSupabase) {
  return async function publicProfile(request, response) {
    sendData(
      response,
      await getPublicFarmerProfile(publicSupabase, request.params.profileId)
    );
  };
}

export async function getBasicProfile(request, response) {
  sendData(
    response,
    await getBasicParticipantProfile(
      request.supabase,
      request.params.profileId
    )
  );
}
