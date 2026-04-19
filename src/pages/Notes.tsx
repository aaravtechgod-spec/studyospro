import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, EmptyState } from "@/components/ui-kit";
import { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function Notes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notes").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!title.trim()) throw new Error("Title required");
      const tags = tagsStr.split(",").map(s => s.trim()).filter(Boolean);
      const { error } = await supabase.from("notes").insert({ user_id: user.id, title, content, tags });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(""); setContent(""); setTagsStr(""); setAdding(false);
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); setOpenId(null); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const update = useMutation({
    mutationFn: async (n: any) => {
      const { error } = await supabase.from("notes").update({ title: n.title, content: n.content }).eq("id", n.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const filtered = notes.filter((n: any) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const open = openId ? notes.find((n: any) => n.id === openId) : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notes Vault"
        subtitle="Organize & search your study notes"
        action={
          <button onClick={() => setAdding(!adding)} className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-md text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New note
          </button>
        }
      />

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…"
          className="w-full bg-surface border border-border rounded-md pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
      </div>

      {adding && (
        <div className="surface p-5 mb-5 animate-fade-in space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title" className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write here…" rows={6} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm resize-y" />
          <input value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="tags, comma, separated" className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={() => create.mutate()} className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-sm">Save</button>
            <button onClick={() => setAdding(false)} className="bg-surface-2 border border-border px-4 py-2 rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="📝" title="No notes yet" hint="Capture your first idea." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n: any) => (
            <button key={n.id} onClick={() => setOpenId(n.id)} className="surface p-4 text-left hover:border-primary transition-colors">
              <div className="font-display font-bold truncate">{n.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-3 mt-1 whitespace-pre-wrap">{n.content || "Empty"}</div>
              <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
                <span>{format(parseISO(n.updated_at), "MMM d")}</span>
                <span className="flex gap-1 flex-wrap">
                  {(n.tags ?? []).slice(0, 3).map((t: string) => <span key={t} className="bg-surface-2 px-1.5 py-0.5 rounded">{t}</span>)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div onClick={() => setOpenId(null)} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div onClick={e => e.stopPropagation()} className="surface w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <input
              defaultValue={open.title}
              onBlur={e => e.target.value !== open.title && update.mutate({ ...open, title: e.target.value })}
              className="w-full bg-transparent font-display font-extrabold text-2xl mb-3 focus:outline-none border-b border-border pb-2"
            />
            <textarea
              defaultValue={open.content ?? ""}
              onBlur={e => e.target.value !== (open.content ?? "") && update.mutate({ ...open, content: e.target.value })}
              rows={14}
              className="w-full bg-transparent text-sm focus:outline-none resize-none font-mono"
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
              <button onClick={() => remove.mutate(open.id)} className="text-destructive text-sm flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete</button>
              <button onClick={() => setOpenId(null)} className="bg-surface-2 border border-border px-4 py-2 rounded-md text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
