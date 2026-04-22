import { useCallback, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export type Theme = "dark" | "light";

export function useTheme() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const theme: Theme = (profile?.theme as Theme) ?? "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const setTheme = useCallback(
    async (next: Theme) => {
      // Optimistic
      document.documentElement.classList.toggle("light", next === "light");
      if (!user) return;
      await supabase.from("profiles").update({ theme: next }).eq("user_id", user.id);
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    [user, qc],
  );

  const toggle = useCallback(() => setTheme(theme === "light" ? "dark" : "light"), [theme, setTheme]);

  return { theme, setTheme, toggle };
}
