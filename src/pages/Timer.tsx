import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useAddXp } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [
  { label: "Focus 25", min: 25, type: "focus" },
  { label: "Short break 5", min: 5, type: "break" },
  { label: "Long break 15", min: 15, type: "break" },
  { label: "Deep work 50", min: 50, type: "focus" },
];

export default function Timer() {
  const { user } = useAuth();
  const addXp = useAddXp();
  const [selected, setSelected] = useState(PRESETS[0]);
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].min * 60);
  const [running, setRunning] = useState(false);
  const [subjectId, setSubjectId] = useState<string>("");
  const intervalRef = useRef<number | null>(null);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("subjects").select("*").eq("user_id", user!.id)).data ?? [],
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

  const handleComplete = async () => {
    if (selected.type === "focus") {
      await supabase.from("focus_sessions").insert({
        user_id: user!.id,
        duration_minutes: selected.min,
        session_type: "focus",
        subject_id: subjectId || null,
      });
      const xp = selected.min * 2;
      await addXp.mutateAsync(xp);
      toast.success(`Session complete! +${xp} XP`, { description: `${selected.min} minutes of focused work` });
    } else {
      toast.success("Break done!");
    }
  };

  const choose = (p: typeof PRESETS[number]) => {
    setRunning(false);
    setSelected(p);
    setSecondsLeft(p.min * 60);
  };

  const reset = () => { setRunning(false); setSecondsLeft(selected.min * 60); };

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const pct = ((selected.min * 60 - secondsLeft) / (selected.min * 60)) * 100;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Study Timer" subtitle="Track your study sessions" />

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

          <div className="flex gap-3">
            <button onClick={() => setRunning(!running)} className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-md flex items-center gap-2 hover:bg-primary-glow min-w-[140px] justify-center">
              {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
            </button>
            <button onClick={reset} className="bg-surface-2 border border-border px-4 py-3 rounded-md">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="surface p-4">
            <div className="label-mono mb-2">Presets</div>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => choose(p)}
                  className={`p-3 rounded-md text-xs font-semibold border transition-colors ${selected.label === p.label ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 hover:border-primary/50"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="surface p-4">
            <div className="label-mono mb-2">Subject</div>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
              <option value="">No subject</option>
              {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="surface p-4">
            <div className="label-mono mb-1">Reward</div>
            <div className="text-xs text-muted-foreground">Focus sessions earn <span className="text-xp font-bold">2 XP per minute</span>. Breaks don't.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
