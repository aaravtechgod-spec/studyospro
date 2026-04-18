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

export const useAddXp = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => {
      const { data: profile } = await supabase
        .from("profiles").select("xp, level, last_active_date, streak_days")
        .eq("user_id", user!.id).maybeSingle();
      if (!profile) return;
      const newXp = profile.xp + amount;
      const newLevel = levelFromXp(newXp);
      const today = new Date().toISOString().slice(0, 10);
      const last = profile.last_active_date;
      let newStreak = profile.streak_days;
      if (last !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        newStreak = last === yesterday ? profile.streak_days + 1 : 1;
      }
      await supabase.from("profiles").update({
        xp: newXp, level: newLevel, last_active_date: today, streak_days: newStreak,
      }).eq("user_id", user!.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};
