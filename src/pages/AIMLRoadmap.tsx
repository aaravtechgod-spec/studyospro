import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, StatCard, SkeletonRow } from "@/components/ui-kit";
import { PHASES, ROADMAP, TOTAL_DAYS, TOTAL_WEEKS, phaseFor } from "@/lib/aimlRoadmap";
import { useCoachChat } from "@/hooks/useCoachChat";
import {
  Brain, Check, ExternalLink, Sparkles, Target, Trophy, ChevronRight,
  Calendar, Clock, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function AIMLRoadmap() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { openSidebar, send, setContext } = useCoachChat();
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const { data: progress = [], isLoading } = useQuery({
    queryKey: ["aiml-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aiml_progress" as any)
        .select("day_number,completed_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as { day_number: number; completed_at: string }[];
    },
  });

  const completed = useMemo(() => new Set(progress.map(p => p.day_number)), [progress]);

  const toggleDay = useMutation({
    mutationFn: async (day: number) => {
      if (!user) throw new Error("Sign in required");
      if (completed.has(day)) {
        const { error } = await supabase.from("aiml_progress" as any)
          .delete().eq("user_id", user.id).eq("day_number", day);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("aiml_progress" as any)
          .insert({ user_id: user.id, day_number: day });
        if (error) throw error;
      }
    },
    onSuccess: (_d, day) => {
      qc.invalidateQueries({ queryKey: ["aiml-progress", user?.id] });
      if (!completed.has(day)) toast.success(`Day ${day} done — keep going! 🔥`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save progress"),
  });

  // Pick a "current day" = first uncompleted; otherwise final day.
  const currentDay = useMemo(() => {
    for (let d = 1; d <= TOTAL_DAYS; d++) if (!completed.has(d)) return d;
    return TOTAL_DAYS;
  }, [completed]);

  const today = ROADMAP[currentDay - 1];
  const todayPhase = phaseFor(currentDay);
  const pct = Math.round((completed.size / TOTAL_DAYS) * 100);

  // Per-phase progress
  const phaseStats = useMemo(() => {
    return PHASES.map(p => {
      const days = ROADMAP.filter(t => t.phaseId === p.id);
      const done = days.filter(t => completed.has(t.day)).length;
      return { phase: p, total: days.length, done };
    });
  }, [completed]);

  const weekTasks = useMemo(() => ROADMAP.filter(t => t.week === selectedWeek), [selectedWeek]);
  const weekPhase = weekTasks.length > 0 ? PHASES.find(p => p.id === weekTasks[0].phaseId)! : PHASES[0];

  const askCoachAbout = (task: typeof today) => {
    setContext(`AI/ML Roadmap — Day ${task.day} (Week ${task.week}, ${todayPhase.title}): ${task.title}`);
    openSidebar();
    void send(
      `I'm on Day ${task.day} of my AI/ML roadmap. Today's target is:\n\n` +
      `**${task.title}**\n${task.detail}\n\n` +
      `Phase: ${todayPhase.title} — ${todayPhase.goal}\n\n` +
      `Give me a clear, step-by-step plan to crush this in ~${task.hours}h. Suggest the 1 best free resource and a tiny exercise to lock it in.`,
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="AI/ML Engineer Roadmap"
        subtitle={`24 weeks · ${TOTAL_DAYS} days · zero → job-ready`}
        action={
          <button
            onClick={() => askCoachAbout(today)}
            className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-sm flex items-center gap-1.5 hover:bg-primary-glow transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Coach me on today
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Progress" value={`${pct}%`} accent="primary" hint={`${completed.size}/${TOTAL_DAYS} days`} />
        <StatCard label="Current week" value={today.week} accent="info" hint={`of ${TOTAL_WEEKS}`} />
        <StatCard label="Phase" value={<span className="text-lg leading-tight">{todayPhase.title}</span>} accent="warning" />
        <StatCard label="Today's target" value={<span className="text-base leading-tight">{today.hours}h</span>} accent="xp" hint={`Day ${today.day}`} />
      </div>

      {/* Today's spotlight */}
      <div className="surface p-6 mb-6 border-primary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="label-mono text-primary">TODAY · DAY {today.day}</span>
            <span className="text-[10px] bg-surface-2 border border-border rounded px-2 py-0.5 font-mono">
              Week {today.week} · {todayPhase.title}
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl mb-1.5">{today.title}</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-2xl">{today.detail}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleDay.mutate(today.day)}
              className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                completed.has(today.day)
                  ? "bg-success/20 text-success border border-success/40"
                  : "bg-primary text-primary-foreground hover:bg-primary-glow"
              }`}
            >
              <Check className="w-4 h-4" /> {completed.has(today.day) ? "Completed" : "Mark complete"}
            </button>
            <button
              onClick={() => askCoachAbout(today)}
              className="px-4 py-2 rounded-md text-sm font-semibold bg-surface-2 border border-border hover:border-primary flex items-center gap-1.5"
            >
              <Brain className="w-4 h-4" /> Plan with AI
            </button>
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> ~{today.hours}h focus
            </span>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="mb-6">
        <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> 9 Phases
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {phaseStats.map(({ phase, done, total }) => {
            const pp = Math.round((done / total) * 100);
            const colorMap: Record<string, string> = {
              primary: "text-primary", info: "text-info", warning: "text-warning",
              xp: "text-xp", success: "text-success",
            };
            const isCurrent = phase.id === todayPhase.id;
            return (
              <button
                key={phase.id}
                onClick={() => setSelectedWeek(phase.weeks[0])}
                className={`surface p-4 text-left transition-colors ${isCurrent ? "border-primary" : "hover:border-primary/50"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="label-mono">PHASE {phase.id} · W{phase.weeks[0]}–{phase.weeks[1]}</span>
                  {done === total && <Trophy className="w-4 h-4 text-xp" />}
                </div>
                <div className={`font-display font-extrabold text-base ${colorMap[phase.color]}`}>{phase.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{phase.goal}</div>
                <div className="mt-3 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div className={`h-full bg-${phase.color === "primary" ? "primary" : phase.color === "info" ? "info" : phase.color === "warning" ? "warning" : phase.color === "xp" ? "xp" : "success"} transition-all`} style={{ width: `${pp}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">{done}/{total} days · {pp}%</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Week selector + tasks */}
      <div className="surface p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Week {selectedWeek} — {weekPhase.title}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedWeek(w => Math.max(1, w - 1))}
              disabled={selectedWeek === 1}
              className="px-2 py-1 rounded bg-surface-2 border border-border text-xs hover:border-primary disabled:opacity-40"
            >
              ← Prev
            </button>
            <select
              value={selectedWeek}
              onChange={e => setSelectedWeek(parseInt(e.target.value, 10))}
              className="bg-surface-2 border border-border rounded px-2 py-1 text-xs font-mono"
            >
              {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
            <button
              onClick={() => setSelectedWeek(w => Math.min(TOTAL_WEEKS, w + 1))}
              disabled={selectedWeek === TOTAL_WEEKS}
              className="px-2 py-1 rounded bg-surface-2 border border-border text-xs hover:border-primary disabled:opacity-40"
            >
              Next →
            </button>
            <button
              onClick={() => setSelectedWeek(today.week)}
              className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30 text-xs ml-1"
            >
              Today
            </button>
          </div>
        </div>

        {weekPhase.resources.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {weekPhase.resources.map(r => (
              <a key={r.url} href={r.url} target="_blank" rel="noreferrer"
                className="text-[11px] bg-surface-2 border border-border rounded-full px-3 py-1 hover:border-primary flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> {r.label}
              </a>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : (
          <ul className="space-y-2">
            {weekTasks.map(t => {
              const done = completed.has(t.day);
              const isToday = t.day === today.day;
              return (
                <li
                  key={t.day}
                  className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                    isToday ? "border-primary bg-primary/5"
                    : done ? "border-success/30 bg-success/5"
                    : "border-border bg-surface-2 hover:border-primary/40"
                  }`}
                >
                  <button
                    onClick={() => toggleDay.mutate(t.day)}
                    aria-label={done ? "Mark incomplete" : "Mark complete"}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      done ? "bg-success border-success text-background" : "border-border hover:border-primary"
                    }`}
                  >
                    {done && <Check className="w-3 h-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="label-mono text-[10px]">DAY {t.day}</span>
                      {isToday && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-extrabold tracking-widest">TODAY</span>}
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {t.hours}h
                      </span>
                    </div>
                    <div className={`text-sm font-semibold mt-0.5 ${done ? "line-through text-muted-foreground" : ""}`}>
                      {t.title}
                    </div>
                    {t.detail && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t.detail}</div>
                    )}
                  </div>
                  <button
                    onClick={() => askCoachAbout(t)}
                    className="text-muted-foreground hover:text-primary p-1 flex-shrink-0"
                    aria-label="Ask coach"
                    title="Ask AI Coach about this day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Tip: tick the box when done — you'll see your streak grow.</span>
          <button
            onClick={() => setSelectedWeek(today.week)}
            className="text-primary hover:underline flex items-center gap-1"
          >
            Jump to current week <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
