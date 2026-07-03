import { createClient } from "@supabase/supabase-js";

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false
};

export function createPublicSupabaseClient(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: authOptions
  });
}

export function createUserSupabaseClient(env, accessToken) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: authOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}
