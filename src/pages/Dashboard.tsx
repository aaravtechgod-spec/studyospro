import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { SkeletonRow } from "@/components/ui-kit";
import { format, isToday, isThisWeek, parseISO, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { Calendar, ListChecks, Timer, Flame, ArrowRight, Layers, Sparkles, Clock3, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["dashboard-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*").eq("user_id", user!.id).neq("status", "done").order("due_date", { ascending: true, nullsFirst: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["dashboard-events", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").eq("user_id", user!.id).gte("start_time", new Date().toISOString()).order("start_time").limit(5);
      return data ?? [];
    },
  });

  const { data: focusToday = 0 } = useQuery({
    queryKey: ["focus-today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data } = await supabase.from("focus_sessions").select("duration_minutes").eq("user_id", user!.id).gte("started_at", start.toISOString());
      return (data ?? []).reduce((s, r) => s + r.duration_minutes, 0);
    },
  });

  const { data: dueCards = 0 } = useQuery({
    queryKey: ["due-cards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user!.id).lte("due_date", new Date().toISOString());
      return count ?? 0;
    },
  });

  const todayTasks = tasks.filter(t => t.due_date && isToday(parseISO(t.due_date))).length;
  const weekTasks = tasks.filter(t => t.due_date && isThisWeek(parseISO(t.due_date))).length;
  const firstName = (profile?.display_name ?? "Student").trim().split(/\s+/)[0] || "Student";

  return (
    <div className="animate-fade-in space-y-6 md:space-y-8">
      <section className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold">Welcome back, {firstName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">A little progress today goes a long way.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/timer"><Timer className="h-4 w-4" /> Start a focus session</Link>
        </Button>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4" aria-label="Study progress">
        <ProgressStat icon={Flame} label="Current streak" value={profile?.streak_days ?? 0} suffix="days" accent="text-warning" />
        <ProgressStat icon={Clock3} label="Focus today" value={focusToday} suffix="min" accent="text-primary" />
        <ProgressStat icon={CalendarDays} label="Due this week" value={weekTasks} note={`${todayTasks} due today`} accent="text-info" />
        <ProgressStat icon={Layers} label="Ready to review" value={dueCards} note="flashcards" accent="text-xp" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface p-4 sm:p-5">
          <SectionTitle icon={ListChecks} title="Up next" to="/tasks" linkLabel="All homework" />
          {tasksLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Nothing pending. Enjoy the breathing room.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {tasks.map((task) => {
                const days = task.due_date ? differenceInDays(parseISO(task.due_date), new Date()) : null;
                return (
                  <li key={task.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${task.priority === "high" ? "bg-destructive" : task.priority === "low" ? "bg-info" : "bg-warning"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{task.due_date ? `Due ${format(parseISO(task.due_date), "MMM d")}` : "No due date"}</p>
                    </div>
                    {days !== null && <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] ${days < 0 ? "bg-destructive/10 text-destructive" : days <= 1 ? "bg-warning/10 text-warning" : "bg-surface-3 text-muted-foreground"}`}>{days < 0 ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d`}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="surface p-4 sm:p-5">
          <SectionTitle icon={Calendar} title="Coming up" to="/schedule" linkLabel="Schedule" />
          {eventsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No upcoming events on your schedule.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {events.map((event) => (
                <li key={event.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md bg-surface-2/80">
                    <span className="text-[10px] uppercase text-muted-foreground">{format(parseISO(event.start_time), "MMM")}</span>
                    <span className="font-display text-lg font-bold leading-tight">{format(parseISO(event.start_time), "d")}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{format(parseISO(event.start_time), "EEE • h:mm a")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-display text-base font-bold">Pick up where you left off</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickAction to="/timer" icon={Timer} title="Focus session" detail="Start a 25-minute Pomodoro" />
          <QuickAction to="/flashcards" icon={Flame} title={`Review ${dueCards} cards`} detail="Keep your memory fresh" />
          <QuickAction to="/coach" icon={Sparkles} title="Ask your AI Coach" detail="Work through a tricky topic" />
        </div>
      </section>
    </div>
  );
}

function ProgressStat({ icon: Icon, label, value, suffix, note, accent }: { icon: typeof Flame; label: string; value: number; suffix?: string; note?: string; accent: string }) {
  return (
    <div className="surface min-h-[112px] p-3.5 sm:p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className={`h-4 w-4 ${accent}`} /><span>{label}</span></div>
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
      <Link to={to} className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary">{linkLabel}<ArrowRight className="h-3 w-3" /></Link>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, detail }: { to: string; icon: typeof Timer; title: string; detail: string }) {
  return (
    <Link to={to} className="surface group flex min-h-[108px] items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15"><Icon className="h-5 w-5" /></span>
      <span className="min-w-0"><span className="block truncate text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{detail}</span></span>
    </Link>
  );
}
