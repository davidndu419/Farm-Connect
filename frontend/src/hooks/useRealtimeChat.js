import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { realtimeClient } from "../services/supabaseRealtime.js";
import { useAuth } from "./useAuth.js";

export function useRealtimeChat(conversationId) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      !accessToken ||
      !conversationId ||
      !import.meta.env.VITE_SUPABASE_URL
    ) {
      return undefined;
    }

    const client = realtimeClient(accessToken);
    const channel = client
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["messages", conversationId]
          });
          queryClient.invalidateQueries({
            queryKey: ["conversation", conversationId]
          });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [accessToken, conversationId, queryClient]);
}
