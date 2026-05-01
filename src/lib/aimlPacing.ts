// Pacing helpers — derive target completion date from pace + start date.
import { TOTAL_DAYS } from "./aimlRoadmap";

export type Pace = "sprint" | "standard" | "chill";

export const PACE_INFO: Record<Pace, { label: string; hoursPerDay: number; daysPerWeek: number; emoji: string }> = {
  sprint:   { label: "Sprint",   hoursPerDay: 3, daysPerWeek: 6, emoji: "🚀" },
  standard: { label: "Standard", hoursPerDay: 2, daysPerWeek: 5, emoji: "🎯" },
  chill:    { label: "Chill",    hoursPerDay: 1, daysPerWeek: 4, emoji: "🌿" },
};

export function projectedFinish(pace: Pace, startDate: Date, completedCount: number): Date {
  const remaining = Math.max(0, TOTAL_DAYS - completedCount);
  const perWeek = PACE_INFO[pace].daysPerWeek;
  const weeksLeft = remaining / perWeek;
  const start = new Date(startDate);
  // Use the bigger of (start + weeks) or (today + weeks).
  const today = new Date();
  const base = start > today ? start : today;
  const finish = new Date(base);
  finish.setDate(finish.getDate() + Math.ceil(weeksLeft * 7));
  return finish;
}

export function daysSince(d: Date | string): number {
  const dt = typeof d === "string" ? new Date(d) : d;
  return Math.floor((Date.now() - dt.getTime()) / 86_400_000);
}

export function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export type Track = "researcher" | "engineer" | "applied";

export const TRACK_INFO: Record<Track, { label: string; emoji: string; tagline: string }> = {
  researcher: { label: "Researcher",         emoji: "🔬", tagline: "Papers, theory, novel ideas" },
  engineer:   { label: "ML Engineer",        emoji: "⚙️", tagline: "Production systems at scale" },
  applied:    { label: "Applied LLM Dev",    emoji: "🤖", tagline: "RAG, agents, prompt eng" },
};

export const PHASE_BADGES: Record<number, { name: string; emoji: string }> = {
  1: { name: "Pythonista",      emoji: "🐍" },
  2: { name: "Math Mage",        emoji: "📐" },
  3: { name: "Data Wrangler",    emoji: "🐼" },
  4: { name: "ML Practitioner",  emoji: "🌲" },
  5: { name: "Deep Diver",       emoji: "🧠" },
  6: { name: "NLP Adept",        emoji: "💬" },
  7: { name: "LLM Whisperer",    emoji: "✨" },
  8: { name: "MLOps Captain",    emoji: "🚢" },
  9: { name: "Job-Ready",        emoji: "🏆" },
};

export const MILESTONES = [25, 50, 75, 100, 150, 168];
