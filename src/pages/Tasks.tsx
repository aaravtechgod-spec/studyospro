import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAwardXp } from "@/hooks/useProfile";
import { PageHeader, EmptyState } from "@/components/ui-kit";
import { format, parseISO, differenceInDays } from "date-fns";
import { useState } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props { mode?: "homework" | "exams"; }

export default function Tasks({ mode = "homework" }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const awardXp = useAwardXp();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("medium");

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("subjects").select("*").eq("user_id", user!.id)).data ?? [],
  });
  const [subjectId, setSubjectId] = useState<string>("");

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id, mode],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*, subjects(name,color)")
        .eq("user_id", user!.id)
        .order("status").order("due_date", { ascending: true, nullsFirst: false });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title required");
      const { error } = await supabase.from("tasks").insert({
        user_id: user!.id,
        title: title.trim(),
        due_date: due ? new Date(due).toISOString() : null,
        priority,
        subject_id: subjectId || null,
        xp_reward: mode === "exams" ? 50 : 10,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task added");
      setTitle(""); setDue(""); setPriority("medium"); setSubjectId(""); setAdding(false);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard-tasks"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const complete = useMutation({
    mutationFn: async (t: any) => {
      const { error } = await supabase.from("tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", t.id);
      if (error) throw error;
      // Server decides the XP amount based on the task itself.
      const result = await awardXp.mutateAsync({ event_type: "task_complete", ref_id: t.id });
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Task complete! XP: ${result?.xp ?? "+"}`);
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard-tasks"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });

  const isExam = mode === "exams";
  const title_ = isExam ? "Exam Planner" : "Homework Tracker";
  const sub = isExam ? "Track upcoming tests & exams" : "Never miss an assignment";

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={title_}
        subtitle={sub}
        action={
          <button onClick={() => setAdding(!adding)} className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-primary-glow">
            <Plus className="w-4 h-4" /> Add task
          </button>
        }
      />

      {adding && (
        <div className="surface p-5 mb-5 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm md:col-span-2" />
            <input type="datetime-local" value={due} onChange={e => setDue(e.target.value)} className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
            <select value={priority} onChange={e => setPriority(e.target.value)} className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm md:col-span-2">
              <option value="">No subject</option>
              {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => create.mutate()} disabled={create.isPending} className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-sm">Save</button>
            <button onClick={() => setAdding(false)} className="bg-surface-2 border border-border px-4 py-2 rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState icon="📋" title="No tasks yet" hint="Click Add task to create your first one." />
      ) : (
        <div className="space-y-2">
          {tasks.map((t: any) => {
            const days = t.due_date ? differenceInDays(parseISO(t.due_date), new Date()) : null;
            const done = t.status === "done";
            return (
              <div key={t.id} className={`surface p-4 flex items-center gap-3 ${done ? "opacity-50" : ""}`}>
                <button
                  onClick={() => !done && complete.mutate(t)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${done ? "bg-success border-success" : "border-border hover:border-primary"}`}
                >
                  {done && <Check className="w-3.5 h-3.5 text-background" />}
                </button>
                <div className={`w-1 self-stretch rounded ${t.priority === "high" ? "bg-destructive" : t.priority === "low" ? "bg-info" : "bg-warning"}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${done ? "line-through" : ""}`}>{t.title}</div>
                  <div className="text-[11px] text-muted-foreground flex gap-2 items-center mt-0.5">
                    {t.subjects && <span style={{ color: t.subjects.color }}>{t.subjects.name}</span>}
                    {t.due_date && <span>· Due {format(parseISO(t.due_date), "MMM d, h:mm a")}</span>}
                    <span className="text-xp">· +{t.xp_reward} XP</span>
                  </div>
                </div>
                {!done && days !== null && (
                  <span className={`text-[10px] font-mono px-2 py-1 rounded ${days < 0 ? "bg-destructive/20 text-destructive" : days <= 1 ? "bg-warning/20 text-warning" : "bg-surface-3 text-muted-foreground"}`}>
                    {days < 0 ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d left`}
                  </span>
                )}
                <button onClick={() => remove.mutate(t.id)} className="text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
