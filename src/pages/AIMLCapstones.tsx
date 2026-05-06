import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader, EmptyState, SkeletonRow } from "@/components/ui-kit";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Markdown from "@/components/Markdown";
import { Plus, Github, Sparkles, Trash2, Loader2, Trophy, ExternalLink, Award } from "lucide-react";
import { toast } from "sonner";

type Capstone = {
  id: string;
  title: string;
  description: string | null;
  github_url: string | null;
  phase: string | null;
  day_number: number | null;
  status: "planned" | "in_progress" | "submitted" | "graded";
  ai_feedback: string | null;
  graded_at: string | null;
  score_correctness: number | null;
  score_code_quality: number | null;
  score_ml_soundness: number | null;
  score_documentation: number | null;
  score_originality: number | null;
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-surface-2 text-muted-foreground border-border",
  in_progress: "bg-info/15 text-info border-info/40",
  submitted: "bg-warning/15 text-warning border-warning/40",
  graded: "bg-success/15 text-success border-success/40",
};

export default function AIMLCapstones() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [openCap, setOpenCap] = useState<Capstone | null>(null);
  const [grading, setGrading] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [github, setGithub] = useState("");
  const [phase, setPhase] = useState("");

  const { data: capstones = [], isLoading } = useQuery({
    queryKey: ["aiml-capstones", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aiml_capstones" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Capstone[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("aiml_capstones" as any).insert({
        user_id: user!.id,
        title: title.trim(),
        description: desc.trim() || null,
        github_url: github.trim() || null,
        phase: phase.trim() || null,
        status: github.trim() ? "in_progress" : "planned",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aiml-capstones", user?.id] });
      setOpenNew(false);
      setTitle(""); setDesc(""); setGithub(""); setPhase("");
      toast.success("Capstone added");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to add"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Capstone["status"] }) => {
      await supabase.from("aiml_capstones" as any).update({ status }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aiml-capstones", user?.id] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("aiml_capstones" as any).delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aiml-capstones", user?.id] });
      toast.success("Deleted");
    },
  });

  const gradeWithAI = async (cap: Capstone) => {
    if (!cap.github_url) { toast.error("Add a GitHub URL first"); return; }
    setGrading(cap.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aiml-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({ mode: "capstone_grade", capstone_id: cap.id }),
      });
      if (r.status === 429) { toast.error("Rate limited — try again soon"); return; }
      if (r.status === 402) { toast.error("AI credits exhausted"); return; }
      if (!r.ok) { toast.error("Grading failed"); return; }
      toast.success("Graded! Open the project to see feedback.");
      qc.invalidateQueries({ queryKey: ["aiml-capstones", user?.id] });
    } finally {
      setGrading(null);
    }
  };

  const totalScore = (c: Capstone) => {
    const parts = [c.score_correctness, c.score_code_quality, c.score_ml_soundness, c.score_documentation, c.score_originality];
    if (parts.some(p => p == null)) return null;
    return Math.round(parts.reduce((a, b) => a + (b ?? 0), 0) / 5);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Capstone Projects"
        subtitle="Build · ship · get AI-graded · go portfolio-ready"
        action={
          <button onClick={() => setOpenNew(true)} className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New capstone
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : capstones.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-12 h-12 text-primary" />}
          title="No capstones yet"
          hint="Start with one of the suggested projects (e.g. ML pipeline, fine-tuned LLM, RAG agent). Add your repo when you're ready and get a senior-engineer-grade AI review."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {capstones.map(c => {
            const score = totalScore(c);
            return (
              <div key={c.id} className="surface p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[9px] font-mono uppercase tracking-widest border rounded px-1.5 py-0.5 ${STATUS_COLORS[c.status]}`}>
                        {c.status.replace("_", " ")}
                      </span>
                      {c.phase && <span className="text-[10px] text-muted-foreground font-mono">{c.phase}</span>}
                      {score !== null && (
                        <span className="ml-auto flex items-center gap-1 text-xs font-bold text-xp">
                          <Award className="w-3 h-3" /> {score}/10
                        </span>
                      )}
                    </div>
                    <button onClick={() => setOpenCap(c)} className="text-left">
                      <h3 className="font-display font-bold text-base">{c.title}</h3>
                    </button>
                    {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {c.github_url && (
                    <a href={c.github_url} target="_blank" rel="noreferrer"
                       className="text-xs px-2 py-1 rounded bg-surface-2 border border-border hover:border-primary flex items-center gap-1">
                      <Github className="w-3 h-3" /> Repo <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  <button onClick={() => gradeWithAI(c)} disabled={grading === c.id || !c.github_url}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 flex items-center gap-1 disabled:opacity-50">
                    {grading === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {c.status === "graded" ? "Re-grade" : "AI grade"}
                  </button>
                  <select value={c.status} onChange={e => updateStatus.mutate({ id: c.id, status: e.target.value as any })}
                          className="text-xs bg-surface-2 border border-border rounded px-2 py-1">
                    <option value="planned">Planned</option>
                    <option value="in_progress">In progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="graded">Graded</option>
                  </select>
                  <button onClick={() => remove.mutate(c.id)} className="ml-auto text-xs text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {score !== null && (
                  <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10px]">
                    {[
                      ["Correct", c.score_correctness],
                      ["Code", c.score_code_quality],
                      ["ML", c.score_ml_soundness],
                      ["Docs", c.score_documentation],
                      ["Orig", c.score_originality],
                    ].map(([l, v]) => (
                      <div key={l as string} className="bg-surface-2 rounded px-1 py-1 border border-border">
                        <div className="text-muted-foreground text-[9px] uppercase">{l}</div>
                        <div className="font-bold">{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New capstone dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New capstone</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs label-mono text-muted-foreground">TITLE</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                     placeholder="e.g. End-to-end MLOps pipeline"
                     className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs label-mono text-muted-foreground">DESCRIPTION</label>
              <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                        placeholder="What problem does it solve? What stack?" className="bg-surface-2" />
            </div>
            <div>
              <label className="text-xs label-mono text-muted-foreground">GITHUB URL (optional)</label>
              <input value={github} onChange={e => setGithub(e.target.value)}
                     placeholder="https://github.com/you/project"
                     className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs label-mono text-muted-foreground">PHASE (optional)</label>
              <input value={phase} onChange={e => setPhase(e.target.value)}
                     placeholder="e.g. Phase 5 — Deep Learning"
                     className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <button onClick={() => create.mutate()} disabled={!title.trim() || create.isPending}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold disabled:opacity-50">
              Create
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Capstone detail dialog */}
      <Dialog open={!!openCap} onOpenChange={(v) => !v && setOpenCap(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {openCap && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <span>{openCap.title}</span>
                  <span className={`text-[9px] font-mono uppercase tracking-widest border rounded px-1.5 py-0.5 ml-auto ${STATUS_COLORS[openCap.status]}`}>
                    {openCap.status.replace("_", " ")}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {openCap.description && <p className="text-sm text-muted-foreground">{openCap.description}</p>}
                {openCap.github_url && (
                  <a href={openCap.github_url} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Github className="w-4 h-4" /> {openCap.github_url}
                  </a>
                )}
                <button onClick={() => gradeWithAI(openCap)} disabled={grading === openCap.id || !openCap.github_url}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50">
                  {grading === openCap.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {openCap.ai_feedback ? "Re-grade with AI" : "Grade with AI"}
                </button>
                {openCap.ai_feedback && (
                  <div className="surface p-4 bg-surface-2">
                    <Markdown>{openCap.ai_feedback}</Markdown>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
