import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useAwardXp } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, RotateCcw, Plus, Trash2, Bell, BellOff, Repeat, Timer as TimerIcon, Watch, Flag } from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";

type Preset = { label: string; min: number; type: "focus" | "break"; id?: string };
type SavedTimerState = { userId: string; label: string; min: number; type: Preset["type"]; secondsLeft: number; running: boolean; endsAt: number | null; startedAt: string | null };
type SavedStopwatchState = { userId: string; elapsedMs: number; runningSince: number | null; startedAt?: string | null };
const TIMER_STATE_KEY = "studyos:timer-state-v1";
const STOPWATCH_STATE_KEY = "studyos:stopwatch-state-v1";

function readSavedState<T extends { userId: string }>(key: string, userId?: string): T | null {
  if (!userId) return null;
  try {
    const state = JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
    return state?.userId === userId ? state : null;
  } catch {
    return null;
  }
}
const BUILTIN: Preset[] = [
  { label: "Focus 25", min: 25, type: "focus" },
  { label: "Short break 5", min: 5, type: "break" },
  { label: "Long break 15", min: 15, type: "break" },
  { label: "Deep work 50", min: 50, type: "focus" },
];

const beep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.55);
  } catch {}
};

export default function Timer() {
  const { user } = useAuth();
  const awardXp = useAwardXp();
  const qc = useQueryClient();
  const [savedTimer] = useState(() => readSavedState<SavedTimerState>(TIMER_STATE_KEY, user?.id));
  const [savedStopwatch] = useState(() => readSavedState<SavedStopwatchState>(STOPWATCH_STATE_KEY, user?.id));
  const initialPreset: Preset = savedTimer
    ? { label: savedTimer.label, min: savedTimer.min, type: savedTimer.type }
    : BUILTIN[0];
  const restoredTimerRunning = savedTimer?.running ?? false;
  const [selected, setSelected] = useState<Preset>(initialPreset);
  const [secondsLeft, setSecondsLeft] = useState(restoredTimerRunning && savedTimer?.endsAt !== null
    ? Math.max(0, Math.ceil(((savedTimer?.endsAt ?? 0) - Date.now()) / 1000))
    : savedTimer?.secondsLeft ?? initialPreset.min * 60);
  const [running, setRunning] = useState(restoredTimerRunning);
  const [subjectId, setSubjectId] = useState<string>("");
  const [goal, setGoal] = useState("");
  const [autoCycle, setAutoCycle] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [notify, setNotify] = useState(false);
  const [customMin, setCustomMin] = useState(30);
  const [presetLabel, setPresetLabel] = useState("");
  const intervalRef = useRef<number | null>(null);
  const timerEndRef = useRef<number | null>(restoredTimerRunning ? savedTimer?.endsAt ?? null : null);
  const timerStartedAtRef = useRef<string | null>(savedTimer?.startedAt ?? null);
  const completeRef = useRef<() => void>(() => {});

  // Stopwatch state
  const [mode, setMode] = useState<"timer" | "stopwatch">("timer");
  const restoredSwMs = (savedStopwatch?.elapsedMs ?? 0) + (savedStopwatch?.runningSince ? Date.now() - savedStopwatch.runningSince : 0);
  const [swMs, setSwMs] = useState(restoredSwMs);
  const [swRunning, setSwRunning] = useState(!!savedStopwatch?.runningSince);
  const [laps, setLaps] = useState<number[]>([]);
  const swStartRef = useRef<number | null>(savedStopwatch?.runningSince ?? null);
  const swStartedAtRef = useRef<string | null>(savedStopwatch?.startedAt ?? null);
  const swBaseRef = useRef(savedStopwatch?.elapsedMs ?? 0);
  const swIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!swRunning) return;
    const tick = () => {
      setSwMs(swBaseRef.current + (Date.now() - (swStartRef.current ?? Date.now())));
    };
    tick();
    swIntervalRef.current = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      if (swIntervalRef.current !== null) window.clearInterval(swIntervalRef.current);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [swRunning]);

  useEffect(() => {
    if (!user) return;
    const state: SavedTimerState = {
      userId: user.id,
      label: selected.label,
      min: selected.min,
      type: selected.type,
      secondsLeft: running && timerEndRef.current !== null
        ? Math.max(0, Math.ceil((timerEndRef.current - Date.now()) / 1000))
        : secondsLeft,
      running,
      endsAt: running ? timerEndRef.current : null,
      startedAt: timerStartedAtRef.current,
    };
    try { localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [user?.id, selected, running]);

  useEffect(() => {
    if (!user) return;
    const state: SavedStopwatchState = {
      userId: user.id,
      elapsedMs: swBaseRef.current,
      runningSince: swRunning ? swStartRef.current : null,
      startedAt: swStartedAtRef.current,
    };
    try { localStorage.setItem(STOPWATCH_STATE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [user?.id, swRunning]);

  const swReset = () => {
    setSwRunning(false);
    setSwMs(0);
    swBaseRef.current = 0;
    swStartRef.current = null;
    swStartedAtRef.current = null;
    setLaps([]);
    try { localStorage.removeItem(STOPWATCH_STATE_KEY); } catch { /* storage unavailable */ }
  };
  const toggleStopwatch = () => {
    if (swRunning) {
      const elapsed = swBaseRef.current + (Date.now() - (swStartRef.current ?? Date.now()));
      swBaseRef.current = elapsed;
      setSwMs(elapsed);
      swStartRef.current = null;
      setSwRunning(false);
    } else {
      swStartedAtRef.current ??= new Date().toISOString();
      swStartRef.current = Date.now();
      setSwRunning(true);
    }
  };
  const swLap = () => setLaps(ls => [swMs, ...ls]);
  const fmtSw = (ms: number) => {
    const totalCs = Math.floor(ms / 10);
    const cs = totalCs % 100;
    const totalS = Math.floor(totalCs / 100);
    const s = totalS % 60;
    const totalM = Math.floor(totalS / 60);
    const m = totalM % 60;
    const h = Math.floor(totalM / 60);
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    const cc = String(cs).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}.${cc}` : `${mm}:${ss}.${cc}`;
  };

  const saveStopwatchSession = async () => {
    if (!user) return;
    const elapsedMs = swRunning ? swBaseRef.current + (Date.now() - (swStartRef.current ?? Date.now())) : swMs;
    const seconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (seconds < 60) { toast.error("Less than a minute — nothing to save"); return; }
    const { data: inserted, error } = await supabase.from("focus_sessions").insert({
      user_id: user.id,
      duration_minutes: minutes,
      duration_seconds: seconds,
      session_type: "focus",
      subject_id: subjectId || null,
      started_at: swStartedAtRef.current ?? new Date(Date.now() - elapsedMs).toISOString(),
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    if (!inserted) { toast.error("Could not save this session"); return; }
    const result = await awardXp.mutateAsync({ event_type: "focus_session", ref_id: inserted.id });
    qc.invalidateQueries({ queryKey: ["focus_today"] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
    window.dispatchEvent(new Event("studyos:focus-session-saved"));
    toast.success(`Saved ${minutes} min`, { description: `Total XP: ${result?.xp ?? ""}` });
    swReset();
  };

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("subjects").select("*").eq("user_id", user!.id)).data ?? [],
  });

  const { data: customPresets = [] } = useQuery({
    queryKey: ["timer_presets", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("timer_presets" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: todayStats } = useQuery({
    queryKey: ["focus_today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = startOfDay(new Date()).toISOString();
      const end = endOfDay(new Date()).toISOString();
      const { data } = await supabase.from("focus_sessions").select("duration_minutes, duration_seconds, session_type")
        .eq("user_id", user!.id).gte("started_at", start).lte("started_at", end);
      const focus = (data ?? []).filter(s => s.session_type === "focus");
      return {
        sessions: focus.length,
        minutes: Math.floor(focus.reduce((a, s) => a + (s.duration_seconds ?? s.duration_minutes * 60), 0) / 60),
      };
    },
  });

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const endAt = timerEndRef.current;
      if (endAt === null) return;
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        timerEndRef.current = null;
        setRunning(false);
        completeRef.current();
      }
    };
    tick();
    intervalRef.current = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [running]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
       if (e.code === "Space") { e.preventDefault(); toggleTimer(); }
       else if (e.key.toLowerCase() === "r") {
         setRunning(false);
         timerEndRef.current = null;
         timerStartedAtRef.current = null;
         setSecondsLeft(selected.min * 60);
       }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, running, secondsLeft]);

  const notifyDone = (msg: string) => {
    beep();
    if (notify && "Notification" in window && Notification.permission === "granted") {
      new Notification("StudyOS Timer", { body: msg });
    }
  };

  const handleComplete = async () => {
    if (selected.type === "focus") {
      const startedAt = timerStartedAtRef.current ?? new Date(Date.now() - selected.min * 60_000).toISOString();
      const { data: inserted, error: insErr } = await supabase.from("focus_sessions").insert({
        user_id: user!.id,
        duration_minutes: selected.min,
        duration_seconds: selected.min * 60,
        session_type: "focus",
        subject_id: subjectId || null,
        started_at: startedAt,
      }).select("id").single();
      if (insErr) { toast.error(insErr.message); return; }
      if (!inserted) { toast.error("Could not save this session"); return; }
      const result = await awardXp.mutateAsync({ event_type: "focus_session", ref_id: inserted.id });
      qc.invalidateQueries({ queryKey: ["focus_today"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      window.dispatchEvent(new Event("studyos:focus-session-saved"));
      const goalNote = goal ? ` · "${goal}"` : "";
      toast.success(`Session complete!`, { description: `${selected.min} min${goalNote} · Total XP: ${result?.xp ?? ""}` });
      notifyDone(`Focus done — ${selected.min} min`);

      if (autoCycle) {
        const next = (cycleCount + 1) % 4 === 0
          ? { label: "Long break 15", min: 15, type: "break" as const }
          : { label: "Short break 5", min: 5, type: "break" as const };
        setCycleCount(c => c + 1);
        setSelected(next);
        setSecondsLeft(next.min * 60);
        timerStartedAtRef.current = null;
        timerEndRef.current = Date.now() + next.min * 60_000;
        setRunning(true);
      } else {
        timerStartedAtRef.current = null;
        try { localStorage.removeItem(TIMER_STATE_KEY); } catch { /* storage unavailable */ }
      }
    } else {
      toast.success("Break done!");
      notifyDone("Break over — back to focus");
      if (autoCycle) {
        const focus = { label: "Focus 25", min: 25, type: "focus" as const };
        setSelected(focus);
        setSecondsLeft(focus.min * 60);
        timerStartedAtRef.current = new Date().toISOString();
        timerEndRef.current = Date.now() + focus.min * 60_000;
        setRunning(true);
      } else {
        try { localStorage.removeItem(TIMER_STATE_KEY); } catch { /* storage unavailable */ }
      }
    }
    setGoal("");
  };

  completeRef.current = handleComplete;

  const toggleTimer = () => {
    if (running) {
      const remaining = timerEndRef.current === null
        ? secondsLeft
        : Math.max(0, Math.ceil((timerEndRef.current - Date.now()) / 1000));
      timerEndRef.current = null;
      setSecondsLeft(remaining);
      setRunning(false);
    } else if (secondsLeft > 0) {
      timerStartedAtRef.current ??= new Date().toISOString();
      timerEndRef.current = Date.now() + secondsLeft * 1000;
      setRunning(true);
    }
  };

  const choose = (p: Preset) => {
    setRunning(false);
    timerEndRef.current = null;
    timerStartedAtRef.current = null;
    setSelected(p);
    setSecondsLeft(p.min * 60);
  };

  const useCustom = () => {
    const min = Math.max(1, Math.min(240, customMin));
    choose({ label: `Custom ${min}`, min, type: "focus" });
  };

  const savePreset = async () => {
    if (!user) return;
    const min = Math.max(1, Math.min(240, customMin));
    const label = presetLabel.trim() || `Custom ${min}`;
    const { error } = await supabase.from("timer_presets" as any).insert({ user_id: user.id, label, minutes: min, session_type: "focus" });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["timer_presets"] });
    setPresetLabel("");
    toast.success("Preset saved");
  };

  const deletePreset = async (id: string) => {
    const { error } = await supabase.from("timer_presets" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["timer_presets"] });
  };

  const reset = () => {
    setRunning(false);
    timerEndRef.current = null;
    timerStartedAtRef.current = null;
    setSecondsLeft(selected.min * 60);
  };
  const toggleNotify = async () => {
    if (!notify && "Notification" in window) {
      const p = await Notification.requestPermission();
      if (p === "granted") { setNotify(true); toast.success("Notifications on"); } else toast.error("Permission denied");
    } else setNotify(false);
  };

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const pct = ((selected.min * 60 - secondsLeft) / (selected.min * 60)) * 100;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Study Timer" subtitle="Pomodoro · Stopwatch · Auto-cycle · Shortcuts: Space / R" />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode("timer")}
          className={`px-4 py-2 rounded-md text-xs font-bold border flex items-center gap-1.5 ${mode === "timer" ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2"}`}>
          <TimerIcon className="w-3.5 h-3.5" /> Timer
        </button>
        <button onClick={() => setMode("stopwatch")}
          className={`px-4 py-2 rounded-md text-xs font-bold border flex items-center gap-1.5 ${mode === "stopwatch" ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2"}`}>
          <Watch className="w-3.5 h-3.5" /> Stopwatch
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {mode === "timer" ? (
        <div className="surface p-10 lg:col-span-2 relative overflow-hidden">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 blur-[120px] rounded-full" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Header context */}
            <div className="mb-10 text-center">
              <span className="label-mono text-primary/80 mb-1.5 block">
                {selected.type === "focus" ? "Deep Focus Mode" : "Break Mode"}
              </span>
              <h2 className="font-display text-3xl font-bold tracking-tight">{selected.label}</h2>
            </div>

            {/* Timer ring */}
            <div className="relative w-80 h-80 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="150" stroke="hsl(var(--surface-3))" strokeWidth="4" fill="transparent" />
                <circle
                  cx="50%" cy="50%" r="150"
                  stroke="hsl(var(--primary))" strokeWidth="4" fill="transparent"
                  strokeDasharray={2 * Math.PI * 150}
                  strokeDashoffset={2 * Math.PI * 150 * (1 - pct / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                />
              </svg>
              <div className="text-center">
                <div className="font-mono font-bold text-7xl tabular-nums tracking-tighter text-primary">
                  {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                </div>
                <div className="label-mono mt-2 text-muted-foreground">
                  {running ? "Remaining" : "Ready"}
                </div>
              </div>
            </div>

            {/* Mode pills */}
            <div className="flex flex-wrap gap-2 justify-center mt-10">
              {BUILTIN.map(p => (
                <button key={p.label} onClick={() => choose(p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all border ${
                    selected.label === p.label
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="mt-10 flex items-center gap-8">
              <button onClick={reset} title="Reset (R)"
                className="w-12 h-12 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all">
                <RotateCcw className="w-5 h-5" />
              </button>

              <button onClick={toggleTimer} className="relative group">
                <div className="absolute -inset-1 bg-primary rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-transform">
                  {running ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </div>
              </button>

              <button onClick={toggleNotify} title="Notifications"
                className={`w-12 h-12 flex items-center justify-center rounded-full border transition-all ${
                  notify ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}>
                {notify ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>

              <button onClick={() => setAutoCycle(v => !v)} title="Auto cycle"
                className={`w-12 h-12 flex items-center justify-center rounded-full border transition-all ${
                  autoCycle ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}>
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            {/* Goal input */}
            <input value={goal} onChange={e => setGoal(e.target.value)}
              placeholder="Optional goal — e.g. Finish chapter 4 derivations"
              className="w-full max-w-md mt-10 bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-center focus:outline-none focus:border-primary" />

            {/* Footer stats */}
            <div className="mt-10 w-full max-w-md pt-6 border-t border-border grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="label-mono text-muted-foreground">Sessions</div>
                <div className="font-mono font-bold text-lg tabular-nums mt-1">{String(todayStats?.sessions ?? 0).padStart(2, "0")}</div>
              </div>
              <div className="text-center border-x border-border">
                <div className="label-mono text-muted-foreground">Minutes</div>
                <div className="font-mono font-bold text-lg tabular-nums mt-1">{todayStats?.minutes ?? 0}</div>
              </div>
              <div className="text-center">
                <div className="label-mono text-muted-foreground">Cycle</div>
                <div className="font-mono font-bold text-lg tabular-nums mt-1 text-primary">{String(cycleCount).padStart(2, "0")}</div>
              </div>
            </div>
          </div>
        </div>

        ) : (
        <div className="surface p-8 lg:col-span-2 flex flex-col items-center">
          <div className="font-display font-extrabold text-7xl tabular-nums my-10 tracking-tight">
            {fmtSw(swMs)}
          </div>
          <div className="flex gap-3 mb-6">
            <button onClick={toggleStopwatch}
              className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-md flex items-center gap-2 hover:bg-primary-glow min-w-[140px] justify-center">
              {swRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
            </button>
            <button onClick={swLap} disabled={!swRunning}
              className="bg-surface-2 border border-border px-4 py-3 rounded-md disabled:opacity-40" title="Lap">
              <Flag className="w-4 h-4" />
            </button>
            <button onClick={swReset} className="bg-surface-2 border border-border px-4 py-3 rounded-md" title="Reset">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={saveStopwatchSession} disabled={swMs < 60000}
              className="bg-surface-2 border border-border px-4 py-3 rounded-md text-xs font-bold disabled:opacity-40">
              Save session
            </button>
          </div>
          {laps.length > 0 && (
            <div className="w-full max-w-md max-h-64 overflow-y-auto border border-border rounded-md divide-y divide-border">
              {laps.map((lap, i) => {
                const idx = laps.length - i;
                const prev = laps[i + 1] ?? 0;
                return (
                  <div key={i} className="flex justify-between px-3 py-2 text-sm tabular-nums">
                    <span className="text-muted-foreground">Lap {idx}</span>
                    <span className="text-muted-foreground">+{fmtSw(lap - prev)}</span>
                    <span className="font-semibold">{fmtSw(lap)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        <div className="space-y-3">
          <div className="surface p-4">
            <div className="label-mono mb-2">Built-in presets</div>
            <div className="grid grid-cols-2 gap-2">
              {BUILTIN.map(p => (
                <button key={p.label} onClick={() => choose(p)}
                  className={`p-3 rounded-md text-xs font-semibold border transition-colors ${selected.label === p.label ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 hover:border-primary/50"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="surface p-4 space-y-2">
            <div className="label-mono">Custom duration</div>
            <div className="flex gap-2">
              <input type="number" min={1} max={240} value={customMin} onChange={e => setCustomMin(parseInt(e.target.value) || 1)}
                className="w-20 bg-surface-2 border border-border rounded-md px-2 py-1.5 text-sm" />
              <span className="text-xs text-muted-foreground self-center">min</span>
              <button onClick={useCustom} className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-md">Use</button>
            </div>
            <div className="flex gap-2">
              <input value={presetLabel} onChange={e => setPresetLabel(e.target.value)} placeholder="Preset name (optional)"
                className="flex-1 bg-surface-2 border border-border rounded-md px-2 py-1.5 text-xs" />
              <button onClick={savePreset} className="bg-surface-2 border border-border text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1 hover:border-primary/50">
                <Plus className="w-3 h-3" /> Save
              </button>
            </div>
          </div>

          {(customPresets as any[]).length > 0 && (
            <div className="surface p-4">
              <div className="label-mono mb-2">My presets</div>
              <div className="space-y-1.5">
                {(customPresets as any[]).map(p => (
                  <div key={p.id} className="flex gap-1.5">
                    <button onClick={() => choose({ label: p.label, min: p.minutes, type: p.session_type })}
                      className={`flex-1 text-left text-xs px-2 py-1.5 rounded-md border ${selected.label === p.label ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 hover:border-primary/50"}`}>
                      {p.label} · {p.minutes}m
                    </button>
                    <button onClick={() => deletePreset(p.id)} className="text-destructive px-2 hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="surface p-4">
            <div className="label-mono mb-2">Subject</div>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
              <option value="">No subject</option>
              {(subjects as any[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
