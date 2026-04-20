import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAIPrefs, DIFFICULTIES } from "@/hooks/useAIPrefs";
import { Sparkles, FileText, Layers, HelpCircle, Lightbulb, Wand2, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import Markdown from "./Markdown";
import { Link } from "react-router-dom";

type Action = "summarize" | "flashcards" | "quiz" | "explain" | "improve";

interface Quiz {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

const ACTIONS: { id: Action; label: string; icon: any; desc: string }[] = [
  { id: "summarize", label: "Summarize", icon: FileText, desc: "Key points + takeaways" },
  { id: "flashcards", label: "Flashcards", icon: Layers, desc: "→ creates a deck" },
  { id: "quiz", label: "Quiz me", icon: HelpCircle, desc: "MCQs with answers" },
  { id: "explain", label: "Explain", icon: Lightbulb, desc: "Like I'm a student" },
  { id: "improve", label: "Improve", icon: Wand2, desc: "Reformat & polish" },
];

export default function NotesAIPanel({ noteId, onContentReplace }: { noteId: string | null; onContentReplace?: (md: string) => void }) {
  const { user } = useAuth();
  const prefs = useAIPrefs();
  const [difficulty, setDifficulty] = useState(prefs.ai_difficulty);
  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState<Action | null>(null);
  const [text, setText] = useState<string>("");
  const [quiz, setQuiz] = useState<Quiz[] | null>(null);
  const [picked, setPicked] = useState<Record<number, number>>({});

  const run = async (action: Action) => {
    if (!noteId) { toast.error("Open a note first"); return; }
    if (!user) return;
    setBusy(action); setText(""); setQuiz(null); setPicked({});
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sign in again"); return; }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notes-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action, note_id: noteId, difficulty, count }),
      });
      const data = await resp.json();
      if (!resp.ok) { toast.error(data?.error ?? "AI failed"); return; }

      if (action === "flashcards") {
        toast.success(`Created ${data.count} cards in deck "${data.deck_name}"`, {
          action: { label: "Open", onClick: () => window.location.href = "/flashcards" },
        });
      } else if (action === "quiz") {
        setQuiz(data.questions ?? []);
      } else {
        setText(data.result ?? "");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Network error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="surface p-4 space-y-4 sticky top-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <div className="font-display font-bold">Notes AI</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(a => (
          <button key={a.id} disabled={!!busy || !noteId} onClick={() => run(a.id)}
            className="text-left p-2.5 rounded-md border border-border bg-surface-2 hover:border-primary/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {busy === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <a.icon className="w-3.5 h-3.5 text-primary" />}
              {a.label}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="label-mono mb-1">Difficulty</div>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-md px-2 py-1.5 text-xs">
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <div className="label-mono mb-1">Count</div>
          <input type="number" min={1} max={25} value={count} onChange={e => setCount(parseInt(e.target.value) || 1)}
            className="w-full bg-surface-2 border border-border rounded-md px-2 py-1.5 text-xs" />
        </div>
      </div>

      <Link to="/settings" className="text-[10px] text-muted-foreground hover:text-primary block">
        Defaults pulled from <span className="underline">AI Preferences</span>
      </Link>

      {text && (
        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="label-mono">Result</div>
            {onContentReplace && (
              <button onClick={() => { onContentReplace(text); toast.success("Inserted into note"); }}
                className="text-[10px] text-primary hover:underline">Insert into note ↑</button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto bg-surface-2 border border-border rounded-md p-3">
            <Markdown>{text}</Markdown>
          </div>
        </div>
      )}

      {quiz && quiz.length > 0 && (
        <div className="border-t border-border pt-3 space-y-3 max-h-[500px] overflow-y-auto">
          {quiz.map((q, i) => (
            <div key={i} className="bg-surface-2 border border-border rounded-md p-3">
              <div className="text-xs font-semibold mb-2">{i + 1}. {q.question}</div>
              <div className="space-y-1">
                {q.options.map((opt, oi) => {
                  const chosen = picked[i];
                  const isCorrect = oi === q.correct_index;
                  const isPicked = chosen === oi;
                  const reveal = chosen !== undefined;
                  return (
                    <button key={oi} disabled={reveal}
                      onClick={() => setPicked(p => ({ ...p, [i]: oi }))}
                      className={`w-full text-left text-xs px-2 py-1.5 rounded border transition-colors flex items-center justify-between ${
                        reveal && isCorrect ? "border-success/60 bg-success/10 text-success" :
                        reveal && isPicked && !isCorrect ? "border-destructive/60 bg-destructive/10 text-destructive" :
                        "border-border hover:border-primary/50"
                      }`}>
                      <span>{opt}</span>
                      {reveal && isCorrect && <Check className="w-3 h-3" />}
                      {reveal && isPicked && !isCorrect && <X className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
              {picked[i] !== undefined && (
                <div className="text-[10px] text-muted-foreground mt-2 italic">{q.explanation}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
