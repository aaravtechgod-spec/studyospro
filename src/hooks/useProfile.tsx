import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  theme: string;
}

export const xpForLevel = (level: number) => 100 * level * level;
export const levelFromXp = (xp: number) => {
  let lvl = 1;
  while (xp >= xpForLevel(lvl)) lvl++;
  return lvl;
};

export const useProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
};

// Server-authoritative XP. The client never picks the amount —
// it just tells the server which event happened, and the award_xp RPC
// (SECURITY DEFINER) decides how much XP to grant.
export type XpEvent =
  | { event_type: "task_complete"; ref_id: string }
  | { event_type: "flashcard_review" }
  | { event_type: "focus_session"; ref_id: string };

export const useAwardXp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: XpEvent) => {
      const { data, error } = await supabase.rpc("award_xp", {
        _event_type: event.event_type,
        _ref_id: "ref_id" in event ? event.ref_id : null,
      } as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as { xp: number; level: number; streak_days: number } | null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};
