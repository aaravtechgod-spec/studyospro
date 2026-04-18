import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, StatCard } from "@/components/ui-kit";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { format, subDays, parseISO, startOfDay } from "date-fns";

export default function Analytics() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString();
      const [focusRes, tasksRes, subjectsRes] = await Promise.all([
        supabase.from("focus_sessions").select("duration_minutes,started_at,subject_id").eq("user_id", user!.id).gte("started_at", since),
        supabase.from("tasks").select("status,completed_at,subject_id").eq("user_id", user!.id),
        supabase.from("subjects").select("id,name,color").eq("user_id", user!.id),
      ]);
      return { focus: focusRes.data ?? [], tasks: tasksRes.data ?? [], subjects: subjectsRes.data ?? [] };
    },
  });

  // Last 14 days focus
  const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
  const dailyFocus = days.map(d => {
    const minutes = (data?.focus ?? [])
      .filter(f => startOfDay(parseISO(f.started_at)).getTime() === startOfDay(d).getTime())
      .reduce((s, r) => s + r.duration_minutes, 0);
    return { day: format(d, "MMM d"), minutes };
  });

  // Subject breakdown
  const subjectMap: Record<string, { name: string; color: string; minutes: number }> = {};
  (data?.subjects ?? []).forEach((s: any) => { subjectMap[s.id] = { name: s.name, color: s.color, minutes: 0 }; });
  let unassigned = 0;
  (data?.focus ?? []).forEach(f => {
    if (f.subject_id && subjectMap[f.subject_id]) subjectMap[f.subject_id].minutes += f.duration_minutes;
    else unassigned += f.duration_minutes;
  });
  const pieData = Object.values(subjectMap).filter(s => s.minutes > 0);
  if (unassigned > 0) pieData.push({ name: "Unassigned", color: "#888", minutes: unassigned });

  const totalMin = (data?.focus ?? []).reduce((s, r) => s + r.duration_minutes, 0);
  const tasksDone = (data?.tasks ?? []).filter(t => t.status === "done").length;
  const tasksOpen = (data?.tasks ?? []).filter(t => t.status !== "done").length;
  const avg = totalMin / 30;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" subtitle="Study insights & trends — last 30 days" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total focus" value={`${totalMin}m`} accent="primary" />
        <StatCard label="Daily avg" value={`${Math.round(avg)}m`} accent="info" />
        <StatCard label="Tasks done" value={tasksDone} accent="success" />
        <StatCard label="Open tasks" value={tasksOpen} accent="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="surface p-5 lg:col-span-2">
          <div className="label-mono mb-3">Focus minutes — last 14 days</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyFocus}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface p-5">
          <div className="label-mono mb-3">By subject</div>
          {pieData.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">No focus sessions yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(d: any) => d.name}>
                  {pieData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--surface-2))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
