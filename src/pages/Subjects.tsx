import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, EmptyState } from "@/components/ui-kit";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#e8ff5a", "#69ff85", "#40c4ff", "#b39ddb", "#ffab40", "#ff5252", "#ffd700", "#00ffcc"];

export default function Subjects() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("subjects").select("*").eq("user_id", user!.id).order("created_at")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("subjects").insert({ user_id: user.id, name: name.trim(), color });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Subject added"); },
    onError: (e: any) => toast.error(e.message ?? "Failed to add subject"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Subjects" subtitle="Group your studies — color-code everything" />

      <div className="surface p-5 mb-5">
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="label-mono block mb-1.5">New subject</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Calculus II" className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="label-mono block mb-1.5">Color</label>
            <div className="flex gap-1.5">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} />
              ))}
            </div>
          </div>
          <button onClick={() => create.mutate()} className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-md text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <EmptyState icon="🎓" title="No subjects yet" hint="Add courses to organize tasks, notes, and timers." />
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {subjects.map((s: any) => (
            <div key={s.id} className="surface p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg" style={{ background: s.color }} />
              <div className="flex-1 font-display font-bold truncate">{s.name}</div>
              <button onClick={() => remove.mutate(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
