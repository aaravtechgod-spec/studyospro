import { useCallback, useEffect, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useUiMode } from "@/hooks/useUiMode";

export type Theme = "dark" | "light";
const GLASS_THEME_KEY = "studyos:liquid-glass-theme-v1";

function readGlassTheme(): Theme {
  try {
    return window.localStorage.getItem(GLASS_THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function useTheme() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { mode } = useUiMode();
  const qc = useQueryClient();
  const [glassTheme, setGlassTheme] = useState<Theme>(readGlassTheme);
  const profileTheme: Theme = (profile?.theme as Theme) ?? "dark";
  const theme: Theme = mode === "liquid-glass" ? glassTheme : profileTheme;

  useEffect(() => {
    const syncGlassTheme = (event: Event) => {
      const nextTheme = (event as CustomEvent<Theme>).detail;
      if (nextTheme === "light" || nextTheme === "dark") setGlassTheme(nextTheme);
    };
    window.addEventListener("studyos:glass-theme-change", syncGlassTheme);
    return () => window.removeEventListener("studyos:glass-theme-change", syncGlassTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("glass-dark", mode === "liquid-glass" && theme === "dark");
  }, [theme, mode]);

  const setTheme = useCallback(
    async (next: Theme) => {
      // Optimistic
      document.documentElement.classList.toggle("light", next === "light");
      if (mode === "liquid-glass") {
        setGlassTheme(next);
        window.dispatchEvent(new CustomEvent<Theme>("studyos:glass-theme-change", { detail: next }));
        try { window.localStorage.setItem(GLASS_THEME_KEY, next); } catch { /* storage unavailable */ }
        return;
      }
      if (!user) return;
      await supabase.from("profiles").update({ theme: next }).eq("user_id", user.id);
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    [user, qc, mode],
  );

  const toggle = useCallback(() => setTheme(theme === "light" ? "dark" : "light"), [theme, setTheme]);

  return { theme, setTheme, toggle };
}
