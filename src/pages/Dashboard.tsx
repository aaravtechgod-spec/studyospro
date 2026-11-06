import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { SkeletonRow } from "@/components/ui-kit";
import { format, isToday, isThisWeek, parseISO, differenceInDays, startOfDay, subDays } from "date-fns";
import { Link } from "react-router-dom";
import {
  Calendar, ListChecks, Timer, Flame, ArrowRight, Layers, Sparkles,
  Clock3, CalendarDays, FileText, Plus, Bot, TrendingUp, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["dashboard-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id).neq("status", "done").order("due_date", { ascending: true, nullsFirst: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["dashboard-events", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("events").select("*").eq("user_id", user.id).gte("start_time", new Date().toISOString()).order("start_time").limit(5);
      return data ?? [];
    },
  });

  const { data: focusToday = 0 } = useQuery({
    queryKey: ["focus-today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return 0;
      const start = startOfDay(new Date());
      const { data } = await supabase.from("focus_sessions").select("duration_minutes,duration_seconds").eq("user_id", user.id).gte("started_at", start.toISOString());
      return Math.round((data ?? []).reduce((seconds, row) => seconds + (row.duration_seconds ?? row.duration_minutes * 60), 0) / 60);
    },
  });

  const { data: weekFocus = [] } = useQuery({
    queryKey: ["dashboard-focus-week", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const weekStart = startOfDay(subDays(new Date(), 6));
      const { data } = await supabase.from("focus_sessions").select("started_at,duration_minutes,duration_seconds").eq("user_id", user.id).gte("started_at", weekStart.toISOString()).order("started_at");
      return data ?? [];
    },
  });

  const { data: dueCards = 0 } = useQuery({
    queryKey: ["due-cards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id).lte("due_date", new Date().toISOString());
      return count ?? 0;
    },
  });

  const todayTasks = tasks.filter((task) => task.due_date && isToday(parseISO(task.due_date))).length;
  const weekTasks = tasks.filter((task) => task.due_date && isThisWeek(parseISO(task.due_date))).length;
  const firstName = (profile?.display_name ?? "Student").trim().split(/\s+/)[0] || "Student";
  const weekChart = Array.from({ length: 7 }, (_, index) => {
    const day = startOfDay(subDays(new Date(), 6 - index));
    const seconds = weekFocus.filter((session) => isToday(parseISO(session.started_at)) && isToday(day) || parseISO(session.started_at).toDateString() === day.toDateString())
      .reduce((total, session) => total + (session.duration_seconds ?? session.duration_minutes * 60), 0);
    return { day, minutes: Math.round(seconds / 60) };
  });
  const weekMax = Math.max(...weekChart.map((day) => day.minutes), 30);

  return (
    <div className="animate-fade-in space-y-6 pb-24 md:space-y-7 md:pb-8">
      <section className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4 text-primary" />{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Welcome back, <span className="text-primary">{firstName}</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Keep going. Your next good study session starts here.</p>
        </div>
        <Button asChild className="glass-control h-12 rounded-full px-5 shadow-lg shadow-primary/20 sm:w-auto">
          <Link to="/timer"><Timer className="h-4 w-4" /> Start focus session <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Study progress">
        <ProgressStat icon={Flame} label="Current streak" value={profile?.streak_days ?? 0} suffix={(profile?.streak_days ?? 0) === 1 ? "day" : "days"} accent="text-warning" />
        <ProgressStat icon={Clock3} label="Focus today" value={focusToday} suffix="min" accent="text-primary" />
        <ProgressStat icon={Calendar} label="Upcoming events" value={events.length} note="On your schedule" accent="text-info" />
        <ProgressStat icon={Layers} label="Ready to review" value={dueCards} note="flashcards" accent="text-xp" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="surface p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-base font-bold"><TrendingUp className="h-4 w-4 text-primary" />Your study progress</h2>
            <span className="text-xs text-muted-foreground">Last 7 days · focus minutes</span>
          </div>
          <div className="grid grid-cols-[minmax(100px,0.38fr)_1fr] items-center gap-5 sm:gap-8">
            <div className="relative mx-auto grid aspect-square w-full max-w-[150px] place-items-center rounded-full" style={{ background: `conic-gradient(hsl(var(--primary)) ${Math.min(100, (focusToday / 120) * 100)}%, hsl(var(--surface-3)) 0)` }}>
              <div className="grid h-[78%] w-[78%] content-center justify-items-center rounded-full bg-background/90 text-center">
                <span className="font-display text-3xl font-extrabold">{focusToday}</span>
                <span className="text-xs text-muted-foreground">minutes today</span>
              </div>
            </div>
            <div className="flex h-36 items-end justify-between gap-1.5 sm:gap-3" aria-label="Focus time by day for the last seven days">
              {weekChart.map(({ day, minutes }) => (
                <div key={day.toISOString()} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-full w-full items-end justify-center">
                    <div className={`w-full max-w-8 rounded-t-full transition-all ${isToday(day) ? "bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.3)]" : "bg-primary/40"}`} style={{ height: `${Math.max(minutes > 0 ? 8 : 3, (minutes / weekMax) * 100)}%` }} title={`${minutes} min`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{format(day, "EEEEE")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="surface p-4 sm:p-5">
          <SectionTitle icon={Calendar} title="Coming up" to="/schedule" linkLabel="View schedule" />
          {eventsLoading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, index) => <SkeletonRow key={index} />)}</div>
            : events.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">No upcoming events on your schedule.</div>
              : <ul className="divide-y divide-border/60">
                {events.slice(0, 4).map((event) => (
                  <li key={event.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <div className="grid h-11 w-11 shrink-0 content-center justify-items-center rounded-2xl bg-primary/10">
                      <span className="text-[10px] uppercase text-muted-foreground">{format(parseISO(event.start_time), "MMM")}</span>
                      <span className="font-display text-lg font-bold leading-tight">{format(parseISO(event.start_time), "d")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{event.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{format(parseISO(event.start_time), "EEE · h:mm a")}</p>
                    </div>
                  </li>
                ))}
              </ul>}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.86fr]">
        <div className="surface p-4 sm:p-5">
          <SectionTitle icon={ListChecks} title="Today's plan" to="/tasks" linkLabel="All homework" />
          {tasksLoading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, index) => <SkeletonRow key={index} />)}</div>
            : tasks.length === 0 ? <div className="py-8 text-center text-sm text-muted-foreground">Nothing pending. Enjoy the breathing room.</div>
              : <ul className="divide-y divide-border/60">
                {tasks.map((task) => {
                  const days = task.due_date ? differenceInDays(parseISO(task.due_date), new Date()) : null;
                  return <li key={task.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${task.priority === "high" ? "bg-destructive" : task.priority === "low" ? "bg-info" : "bg-warning"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{task.due_date ? `Due ${format(parseISO(task.due_date), "MMM d")}` : "No due date"}</p>
                    </div>
                    {days !== null && <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${days < 0 ? "bg-destructive/10 text-destructive" : days <= 1 ? "bg-warning/10 text-warning" : "bg-surface-3 text-muted-foreground"}`}>{days < 0 ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d`}</span>}
                  </li>;
                })}
              </ul>}
        </div>

        <div className="surface p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-base font-bold"><Sparkles className="h-4 w-4 text-primary" />Quick actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
            <QuickAction to="/notes" icon={FileText} title="New note" detail="Capture an idea" />
            <QuickAction to="/tasks" icon={Plus} title="Add homework" detail={`${weekTasks} due this week${todayTasks > 0 ? ` · ${todayTasks} today` : ""}`} />
            <QuickAction to="/timer" icon={Timer} title="Start focus" detail="Build momentum" />
            <QuickAction to="/flashcards" icon={Layers} title="Review cards" detail={`${dueCards} ready to review`} />
            <QuickAction to="/coach" icon={Bot} title="Ask AI Coach" detail="Get help with a topic" />
            <QuickAction to="/subjects" icon={BookOpen} title="Your subjects" detail="Continue learning" />
          </div>
        </div>
      </section>
    </div>
  );
}

function ProgressStat({ icon: Icon, label, value, suffix, note, accent }: { icon: typeof Flame; label: string; value: number; suffix?: string; note?: string; accent: string }) {
  return (
    <div className="dashboard-stat surface min-h-[112px] p-3.5 sm:p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10"><Icon className={`h-4 w-4 ${accent}`} /></span><span>{label}</span></div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-extrabold">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {note && <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, to, linkLabel }: { icon: typeof Calendar; title: string; to: string; linkLabel: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-base font-bold"><Icon className="h-4 w-4 text-primary" />{title}</h2>
      <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary">{linkLabel}<ArrowRight className="h-3 w-3" /></Link>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, detail }: { to: string; icon: typeof Timer; title: string; detail: string }) {
  return (
    <Link to={to} className="surface-2 group flex min-h-[88px] items-center gap-2.5 rounded-2xl p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 sm:min-h-[96px]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary/25"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0"><span className="block truncate text-xs font-semibold sm:text-sm">{title}</span><span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground sm:text-xs">{detail}</span></span>
    </Link>
  );
}