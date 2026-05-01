import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Pace, Track } from "@/lib/aimlPacing";

export interface AimlSettings {
  id: string;
  user_id: string;
  pace: Pace;
  track: Track;
  start_date: string;
  vacation_until: string | null;
  freeze_tokens: number;
  freezes_used: number;
  daily_minutes: number | null;
  reminder_time: string | null;
  reminder_enabled: boolean;
  public_leaderboard: boolean;
}

const DEFAULTS: Omit<AimlSettings, "id" | "user_id"> = {
  pace: "standard",
  track: "engineer",
  start_date: new Date().toISOString().slice(0, 10),
  vacation_until: null,
  freeze_tokens: 0,
  freezes_used: 0,
  daily_minutes: null,
  reminder_time: null,
  reminder_enabled: false,
  public_leaderboard: false,
};

export function useAimlSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["aiml-settings", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AimlSettings> => {
      const { data, error } = await supabase
        .from("aiml_settings" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as unknown as AimlSettings;
      // Auto-create row on first access.
      const { data: created, error: insErr } = await supabase
        .from("aiml_settings" as any)
        .insert({ user_id: user!.id, ...DEFAULTS })
        .select("*")
        .single();
      if (insErr) throw insErr;
      return created as unknown as AimlSettings;
    },
  });
}

export function useUpdateAimlSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<AimlSettings>) => {
      const { data, error } = await supabase
        .from("aiml_settings" as any)
        .update(patch)
        .eq("user_id", user!.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as AimlSettings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aiml-settings", user?.id] }),
  });
}
