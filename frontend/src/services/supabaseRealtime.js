import { createClient } from "@supabase/supabase-js";

let client;
export function realtimeClient(accessToken) {
  if (!client) {
    client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  client.realtime.setAuth(accessToken);
  return client;
}
