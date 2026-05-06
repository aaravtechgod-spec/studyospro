import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Markdown from "@/components/Markdown";
import { Skeleton } from "@/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ROADMAP, phaseFor } from "@/lib/aimlRoadmap";
import { useAimlSettings } from "@/hooks/useAimlSettings";
import { toast } from "sonner";
import {
  Sparkles, Check, X, Plus, Trash2, BookOpen, FileQuestion, ListChecks,
  AlertTriangle, SkipForward, Maximize2, Loader2, Code2, Save, Link2, ExternalLink,
} from "lucide-react";

interface Props {
  dayNumber: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isCompleted: boolean;
  onToggleComplete: () => void;
}

export default function DayDetail({ dayNumber, open, onOpenChange, isCompleted, onToggleComplete }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: settings } = useAimlSettings();
  const task = ROADMAP[dayNumber - 1];
  const phase = phaseFor(dayNumber);

  const [tab, setTab] = useState("plan");
  const [focusMode, setFocusMode] = useState(false);

  // ----- Sub-tasks -----
  const { data: subtasks = [] } = useQuery({
    queryKey: ["aiml-subtasks", user?.id, dayNumber],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("aiml_subtasks" as any)
        .select("*")
        .eq("user_id", user!.id).eq("day_number", dayNumber)
        .order("position");
      return (data ?? []) as any[];
    },
  });

  const [newSub, setNewSub] = useState("");
  const addSub = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from("aiml_subtasks" as any).insert({
        user_id: user!.id, day_number: dayNumber, title, position: subtasks.length,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aiml-subtasks", user?.id, dayNumber] }),
  });
  const toggleSub = useMutation({
    mutationFn: async (s: any) => {
      await supabase.from("aiml_subtasks" as any).update({ done: !s.done }).eq("id", s.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aiml-subtasks", user?.id, dayNumber] }),
  });
  const delSub = useMutation({
    mutationFn: async (id: string) => { await supabase.from("aiml_subtasks" as any).delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aiml-subtasks", user?.id, dayNumber] }),
  });

  // ----- Journal -----
  const { data: journal } = useQuery({
    queryKey: ["aiml-journal", user?.id, dayNumber],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("aiml_journal" as any)
        .select("*")
        .eq("user_id", user!.id).eq("day_number", dayNumber).maybeSingle();
      return (data ?? null) as any;
    },
  });
  const [learned, setLearned] = useState("");
  const [confusing, setConfusing] = useState("");
  useEffect(() => {
    setLearned(journal?.learned ?? "");
    setConfusing(journal?.confusing ?? "");
  }, [journal]);

  const saveJournal = useMutation({
    mutationFn: async (patch: { learned?: string; confusing?: string; blocker?: boolean; skipped?: boolean; skip_reason?: string; minutes_spent?: number }) => {
      const { error } = await supabase.from("aiml_journal" as any).upsert({
        user_id: user!.id, day_number: dayNumber, ...patch,
      }, { onConflict: "user_id,day_number" });
      if (error) throw error;
      // Award XP for first-time journal entry of the day
      if (patch.learned && patch.learned.length > 5) {
        await supabase.rpc("award_aiml_xp" as any, { _event: "aiml_journal" } as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aiml-journal", user?.id, dayNumber] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  // ----- Lesson -----
  const { data: lesson, isLoading: lessonLoading, refetch: regenLesson, isFetching: lessonFetching } = useQuery({
    queryKey: ["aiml-lesson", user?.id, dayNumber, settings?.track],
    enabled: !!user && open && tab === "lesson",
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aiml-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({
          mode: "lesson", day: dayNumber, title: task.title, detail: task.detail,
          phase: `${phase.title} — ${phase.goal}`, track: settings?.track ?? "engineer",
        }),
      });
      if (r.status === 429) { toast.error("Rate limited — try again in a moment"); throw new Error("rate"); }
      if (r.status === 402) { toast.error("AI credits exhausted"); throw new Error("credits"); }
      if (!r.ok) throw new Error("lesson failed");
      return await r.json();
    },
  });

  // ----- Quiz -----
  const { data: quiz, refetch: refetchQuiz, isFetching: quizFetching } = useQuery({
    queryKey: ["aiml-quiz", user?.id, dayNumber],
    enabled: !!user && open && tab === "quiz",
    queryFn: async () => {
      const { data: existing } = await supabase
        .from("aiml_quizzes" as any)
        .select("*").eq("user_id", user!.id).eq("day_number", dayNumber).maybeSingle();
      if (existing) return existing as any;
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aiml-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({ mode: "quiz", day: dayNumber, title: task.title, detail: task.detail, phase: phase.title }),
      });
      if (!r.ok) throw new Error("quiz failed");
      const j = await r.json();
      return { questions: j.questions };
    },
  });

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  useEffect(() => { setAnswers({}); setShowResults(false); }, [quiz?.questions]);

  const submitQuiz = useMutation({
    mutationFn: async () => {
      const qs = (quiz as any)?.questions ?? [];
      const correct = qs.filter((q: any, i: number) => answers[i] === q.correct).length;
      const score = Math.round((correct / qs.length) * 100);
      await supabase.from("aiml_quizzes" as any).upsert({
        user_id: user!.id, day_number: dayNumber,
        questions: qs, answers: Object.values(answers), score,
        attempts: ((quiz as any)?.attempts ?? 0) + 1,
        best_score: Math.max(score, (quiz as any)?.best_score ?? 0),
      }, { onConflict: "user_id,day_number" });
      const xpAmount = Math.round(score / 4); // 0..25
      await supabase.rpc("award_aiml_xp" as any, { _event: "aiml_quiz", _amount: xpAmount } as any);
      setShowResults(true);
      toast.success(`You scored ${score}% (+${xpAmount} XP)`);
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  // ----- Code review -----
  const [code, setCode] = useState("");
  const [reviewOut, setReviewOut] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const runReview = async () => {
    setReviewing(true); setReviewOut("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aiml-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({ mode: "review", day: dayNumber, title: task.title, code, language: "python" }),
      });
      const j = await r.json();
      setReviewOut(j.feedback ?? j.error ?? "No feedback");
    } catch (e: any) {
      toast.error(e?.message ?? "Review failed");
    } finally { setReviewing(false); }
  };

  // ----- Generate sub-tasks via AI -----
  const genSubtasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aiml-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({ mode: "subtasks", day: dayNumber, title: task.title, detail: task.detail }),
      });
      const j = await r.json();
      const steps: string[] = j.steps ?? [];
      for (let i = 0; i < steps.length; i++) {
        await supabase.from("aiml_subtasks" as any).insert({
          user_id: user!.id, day_number: dayNumber, title: steps[i], position: subtasks.length + i,
        });
      }
      qc.invalidateQueries({ queryKey: ["aiml-subtasks", user?.id, dayNumber] });
      toast.success(`Added ${steps.length} steps`);
    } catch { toast.error("Could not generate steps"); }
  };

  // ----- Resources -----
  const { data: resources, isFetching: resFetching, refetch: refetchRes } = useQuery({
    queryKey: ["aiml-resources", user?.id, dayNumber, settings?.track],
    enabled: !!user && open && tab === "resources",
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aiml-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({
          mode: "resources", day: dayNumber, title: task.title, detail: task.detail,
          phase: phase.title, track: settings?.track ?? "engineer",
        }),
      });
      if (r.status === 429) { toast.error("Rate limited"); throw new Error("rate"); }
      if (r.status === 402) { toast.error("AI credits exhausted"); throw new Error("credits"); }
      if (!r.ok) throw new Error("resources failed");
      return await r.json();
    },
  });

  if (!task) return null;

  const content = (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid grid-cols-5 w-full mb-4">
        <TabsTrigger value="plan" className="gap-1"><ListChecks className="w-3.5 h-3.5" />Plan</TabsTrigger>
        <TabsTrigger value="lesson" className="gap-1"><BookOpen className="w-3.5 h-3.5" />Lesson</TabsTrigger>
        <TabsTrigger value="quiz" className="gap-1"><FileQuestion className="w-3.5 h-3.5" />Quiz</TabsTrigger>
        <TabsTrigger value="review" className="gap-1"><Code2 className="w-3.5 h-3.5" />Review</TabsTrigger>
        <TabsTrigger value="journal" className="gap-1"><Save className="w-3.5 h-3.5" />Journal</TabsTrigger>
      </TabsList>

      {/* PLAN */}
      <TabsContent value="plan" className="space-y-4">
        <div className="text-sm text-muted-foreground">{task.detail}</div>

        <div className="surface p-4 bg-surface-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display font-bold text-sm">Sub-tasks</h4>
            <button onClick={genSubtasks} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI suggest 4 steps
            </button>
          </div>
          <ul className="space-y-1.5 mb-3">
            {subtasks.length === 0 && <li className="text-xs text-muted-foreground italic">No sub-tasks yet. Add one or let AI suggest.</li>}
            {subtasks.map((s: any) => (
              <li key={s.id} className="flex items-center gap-2 text-sm group">
                <button onClick={() => toggleSub.mutate(s)} className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${s.done ? "bg-success border-success text-background" : "border-border"}`}>
                  {s.done && <Check className="w-3 h-3" />}
                </button>
                <span className={`flex-1 ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
                <button onClick={() => delSub.mutate(s.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={(e) => { e.preventDefault(); if (newSub.trim()) { addSub.mutate(newSub.trim()); setNewSub(""); } }} className="flex gap-2">
            <input value={newSub} onChange={e => setNewSub(e.target.value)} placeholder="Add a micro-step…"
              className="flex-1 bg-surface border border-border rounded-md px-3 py-1.5 text-sm" />
            <button type="submit" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={onToggleComplete} className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${isCompleted ? "bg-success/20 text-success border border-success/40" : "bg-primary text-primary-foreground"}`}>
            <Check className="w-3.5 h-3.5" /> {isCompleted ? "Completed" : "Mark day complete"}
          </button>
          <button onClick={() => setFocusMode(true)} className="px-3 py-1.5 rounded-md text-xs bg-surface-2 border border-border flex items-center gap-1">
            <Maximize2 className="w-3.5 h-3.5" /> Focus mode
          </button>
          <button onClick={() => saveJournal.mutate({ blocker: !journal?.blocker })} className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${journal?.blocker ? "bg-warning/20 text-warning border border-warning/40" : "bg-surface-2 border border-border"}`}>
            <AlertTriangle className="w-3.5 h-3.5" /> {journal?.blocker ? "Stuck" : "Mark stuck"}
          </button>
          <button onClick={() => {
            const reason = prompt("Why skip today?");
            if (reason) saveJournal.mutate({ skipped: true, skip_reason: reason });
          }} className="px-3 py-1.5 rounded-md text-xs bg-surface-2 border border-border flex items-center gap-1">
            <SkipForward className="w-3.5 h-3.5" /> Skip
          </button>
        </div>
      </TabsContent>

      {/* LESSON */}
      <TabsContent value="lesson" className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{lesson?.cached ? "Cached" : "Fresh"} · Track: {settings?.track}</span>
          <button onClick={() => regenLesson()} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Regenerate
          </button>
        </div>
        {lessonLoading || lessonFetching ? (
          <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-4/6" /><Skeleton className="h-32 w-full" /></div>
        ) : lesson?.content ? (
          <div className="prose prose-sm prose-invert max-w-none"><Markdown>{lesson.content}</Markdown></div>
        ) : (
          <div className="text-sm text-muted-foreground">Click the tab to generate a deep-dive lesson for this day.</div>
        )}
      </TabsContent>

      {/* QUIZ */}
      <TabsContent value="quiz" className="space-y-4">
        {quizFetching ? <Skeleton className="h-40 w-full" /> :
          (quiz as any)?.questions?.length ? (
            <>
              {((quiz as any).questions as any[]).map((q, qi) => (
                <div key={qi} className="surface p-3 bg-surface-2">
                  <div className="text-sm font-semibold mb-2">{qi + 1}. {q.q}</div>
                  <div className="space-y-1">
                    {q.options.map((opt: string, oi: number) => {
                      const sel = answers[qi] === oi;
                      const correct = showResults && oi === q.correct;
                      const wrong = showResults && sel && oi !== q.correct;
                      return (
                        <button key={oi}
                          disabled={showResults}
                          onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                          className={`block w-full text-left px-3 py-1.5 rounded text-xs border transition-colors ${
                            correct ? "bg-success/20 border-success text-success" :
                            wrong ? "bg-destructive/20 border-destructive text-destructive" :
                            sel ? "bg-primary/20 border-primary" : "bg-surface border-border hover:border-primary/50"
                          }`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {showResults && q.explanation && (
                    <div className="text-[11px] text-muted-foreground mt-2 italic">💡 {q.explanation}</div>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                {!showResults ? (
                  <button onClick={() => submitQuiz.mutate()} disabled={Object.keys(answers).length < (quiz as any).questions.length}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold disabled:opacity-50">
                    Submit
                  </button>
                ) : (
                  <button onClick={() => { setAnswers({}); setShowResults(false); }}
                    className="px-4 py-2 bg-surface-2 border border-border rounded-md text-sm">Retry</button>
                )}
                <button onClick={() => refetchQuiz()} className="px-3 py-2 text-xs text-muted-foreground hover:text-primary">Generate new quiz</button>
              </div>
            </>
          ) : <div className="text-sm text-muted-foreground">Open the tab to generate a 5-question quiz.</div>
        }
      </TabsContent>

      {/* CODE REVIEW */}
      <TabsContent value="review" className="space-y-3">
        <div className="text-xs text-muted-foreground">Paste your code below — AI grades it on 5 axes.</div>
        <Textarea value={code} onChange={e => setCode(e.target.value)} rows={10} placeholder="# your python code here…"
          className="font-mono text-xs bg-surface-2" />
        <button onClick={runReview} disabled={!code.trim() || reviewing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-1.5 disabled:opacity-50">
          {reviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Code2 className="w-3.5 h-3.5" />}
          {reviewing ? "Reviewing…" : "Review my code"}
        </button>
        {reviewOut && <div className="prose prose-sm prose-invert max-w-none mt-3"><Markdown>{reviewOut}</Markdown></div>}
      </TabsContent>

      {/* JOURNAL */}
      <TabsContent value="journal" className="space-y-3">
        <div>
          <label className="text-xs label-mono text-muted-foreground">WHAT I LEARNED</label>
          <Textarea value={learned} onChange={e => setLearned(e.target.value)} rows={3} placeholder="One key insight…" className="bg-surface-2" />
        </div>
        <div>
          <label className="text-xs label-mono text-muted-foreground">WHAT'S CONFUSING</label>
          <Textarea value={confusing} onChange={e => setConfusing(e.target.value)} rows={3} placeholder="Something to revisit…" className="bg-surface-2" />
        </div>
        <button onClick={() => saveJournal.mutate({ learned, confusing })}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" /> Save reflection (+3 XP)
        </button>
      </TabsContent>
    </Tabs>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <span className="label-mono text-primary">DAY {dayNumber}</span>
              <span>{task.title}</span>
              <span className="text-[10px] bg-surface-2 border border-border rounded px-2 py-0.5 font-mono ml-auto">
                W{task.week} · {phase.title} · ~{task.hours}h
              </span>
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      {/* Focus mode (fullscreen) */}
      {focusMode && (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col">
          <div className="border-b border-border px-6 py-3 flex items-center gap-3">
            <span className="label-mono text-primary">FOCUS · DAY {dayNumber}</span>
            <button onClick={() => setFocusMode(false)} className="ml-auto p-1.5 hover:bg-surface-2 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-12 overflow-y-auto">
            <div className="max-w-2xl text-center">
              <div className="text-[10px] tracking-widest text-muted-foreground mb-3">{phase.title.toUpperCase()}</div>
              <h1 className="font-display font-extrabold text-4xl md:text-6xl mb-6 leading-tight">{task.title}</h1>
              <p className="text-lg text-muted-foreground mb-8">{task.detail}</p>
              <div className="space-y-2 max-w-md mx-auto text-left">
                {subtasks.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 text-base">
                    <button onClick={() => toggleSub.mutate(s)} className={`w-5 h-5 rounded border flex items-center justify-center ${s.done ? "bg-success border-success text-background" : "border-border"}`}>
                      {s.done && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className={s.done ? "line-through text-muted-foreground" : ""}>{s.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
