import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { PageHeader, StatCard, SkeletonRow } from "@/components/ui-kit";
import { format, isToday, isThisWeek, parseISO, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { Calendar, ListChecks, Timer, Flame, ArrowRight } from "lucide-react";

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

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Hey, ${profile?.display_name ?? "Student"}`}
        subtitle={format(new Date(), "EEEE, MMMM d, yyyy")}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Streak" value={<span>{profile?.streak_days ?? 0}<span className="text-base text-muted-foreground"> days</span></span>} accent="warning" hint="🔥 keep it alive" />
        <StatCard label="Focus today" value={<span>{focusToday}<span className="text-base text-muted-foreground">m</span></span>} accent="primary" />
        <StatCard label="Due this week" value={weekTasks} accent="info" hint={`${todayTasks} due today`} />
        <StatCard label="Cards to review" value={dueCards} accent="xp" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><ListChecks className="w-4 h-4 text-primary" /> Up next</h3>
            <Link to="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {tasksLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending tasks. ✨</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map(t => {
                const days = t.due_date ? differenceInDays(parseISO(t.due_date), new Date()) : null;
                return (
                  <li key={t.id} className="flex items-center gap-3 p-3 bg-surface-2 rounded-md border border-border">
                    <div className={`w-1.5 h-8 rounded ${t.priority === "high" ? "bg-destructive" : t.priority === "low" ? "bg-info" : "bg-warning"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{t.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {t.due_date ? `Due ${format(parseISO(t.due_date), "MMM d")}` : "No due date"}
                      </div>
                    </div>
                    {days !== null && (
                      <span className={`text-[10px] font-mono px-2 py-1 rounded ${days < 0 ? "bg-destructive/20 text-destructive" : days <= 1 ? "bg-warning/20 text-warning" : "bg-surface-3 text-muted-foreground"}`}>
                        {days < 0 ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d`}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Upcoming</h3>
            <Link to="/schedule" className="text-xs text-primary hover:underline flex items-center gap-1">Schedule <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {eventsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          ) : (
            <ul className="space-y-2">
              {events.map(e => (
                <li key={e.id} className="flex items-center gap-3 p-3 bg-surface-2 rounded-md border border-border">
                  <div className="text-center min-w-[44px]">
                    <div className="text-[10px] text-muted-foreground uppercase">{format(parseISO(e.start_time), "MMM")}</div>
                    <div className="font-display font-extrabold text-lg leading-none">{format(parseISO(e.start_time), "d")}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{e.title}</div>
                    <div className="text-[11px] text-muted-foreground">{format(parseISO(e.start_time), "EEE • h:mm a")}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/timer" className="surface p-5 hover:border-primary transition-colors group">
          <Timer className="w-6 h-6 text-primary mb-2" />
          <div className="font-display font-bold">Start Focus</div>
          <div className="text-xs text-muted-foreground">25-min Pomodoro session</div>
        </Link>
        <Link to="/flashcards" className="surface p-5 hover:border-primary transition-colors group">
          <Flame className="w-6 h-6 text-xp mb-2" />
          <div className="font-display font-bold">Review {dueCards} cards</div>
          <div className="text-xs text-muted-foreground">Spaced repetition</div>
        </Link>
        <Link to="/coach" className="surface p-5 hover:border-primary transition-colors group">
          <span className="text-2xl mb-2 block">🤖</span>
          <div className="font-display font-bold">Ask AI Coach</div>
          <div className="text-xs text-muted-foreground">Stuck? Get an answer</div>
        </Link>
      </div>
    </div>
  );
}
