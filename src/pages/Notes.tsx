import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, EmptyState } from "@/components/ui-kit";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Search, Eye, Edit3, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import Markdown from "@/components/Markdown";
import NotesAIPanel from "@/components/NotesAIPanel";

export default function Notes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<number | null>(null);

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("notes").select("*").eq("user_id", user!.id).order("updated_at", { ascending: false })).data ?? [],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("subjects").select("*").eq("user_id", user!.id)).data ?? [],
  });

  const open = openId ? (notes as any[]).find(n => n.id === openId) : null;

  // Sync local editor state when opening a note
  useEffect(() => {
    if (open) {
      setTitle(open.title ?? "");
      setContent(open.content ?? "");
      setTagsStr((open.tags ?? []).join(", "));
      setSubjectId(open.subject_id ?? "");
      setMode("edit");
    }
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase.from("notes").insert({
        user_id: user.id,
        title: "Untitled note",
        content: "",
      }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      setOpenId(id);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes"] }); setOpenId(null); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const save = async () => {
    if (!open) return;
    const tags = tagsStr.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("notes").update({
      title: title || "Untitled",
      content,
      tags,
      subject_id: subjectId || null,
    }).eq("id", open.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["notes"] });
  };

  // Debounced autosave
  useEffect(() => {
    if (!open) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { save(); }, 1200);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, tagsStr, subjectId]);

  const uploadImage = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("note-images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("note-images").getPublicUrl(path);
      const md = `\n![image](${data.publicUrl})\n`;
      setContent(c => c + md);
      toast.success("Image inserted");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filtered = (notes as any[]).filter(n =>
    !search ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.content ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (n.tags ?? []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notes Vault"
        subtitle="Markdown · AI · Images"
        action={
          <button onClick={() => create.mutate()} className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-md text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New note
          </button>
        }
      />

      <div className="grid lg:grid-cols-[280px_1fr_320px] gap-4">
        {/* Left: list */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filtered.length === 0 && <EmptyState icon="📝" title="No notes" hint="Create your first note." />}
            {filtered.map((n: any) => (
              <button key={n.id} onClick={() => setOpenId(n.id)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${openId === n.id ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/50"}`}>
                <div className="font-bold text-sm truncate">{n.title}</div>
                <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{n.content || "Empty"}</div>
                <div className="text-[9px] text-muted-foreground mt-1">{format(parseISO(n.updated_at), "MMM d, HH:mm")}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Center: editor */}
        <div>
          {!open ? (
            <div className="surface p-12 text-center">
              <div className="text-4xl mb-3 opacity-50">📝</div>
              <div className="font-display font-bold text-lg">Pick a note or create one</div>
              <div className="text-muted-foreground text-sm mt-1">Markdown supported. AI tools live on the right.</div>
            </div>
          ) : (
            <div className="surface p-4 space-y-3">
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent font-display font-extrabold text-2xl focus:outline-none border-b border-border pb-2" placeholder="Note title" />

              <div className="flex flex-wrap gap-2 items-center">
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
                  className="bg-surface-2 border border-border rounded-md px-2 py-1 text-xs">
                  <option value="">No subject</option>
                  {(subjects as any[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="tags, comma, separated"
                  className="flex-1 min-w-[160px] bg-surface-2 border border-border rounded-md px-2 py-1 text-xs" />
                <div className="flex bg-surface-2 border border-border rounded-md overflow-hidden">
                  <button onClick={() => setMode("edit")} className={`px-2 py-1 text-xs flex items-center gap-1 ${mode === "edit" ? "bg-primary text-primary-foreground" : ""}`}>
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setMode("preview")} className={`px-2 py-1 text-xs flex items-center gap-1 ${mode === "preview" ? "bg-primary text-primary-foreground" : ""}`}>
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="bg-surface-2 border border-border px-2 py-1 rounded-md text-xs flex items-center gap-1 hover:border-primary/50">
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                  Image
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                <button onClick={() => remove.mutate(open.id)} className="text-destructive text-xs flex items-center gap-1 ml-auto">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>

              {mode === "edit" ? (
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={20}
                  className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:border-primary"
                  placeholder="# Markdown supported

- Lists
- **Bold** · *italic* · `code`
- ![Insert images via the Image button](url)
- $$inline math via code blocks$$"
                />
              ) : (
                <div className="bg-surface-2 border border-border rounded-md p-4 min-h-[400px]">
                  {content ? <Markdown>{content}</Markdown> : <div className="text-muted-foreground text-sm italic">Nothing to preview yet.</div>}
                </div>
              )}
              <div className="text-[10px] text-muted-foreground">Autosaves while you type.</div>
            </div>
          )}
        </div>

        {/* Right: AI */}
        <div className="space-y-3">
          <NotesAIPanel noteId={openId} onContentReplace={(md) => setContent(c => c + "\n\n" + md)} />
        </div>
      </div>
    </div>
  );
}
