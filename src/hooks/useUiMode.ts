import { useCallback, useEffect, useState } from "react";

export type UiMode = "current" | "liquid-glass";

const UI_MODE_KEY = "studyos:ui-mode-v1";

function readUiMode(): UiMode {
  try {
    return window.localStorage.getItem(UI_MODE_KEY) === "current" ? "current" : "liquid-glass";
  } catch {
    return "liquid-glass";
  }
}

export function useUiMode() {
  const [mode, setMode] = useState<UiMode>(readUiMode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("liquid-glass", mode === "liquid-glass");
    root.classList.toggle("glass-dark", mode === "liquid-glass" && !root.classList.contains("light"));
    try {
      window.localStorage.setItem(UI_MODE_KEY, mode);
    } catch {
      // The selected mode still applies for this visit if storage is unavailable.
    }
  }, [mode]);

  const setUiMode = useCallback((next: UiMode) => setMode(next), []);

  return { mode, setUiMode };
}