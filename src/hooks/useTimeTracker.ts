import { useEffect } from "react";
import { format } from "date-fns";

const KEY = "studyos:usage-v1";
const KEEP_DAYS = 120;

export type UsageMap = Record<string, number>; // "yyyy-MM-dd" -> seconds on site

export function readUsage(): UsageMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UsageMap) : {};
  } catch {
    return {};
  }
}

function writeUsage(map: UsageMap) {
  try {
    const keys = Object.keys(map).sort();
    const trimmed: UsageMap = {};
    keys.slice(-KEEP_DAYS).forEach(k => { trimmed[k] = map[k]; });
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* storage unavailable — tracking is best-effort */
  }
}

export function addUsageSeconds(seconds: number) {
  if (!(seconds > 0)) return;
  const key = format(new Date(), "yyyy-MM-dd");
  const map = readUsage();
  map[key] = Math.round((map[key] ?? 0) + seconds);
  writeUsage(map);
}

/**
 * Tracks how long the app is actually open and focused.
 * Uses wall-clock deltas, so backgrounded tabs never inflate the total.
 */
export function useTimeTracker() {
  useEffect(() => {
    let last = Date.now();

    const isActive = () => document.visibilityState === "visible" && document.hasFocus();

    const flush = () => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      // Ignore absurd gaps (machine asleep) and inactive stretches.
      if (isActive() && delta > 0 && delta < 2 * 60 * 1000) addUsageSeconds(delta / 1000);
    };

    const resume = () => { last = Date.now(); };

    const id = window.setInterval(flush, 15000);
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("blur", flush);
    window.addEventListener("focus", resume);
    window.addEventListener("beforeunload", flush);

    return () => {
      flush();
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("blur", flush);
      window.removeEventListener("focus", resume);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);
}
