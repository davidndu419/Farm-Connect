import { publicStorageUrl, removeStoredFile, uploadAvatar } from "../../services/storage.service.js";
import { ApiError } from "../../utils/ApiError.js";

function withAvatarUrl(supabase, profile) {
  return {
    ...profile,
    avatarUrl: profile.avatar_path
      ? publicStorageUrl(supabase, "avatars", profile.avatar_path)
      : null
  };
}

export async function getOwnProfile(supabase, user) {
  const [publicResult, privateResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("profile_private")
      .select("phone")
      .eq("user_id", user.id)
      .single()
  ]);

  if (publicResult.error || privateResult.error) {
    throw ApiError.notFound("The account profile was not found.");
  }

  return {
    ...withAvatarUrl(supabase, publicResult.data),
    phone: privateResult.data.phone,
    email: user.email
  };
}

export async function updateOwnProfile(supabase, user, input) {
  const { data, error } = await supabase.rpc("update_my_profile", {
    target_full_name: input.fullName,
    target_phone: input.phone,
    target_address: input.address,
    target_state: input.state,
    target_city: input.city
  });

  if (error) {
    throw ApiError.badRequest("The profile could not be updated.");
  }

  return {
    ...withAvatarUrl(supabase, data),
    email: user.email
  };
}

export async function switchOwnRole(supabase, role) {
  const { data, error } = await supabase.rpc("switch_user_role", {
    target_role: role
  });

  if (error) {
    throw ApiError.badRequest("The account role could not be changed.");
  }

  return {
    profile: withAvatarUrl(supabase, data.profile)
  };
}

export async function getPublicFarmerProfile(supabase, profileId) {
  const { data, error } = await supabase
    .rpc("get_public_farmer_profile", {
      target_profile_id: profileId
    })
    .single();

  if (error || !data) {
    throw ApiError.notFound("Seller profile not found.");
  }

  return withAvatarUrl(supabase, data);
}

export async function getBasicParticipantProfile(supabase, profileId) {
  const { data, error } = await supabase
    .rpc("get_conversation_profile", {
      target_profile_id: profileId
    })
    .single();

  if (error || !data) {
    throw ApiError.notFound("User profile not found.");
  }

  return withAvatarUrl(supabase, data);
}

export async function replaceAvatar(supabase, userId, file) {
  if (!file) {
    throw ApiError.badRequest("Choose an avatar image to upload.");
  }

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", userId)
    .single();

  if (readError) {
    throw ApiError.notFound("The account profile was not found.");
  }

  const newPath = await uploadAvatar(supabase, userId, file);
  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_path: newPath })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    await removeStoredFile(supabase, "avatars", newPath).catch(() => {});
    throw ApiError.badRequest("The avatar could not be saved to the profile.");
  }

  if (profile.avatar_path) {
    await removeStoredFile(supabase, "avatars", profile.avatar_path).catch(
      () => {}
    );
  }

  return withAvatarUrl(supabase, data);
}

export async function deleteAvatar(supabase, userId) {
  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", userId)
    .single();

  if (readError) {
    throw ApiError.notFound("The account profile was not found.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", userId);

  if (error) {
    throw ApiError.badRequest("The avatar could not be removed.");
  }

  await removeStoredFile(supabase, "avatars", profile.avatar_path).catch(
    () => {}
  );
}
