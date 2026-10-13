import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, StatCard } from "@/components/ui-kit";
import { readUsage, type UsageMap } from "@/hooks/useTimeTracker";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { format, subDays, parseISO, startOfDay, isSameDay } from "date-fns";

const fmtDuration = (minutes: number) => {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
};

export default function Analytics() {
  const { user } = useAuth();

  const sessionSeconds = (session: { duration_minutes: number; duration_seconds?: number | null }) =>
    session.duration_seconds ?? session.duration_minutes * 60;

  const { data } = useQuery({
    queryKey: ["analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString();
      const [focusRes, tasksRes, subjectsRes] = await Promise.all([
        supabase.from("focus_sessions").select("duration_minutes,duration_seconds,started_at,subject_id,session_type").eq("user_id", user!.id).gte("started_at", since),
        supabase.from("tasks").select("status,completed_at,subject_id").eq("user_id", user!.id),
        supabase.from("subjects").select("id,name,color").eq("user_id", user!.id),
      ]);
      return { focus: focusRes.data ?? [], tasks: tasksRes.data ?? [], subjects: subjectsRes.data ?? [] };
    },
  });

  const [usage, setUsage] = useState<UsageMap>(() => readUsage());

  useEffect(() => {
    const refreshUsage = () => setUsage(readUsage());
    window.addEventListener("studyos:usage-updated", refreshUsage);
    window.addEventListener("storage", refreshUsage);
    return () => {
      window.removeEventListener("studyos:usage-updated", refreshUsage);
      window.removeEventListener("storage", refreshUsage);
    };
  }, []);

  // Only real study time (timer + stopwatch sessions), breaks excluded.
  const study = (data?.focus ?? []).filter(f => (f.session_type ?? "focus") === "focus");

  const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
  const daily = days.map(d => {
    const key = format(d, "yyyy-MM-dd");
    const studyMin = study
      .filter(f => startOfDay(parseISO(f.started_at)).getTime() === startOfDay(d).getTime())
    .reduce((s, r) => s + sessionSeconds(r), 0) / 60;
    return {
      day: format(d, "MMM d"),
      study: studyMin,
      onSite: Math.round((usage[key] ?? 0) / 60),
    };
  });

  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");
  const todayStudy = study.filter(f => isSameDay(parseISO(f.started_at), today))
    .reduce((s, r) => s + sessionSeconds(r), 0) / 60;
  const todayOnSite = Math.round((usage[todayKey] ?? 0) / 60);

  const totalStudy = study.reduce((s, r) => s + sessionSeconds(r), 0) / 60;
  const totalOnSite = days.reduce((s, d) => s + (usage[format(d, "yyyy-MM-dd")] ?? 0), 0) / 60;
  const activeDays = days.filter((d, i) => daily[i].study > 0).length;
  const bestDay = daily.reduce((best, d) => (d.study > best.study ? d : best), daily[0] ?? { day: "—", study: 0, onSite: 0 });

  const focusRatio = totalOnSite > 0 ? Math.min(100, Math.round((daily.reduce((s, d) => s + d.study, 0) / totalOnSite) * 100)) : 0;

  // Subject breakdown
  const subjectMap: Record<string, { name: string; color: string; minutes: number }> = {};
  (data?.subjects ?? []).forEach(s => { subjectMap[s.id] = { name: s.name, color: s.color, minutes: 0 }; });
  let unassigned = 0;
  study.forEach(f => {
    const minutes = sessionSeconds(f) / 60;
    if (f.subject_id && subjectMap[f.subject_id]) subjectMap[f.subject_id].minutes += minutes;
    else unassigned += minutes;
  });
  const pieData = Object.values(subjectMap).filter(s => s.minutes > 0);
  if (unassigned > 0) pieData.push({ name: "Unassigned", color: "hsl(var(--muted-foreground))", minutes: unassigned });

  const tasksDone = (data?.tasks ?? []).filter(t => t.status === "done").length;
  const tasksOpen = (data?.tasks ?? []).filter(t => t.status !== "done").length;

  const tooltipStyle = {
    background: "hsl(var(--surface-2))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" subtitle="Study done vs. time on StudyOS" />

      {/* Today */}
      <div className="surface p-6 mb-5 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
        <div className="relative grid sm:grid-cols-3 gap-6">
          <div>
            <div className="label-mono text-muted-foreground">Study done today</div>
            <div className="font-mono font-bold text-5xl tabular-nums text-primary mt-1">{fmtDuration(todayStudy)}</div>
            <div className="text-xs text-muted-foreground mt-1">Timer + stopwatch sessions</div>
          </div>
          <div>
            <div className="label-mono text-muted-foreground">Time on site today</div>
            <div className="font-mono font-bold text-5xl tabular-nums mt-1">{fmtDuration(todayOnSite)}</div>
            <div className="text-xs text-muted-foreground mt-1">Counted only while the app is open and focused</div>
          </div>
          <div>
            <div className="label-mono text-muted-foreground">Focus ratio · 14 days</div>
            <div className="font-mono font-bold text-5xl tabular-nums mt-1">{focusRatio}%</div>
            <div className="h-2 bg-surface-3 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${focusRatio}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <StatCard label="Study · 30 days" value={fmtDuration(totalStudy)} accent="primary" />
        <StatCard label="On site · 14 days" value={fmtDuration(totalOnSite)} accent="info" />
        <StatCard label="Best day" value={`${bestDay.study}m`} accent="success" />
        <StatCard label="Active days · 14" value={`${activeDays}/14`} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="surface p-5 lg:col-span-2">
          <div className="label-mono mb-3">Study done vs. time on site — last 14 days (minutes)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={daily}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="study" name="Study" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="onSite" name="On site" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface p-5">
          <div className="label-mono mb-3">Study by subject</div>
          {pieData.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">No study sessions yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(d: any) => d.name}>
                  {pieData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="surface p-5 lg:col-span-2">
          <div className="label-mono mb-3">Study trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="study" stroke="hsl(var(--primary))" fill="url(#studyFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="surface p-5">
          <div className="label-mono mb-3">Tasks</div>
          <div className="space-y-3">
            <StatCard label="Completed" value={tasksDone} accent="success" />
            <StatCard label="Still open" value={tasksOpen} accent="warning" />
            <StatCard label="Sessions · 30 days" value={study.length} accent="primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
