import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useAwardXp } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, RotateCcw, Plus, Trash2, Bell, BellOff, Repeat } from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";

type Preset = { label: string; min: number; type: "focus" | "break"; id?: string };
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
  const [selected, setSelected] = useState<Preset>(BUILTIN[0]);
  const [secondsLeft, setSecondsLeft] = useState(BUILTIN[0].min * 60);
  const [running, setRunning] = useState(false);
  const [subjectId, setSubjectId] = useState<string>("");
  const [goal, setGoal] = useState("");
  const [autoCycle, setAutoCycle] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [notify, setNotify] = useState(false);
  const [customMin, setCustomMin] = useState(30);
  const [presetLabel, setPresetLabel] = useState("");
  const intervalRef = useRef<number | null>(null);

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
      const { data } = await supabase.from("focus_sessions").select("duration_minutes, session_type")
        .eq("user_id", user!.id).gte("started_at", start).lte("started_at", end);
      const focus = (data ?? []).filter(s => s.session_type === "focus");
      return { sessions: focus.length, minutes: focus.reduce((a, s) => a + s.duration_minutes, 0) };
    },
  });

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          window.clearInterval(intervalRef.current!);
          setRunning(false);
          handleComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") { e.preventDefault(); setRunning(r => !r); }
      else if (e.key.toLowerCase() === "r") { setRunning(false); setSecondsLeft(selected.min * 60); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const notifyDone = (msg: string) => {
    beep();
    if (notify && "Notification" in window && Notification.permission === "granted") {
      new Notification("StudyOS Timer", { body: msg });
    }
  };

  const handleComplete = async () => {
    if (selected.type === "focus") {
      const { data: inserted, error: insErr } = await supabase.from("focus_sessions").insert({
        user_id: user!.id,
        duration_minutes: selected.min,
        session_type: "focus",
        subject_id: subjectId || null,
      }).select("id").single();
      if (insErr) { toast.error(insErr.message); return; }
      const result = await awardXp.mutateAsync({ event_type: "focus_session", ref_id: inserted!.id });
      qc.invalidateQueries({ queryKey: ["focus_today"] });
      const goalNote = goal ? ` · "${goal}"` : "";
      toast.success(`Session complete!`, { description: `${selected.min} min${goalNote} · Total XP: ${result?.xp ?? ""}` });
      notifyDone(`Focus done — ${selected.min} min`);

      if (autoCycle) {
        const next = (cycleCount + 1) % 4 === 0
          ? { label: "Long break 15", min: 15, type: "break" as const }
          : { label: "Short break 5", min: 5, type: "break" as const };
        setCycleCount(c => c + 1);
        setSelected(next); setSecondsLeft(next.min * 60); setRunning(true);
      }
    } else {
      toast.success("Break done!");
      notifyDone("Break over — back to focus");
      if (autoCycle) {
        const focus = { label: "Focus 25", min: 25, type: "focus" as const };
        setSelected(focus); setSecondsLeft(focus.min * 60); setRunning(true);
      }
    }
    setGoal("");
  };

  const choose = (p: Preset) => { setRunning(false); setSelected(p); setSecondsLeft(p.min * 60); };

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

  const reset = () => { setRunning(false); setSecondsLeft(selected.min * 60); };
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
      <PageHeader title="Study Timer" subtitle="Pomodoro · Custom · Auto-cycle · Shortcuts: Space / R" />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="surface p-8 lg:col-span-2 flex flex-col items-center">
          <div className="relative w-64 h-64 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--surface-3))" strokeWidth="3" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 46}`}
                strokeDashoffset={`${2 * Math.PI * 46 * (1 - pct / 100)}`}
                strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display font-extrabold text-6xl tabular-nums">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</div>
              <div className="label-mono mt-2">{selected.label}</div>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button onClick={() => setRunning(!running)} className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-md flex items-center gap-2 hover:bg-primary-glow min-w-[140px] justify-center">
              {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
            </button>
            <button onClick={reset} className="bg-surface-2 border border-border px-4 py-3 rounded-md" title="Reset (R)">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => setAutoCycle(v => !v)}
              className={`px-4 py-3 rounded-md border flex items-center gap-1.5 text-xs ${autoCycle ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2"}`}>
              <Repeat className="w-3.5 h-3.5" /> Auto cycle
            </button>
            <button onClick={toggleNotify}
              className={`px-4 py-3 rounded-md border flex items-center gap-1.5 text-xs ${notify ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2"}`}>
              {notify ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Optional goal: e.g. Finish chapter 4 derivations"
            className="w-full max-w-md bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />

          <div className="grid grid-cols-3 gap-3 mt-5 w-full max-w-md">
            <div className="bg-surface-2 border border-border rounded-md p-3 text-center">
              <div className="label-mono">Today</div>
              <div className="font-display font-bold text-xl">{todayStats?.sessions ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">sessions</div>
            </div>
            <div className="bg-surface-2 border border-border rounded-md p-3 text-center">
              <div className="label-mono">Minutes</div>
              <div className="font-display font-bold text-xl">{todayStats?.minutes ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">today</div>
            </div>
            <div className="bg-surface-2 border border-border rounded-md p-3 text-center">
              <div className="label-mono">Cycle</div>
              <div className="font-display font-bold text-xl">{cycleCount}</div>
              <div className="text-[10px] text-muted-foreground">completed</div>
            </div>
          </div>
        </div>

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
