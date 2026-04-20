import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";

export const BOARDS = ["CBSE", "ICSE", "IB", "IGCSE", "State Board", "Other"] as const;
export const CLASSES = [
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12", "Undergrad", "Other",
] as const;
export const DIFFICULTIES = ["easy", "medium", "hard", "exam"] as const;
export const TONES = ["friendly", "concise", "strict", "socratic"] as const;
export const CURRICULA = ["NCERT", "Cambridge", "IB MYP/DP", "Other"] as const;

export interface AIPrefs {
  ai_board: string;
  ai_class: string;
  ai_curriculum: string;
  ai_difficulty: string;
  ai_tone: string;
  ai_focus_subjects: string[];
  ai_web_search: boolean;
  ai_image_gen: boolean;
}

export const DEFAULT_PREFS: AIPrefs = {
  ai_board: "CBSE",
  ai_class: "Class 10",
  ai_curriculum: "NCERT",
  ai_difficulty: "medium",
  ai_tone: "friendly",
  ai_focus_subjects: [],
  ai_web_search: false,
  ai_image_gen: true,
};

export const useAIPrefs = (): AIPrefs => {
  const { data: profile } = useProfile();
  if (!profile) return DEFAULT_PREFS;
  const p = profile as any;
  return {
    ai_board: p.ai_board ?? DEFAULT_PREFS.ai_board,
    ai_class: p.ai_class ?? DEFAULT_PREFS.ai_class,
    ai_curriculum: p.ai_curriculum ?? DEFAULT_PREFS.ai_curriculum,
    ai_difficulty: p.ai_difficulty ?? DEFAULT_PREFS.ai_difficulty,
    ai_tone: p.ai_tone ?? DEFAULT_PREFS.ai_tone,
    ai_focus_subjects: p.ai_focus_subjects ?? [],
    ai_web_search: p.ai_web_search ?? DEFAULT_PREFS.ai_web_search,
    ai_image_gen: p.ai_image_gen ?? DEFAULT_PREFS.ai_image_gen,
  };
};

export const useUpdateAIPrefs = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<AIPrefs>) => {
      const { error } = await supabase.from("profiles").update(patch as any).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};
