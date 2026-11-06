import { useCallback, useEffect, useState } from "react";

export type UiMode = "current" | "liquid-glass";

const UI_MODE_KEY = "studyos:ui-mode-v1";

export function readUiMode(storage: Pick<Storage, "getItem"> = window.localStorage): UiMode {
  try {
    return storage.getItem(UI_MODE_KEY) === "current" ? "current" : "liquid-glass";
  } catch {
    return "liquid-glass";
  }
}

export function useUiMode() {
  const [mode, setMode] = useState<UiMode>(readUiMode);

  useEffect(() => {
    const syncMode = (event: Event) => {
      const nextMode = (event as CustomEvent<UiMode>).detail;
      if (nextMode === "current" || nextMode === "liquid-glass") setMode(nextMode);
    };
    window.addEventListener("studyos:ui-mode-change", syncMode);
    return () => window.removeEventListener("studyos:ui-mode-change", syncMode);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("liquid-glass", mode === "liquid-glass");
    if (mode !== "liquid-glass") root.classList.remove("glass-dark");
    try {
      window.localStorage.setItem(UI_MODE_KEY, mode);
    } catch {
      // The selected mode still applies for this visit if storage is unavailable.
    }
  }, [mode]);

  const setUiMode = useCallback((next: UiMode) => {
    setMode(next);
    window.dispatchEvent(new CustomEvent<UiMode>("studyos:ui-mode-change", { detail: next }));
  }, []);

  return { mode, setUiMode };
}