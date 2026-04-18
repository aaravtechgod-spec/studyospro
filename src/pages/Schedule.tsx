import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, EmptyState } from "@/components/ui-kit";
import { useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addWeeks, format, startOfWeek, isSameDay, parseISO, differenceInMinutes } from "date-fns";
import { toast } from "sonner";

export default function Schedule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", start_time: "", end_time: "", event_type: "study", subject_id: "" });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("subjects").select("*").eq("user_id", user!.id)).data ?? [],
  });

  const weekEnd = addDays(weekStart, 7);
  const { data: events = [] } = useQuery({
    queryKey: ["events", user?.id, weekStart.toISOString()],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*, subjects(name,color)")
        .eq("user_id", user!.id)
        .gte("start_time", weekStart.toISOString())
        .lt("start_time", weekEnd.toISOString())
        .order("start_time");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.start_time || !form.end_time) throw new Error("Fill all fields");
      await supabase.from("events").insert({
        user_id: user!.id,
        title: form.title,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        event_type: form.event_type,
        subject_id: form.subject_id || null,
      });
    },
    onSuccess: () => {
      setAdding(false);
      setForm({ title: "", start_time: "", end_time: "", event_type: "study", subject_id: "" });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["dashboard-events"] });
      toast.success("Event added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("events").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Study Schedule"
        subtitle="Plan & automate your week"
        action={
          <button onClick={() => setAdding(!adding)} className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-md text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add event
          </button>
        }
      />

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekStart(addWeeks(weekStart, -1))} className="bg-surface border border-border p-2 rounded-md"><ChevronLeft className="w-4 h-4" /></button>
        <div className="font-display font-bold">{format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}</div>
        <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="bg-surface border border-border p-2 rounded-md"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {adding && (
        <div className="surface p-5 mb-5 grid md:grid-cols-2 gap-3 animate-fade-in">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm md:col-span-2" />
          <input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          <input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
            <option value="study">Study session</option>
            <option value="class">Class</option>
            <option value="exam">Exam</option>
            <option value="other">Other</option>
          </select>
          <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm">
            <option value="">No subject</option>
            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="md:col-span-2 flex gap-2">
            <button onClick={() => create.mutate()} className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-sm">Save</button>
            <button onClick={() => setAdding(false)} className="bg-surface-2 border border-border px-4 py-2 rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {days.map(d => {
          const dayEvents = events.filter((e: any) => isSameDay(parseISO(e.start_time), d));
          return (
            <div key={d.toISOString()} className={`surface p-3 min-h-[160px] ${isSameDay(d, new Date()) ? "border-primary" : ""}`}>
              <div className="label-mono">{format(d, "EEE")}</div>
              <div className="font-display font-extrabold text-2xl mb-2">{format(d, "d")}</div>
              <div className="space-y-1.5">
                {dayEvents.length === 0 && <div className="text-[10px] text-muted-foreground">—</div>}
                {dayEvents.map((e: any) => (
                  <div key={e.id} className="bg-surface-2 border-l-2 rounded p-1.5 text-xs group" style={{ borderColor: e.subjects?.color ?? "hsl(var(--primary))" }}>
                    <div className="font-semibold truncate flex items-center gap-1">
                      <span className="flex-1 truncate">{e.title}</span>
                      <button onClick={() => remove.mutate(e.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{format(parseISO(e.start_time), "h:mm a")} · {differenceInMinutes(parseISO(e.end_time), parseISO(e.start_time))}m</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && <div className="mt-5"><EmptyState title="No events this week" hint="Plan ahead with study blocks and classes." /></div>}
    </div>
  );
}
