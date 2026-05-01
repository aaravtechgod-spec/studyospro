import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, StatCard, SkeletonRow } from "@/components/ui-kit";
import { PHASES, ROADMAP, TOTAL_DAYS, TOTAL_WEEKS, phaseFor } from "@/lib/aimlRoadmap";
import { useCoachChat } from "@/hooks/useCoachChat";
import { useAimlSettings, useUpdateAimlSettings } from "@/hooks/useAimlSettings";
import { PACE_INFO, TRACK_INFO, PHASE_BADGES, MILESTONES, projectedFinish, fmtDate, type Pace, type Track } from "@/lib/aimlPacing";
import DayDetail from "@/components/aiml/DayDetail";
import {
  Brain, Check, ExternalLink, Sparkles, Target, Trophy, ChevronRight,
  Calendar, Clock, ArrowRight, Snowflake, Plane, Award, Settings as SettingsIcon, X,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AIMLRoadmap() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { openSidebar, send, setContext } = useCoachChat();
  const { data: settings } = useAimlSettings();
  const updateSettings = useUpdateAimlSettings();
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [milestoneShown, setMilestoneShown] = useState<number | null>(null);

  const { data: progress = [], isLoading } = useQuery({
    queryKey: ["aiml-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aiml_progress" as any)
        .select("day_number,completed_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return ((data ?? []) as unknown) as { day_number: number; completed_at: string }[];
    },
  });

  const { data: badges = [] } = useQuery({
    queryKey: ["aiml-badges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("aiml_badges" as any).select("badge_key").eq("user_id", user!.id);
      return (data ?? []).map((b: any) => b.badge_key) as string[];
    },
  });

  const completed = useMemo(() => new Set(progress.map(p => p.day_number)), [progress]);

  // Award badges as phases complete + milestone celebrations
  useEffect(() => {
    if (!user || isLoading) return;
    const earnedSet = new Set(badges);
    const toAward: string[] = [];

    // Phase badges
    for (const phase of PHASES) {
      const days = ROADMAP.filter(t => t.phaseId === phase.id);
      const allDone = days.every(d => completed.has(d.day));
      const key = `phase_${phase.id}`;
      if (allDone && !earnedSet.has(key)) toAward.push(key);
    }
    // Milestones
    for (const m of MILESTONES) {
      const key = `milestone_${m}`;
      if (completed.size >= m && !earnedSet.has(key)) toAward.push(key);
    }

    if (toAward.length > 0) {
      void (async () => {
        for (const key of toAward) {
          await supabase.from("aiml_badges" as any).insert({ user_id: user.id, badge_key: key });
          if (key.startsWith("milestone_")) {
            const num = parseInt(key.replace("milestone_", ""), 10);
            setMilestoneShown(num);
          } else if (key.startsWith("phase_")) {
            const id = parseInt(key.replace("phase_", ""), 10);
            const b = PHASE_BADGES[id];
            if (b) toast.success(`🏆 Badge unlocked: ${b.emoji} ${b.name}`, { duration: 5000 });
          }
        }
        qc.invalidateQueries({ queryKey: ["aiml-badges", user?.id] });
      })();
    }
  }, [completed, badges, user, isLoading, qc]);

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
        await supabase.rpc("award_aiml_xp" as any, { _event: "aiml_day" } as any);
      }
    },
    onSuccess: (_d, day) => {
      qc.invalidateQueries({ queryKey: ["aiml-progress", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      if (!completed.has(day)) toast.success(`Day ${day} done — +15 XP 🔥`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save progress"),
  });

  const currentDay = useMemo(() => {
    for (let d = 1; d <= TOTAL_DAYS; d++) if (!completed.has(d)) return d;
    return TOTAL_DAYS;
  }, [completed]);

  const today = ROADMAP[currentDay - 1];
  const todayPhase = phaseFor(currentDay);
  const pct = Math.round((completed.size / TOTAL_DAYS) * 100);

  // Vacation mode check
  const onVacation = useMemo(() => {
    if (!settings?.vacation_until) return false;
    return new Date(settings.vacation_until) > new Date();
  }, [settings?.vacation_until]);

  const finishDate = useMemo(() => {
    if (!settings) return null;
    return projectedFinish(settings.pace, new Date(settings.start_date), completed.size);
  }, [settings, completed.size]);

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
      `I'm on Day ${task.day} of my AI/ML roadmap (${TRACK_INFO[settings?.track ?? "engineer"].label} track). Today's target:\n\n` +
      `**${task.title}**\n${task.detail}\n\n` +
      `Phase: ${todayPhase.title} — ${todayPhase.goal}\n\n` +
      `Give me a clear, step-by-step plan to crush this in ~${task.hours}h. Suggest the 1 best free resource and a tiny exercise.`,
    );
  };

  const setVacation = (days: number) => {
    const until = new Date(); until.setDate(until.getDate() + days);
    updateSettings.mutate({ vacation_until: until.toISOString().slice(0, 10) });
    toast.success(`Vacation mode on until ${fmtDate(until)} — streak protected.`);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="AI/ML Engineer Roadmap"
        subtitle={`24 weeks · ${TOTAL_DAYS} days · zero → job-ready`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="bg-surface-2 border border-border font-semibold px-3 py-2 rounded-md text-sm flex items-center gap-1.5 hover:border-primary">
              <SettingsIcon className="w-4 h-4" /> Settings
            </button>
            <button onClick={() => askCoachAbout(today)} className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-sm flex items-center gap-1.5 hover:bg-primary-glow transition-colors">
              <Sparkles className="w-4 h-4" /> Coach me on today
            </button>
          </div>
        }
      />

      {/* Pacing banner */}
      {settings && (
        <div className="surface p-4 mb-6 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{PACE_INFO[settings.pace].emoji}</span>
            <div>
              <div className="font-semibold">{PACE_INFO[settings.pace].label} pace</div>
              <div className="text-[11px] text-muted-foreground">{PACE_INFO[settings.pace].hoursPerDay}h/day · {PACE_INFO[settings.pace].daysPerWeek}d/week</div>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground">TRACK</div>
            <div className="font-semibold">{TRACK_INFO[settings.track].emoji} {TRACK_INFO[settings.track].label}</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground">PROJECTED FINISH</div>
            <div className="font-semibold">{finishDate ? fmtDate(finishDate) : "—"}</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Snowflake className="w-4 h-4 text-info" />
            <span className="font-semibold">{settings.freeze_tokens}</span>
            <span className="text-[11px] text-muted-foreground">freeze tokens</span>
          </div>
          {onVacation && (
            <div className="ml-auto flex items-center gap-1.5 text-warning text-xs">
              <Plane className="w-4 h-4" /> Vacation until {fmtDate(new Date(settings.vacation_until!))}
              <button onClick={() => updateSettings.mutate({ vacation_until: null })} className="ml-1 underline">end</button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Progress" value={`${pct}%`} accent="primary" hint={`${completed.size}/${TOTAL_DAYS} days`} />
        <StatCard label="Current week" value={today.week} accent="info" hint={`of ${TOTAL_WEEKS}`} />
        <StatCard label="Phase" value={<span className="text-lg leading-tight">{todayPhase.title}</span>} accent="warning" />
        <StatCard label="Badges" value={badges.length} accent="xp" hint={`of ${PHASES.length + MILESTONES.length}`} />
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
            <button onClick={() => setOpenDay(today.day)} className="px-4 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-glow flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Open today's workspace
            </button>
            <button onClick={() => toggleDay.mutate(today.day)} className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-colors ${
              completed.has(today.day)
                ? "bg-success/20 text-success border border-success/40"
                : "bg-surface-2 border border-border hover:border-primary"
            }`}>
              <Check className="w-4 h-4" /> {completed.has(today.day) ? "Completed" : "Quick complete"}
            </button>
            <button onClick={() => askCoachAbout(today)} className="px-4 py-2 rounded-md text-sm font-semibold bg-surface-2 border border-border hover:border-primary flex items-center gap-1.5">
              <Brain className="w-4 h-4" /> Plan with AI
            </button>
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> ~{today.hours}h focus
            </span>
          </div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="surface p-4 mb-6">
          <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-xp" /> Earned badges
          </h3>
          <div className="flex flex-wrap gap-2">
            {badges.map(key => {
              if (key.startsWith("phase_")) {
                const id = parseInt(key.replace("phase_", ""), 10);
                const b = PHASE_BADGES[id];
                return b ? (
                  <div key={key} className="flex items-center gap-1.5 bg-xp/10 border border-xp/40 rounded-full px-3 py-1 text-xs font-semibold">
                    <span className="text-base">{b.emoji}</span> {b.name}
                  </div>
                ) : null;
              }
              if (key.startsWith("milestone_")) {
                const n = key.replace("milestone_", "");
                return (
                  <div key={key} className="flex items-center gap-1.5 bg-primary/10 border border-primary/40 rounded-full px-3 py-1 text-xs font-semibold">
                    <span className="text-base">⭐</span> {n}-day milestone
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

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
            const earned = badges.includes(`phase_${phase.id}`);
            return (
              <button key={phase.id} onClick={() => setSelectedWeek(phase.weeks[0])}
                className={`surface p-4 text-left transition-colors ${isCurrent ? "border-primary" : "hover:border-primary/50"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="label-mono">PHASE {phase.id} · W{phase.weeks[0]}–{phase.weeks[1]}</span>
                  {earned && <span className="text-base" title={PHASE_BADGES[phase.id]?.name}>{PHASE_BADGES[phase.id]?.emoji}</span>}
                </div>
                <div className={`font-display font-extrabold text-base ${colorMap[phase.color]}`}>{phase.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{phase.goal}</div>
                <div className="mt-3 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pp}%` }} />
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
            <button onClick={() => setSelectedWeek(w => Math.max(1, w - 1))} disabled={selectedWeek === 1}
              className="px-2 py-1 rounded bg-surface-2 border border-border text-xs hover:border-primary disabled:opacity-40">← Prev</button>
            <select value={selectedWeek} onChange={e => setSelectedWeek(parseInt(e.target.value, 10))}
              className="bg-surface-2 border border-border rounded px-2 py-1 text-xs font-mono">
              {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
            <button onClick={() => setSelectedWeek(w => Math.min(TOTAL_WEEKS, w + 1))} disabled={selectedWeek === TOTAL_WEEKS}
              className="px-2 py-1 rounded bg-surface-2 border border-border text-xs hover:border-primary disabled:opacity-40">Next →</button>
            <button onClick={() => setSelectedWeek(today.week)} className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30 text-xs ml-1">Today</button>
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
                <li key={t.day} className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                  isToday ? "border-primary bg-primary/5" : done ? "border-success/30 bg-success/5" : "border-border bg-surface-2 hover:border-primary/40"
                }`}>
                  <button onClick={(e) => { e.stopPropagation(); toggleDay.mutate(t.day); }}
                    aria-label={done ? "Mark incomplete" : "Mark complete"}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      done ? "bg-success border-success text-background" : "border-border hover:border-primary"
                    }`}>
                    {done && <Check className="w-3 h-3" />}
                  </button>
                  <button onClick={() => setOpenDay(t.day)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="label-mono text-[10px]">DAY {t.day}</span>
                      {isToday && <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-extrabold tracking-widest">TODAY</span>}
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {t.hours}h
                      </span>
                    </div>
                    <div className={`text-sm font-semibold mt-0.5 ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                    {t.detail && <div className="text-[11px] text-muted-foreground mt-0.5">{t.detail}</div>}
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1.5" />
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Tip: click a day to open lesson, quiz, journal & focus mode.</span>
          <button onClick={() => setSelectedWeek(today.week)} className="text-primary hover:underline flex items-center gap-1">
            Jump to current week <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Day detail modal */}
      {openDay && (
        <DayDetail
          dayNumber={openDay}
          open={openDay !== null}
          onOpenChange={(v) => !v && setOpenDay(null)}
          isCompleted={completed.has(openDay)}
          onToggleComplete={() => toggleDay.mutate(openDay)}
        />
      )}

      {/* Settings dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Roadmap settings</DialogTitle></DialogHeader>
          {settings && (
            <div className="space-y-4">
              <div>
                <label className="label-mono text-xs">PACE</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(Object.keys(PACE_INFO) as Pace[]).map(p => (
                    <button key={p} onClick={() => updateSettings.mutate({ pace: p })}
                      className={`p-2 rounded border text-xs ${settings.pace === p ? "border-primary bg-primary/10" : "border-border bg-surface-2"}`}>
                      <div className="text-lg">{PACE_INFO[p].emoji}</div>
                      <div className="font-semibold">{PACE_INFO[p].label}</div>
                      <div className="text-[10px] text-muted-foreground">{PACE_INFO[p].hoursPerDay}h/d</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-mono text-xs">TRACK</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(Object.keys(TRACK_INFO) as Track[]).map(t => (
                    <button key={t} onClick={() => updateSettings.mutate({ track: t })}
                      className={`p-2 rounded border text-xs ${settings.track === t ? "border-primary bg-primary/10" : "border-border bg-surface-2"}`}>
                      <div className="text-lg">{TRACK_INFO[t].emoji}</div>
                      <div className="font-semibold">{TRACK_INFO[t].label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-mono text-xs">START DATE</label>
                <input type="date" value={settings.start_date}
                  onChange={e => updateSettings.mutate({ start_date: e.target.value })}
                  className="w-full mt-1 bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="label-mono text-xs">VACATION MODE (protect streak)</label>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setVacation(3)} className="flex-1 px-3 py-2 rounded border border-border bg-surface-2 text-xs hover:border-primary">3 days</button>
                  <button onClick={() => setVacation(7)} className="flex-1 px-3 py-2 rounded border border-border bg-surface-2 text-xs hover:border-primary">1 week</button>
                  <button onClick={() => setVacation(14)} className="flex-1 px-3 py-2 rounded border border-border bg-surface-2 text-xs hover:border-primary">2 weeks</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Public leaderboard</div>
                  <div className="text-[11px] text-muted-foreground">Share name + XP only</div>
                </div>
                <button onClick={() => updateSettings.mutate({ public_leaderboard: !settings.public_leaderboard })}
                  className={`w-10 h-5 rounded-full transition-colors ${settings.public_leaderboard ? "bg-primary" : "bg-surface-3"}`}>
                  <div className={`w-4 h-4 rounded-full bg-background transition-transform ${settings.public_leaderboard ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Milestone celebration */}
      <Dialog open={milestoneShown !== null} onOpenChange={() => setMilestoneShown(null)}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-6">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h2 className="font-display font-extrabold text-3xl mb-2">{milestoneShown}-Day Milestone!</h2>
            <p className="text-muted-foreground mb-6">You've completed {milestoneShown} days of your AI/ML journey. Keep going — you're on fire 🔥</p>
            <button onClick={() => setMilestoneShown(null)} className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold">
              Let's keep going
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
