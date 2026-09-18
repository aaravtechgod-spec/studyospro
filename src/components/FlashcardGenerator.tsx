import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { extractTextFromFile } from "@/lib/extractText";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";

type Amount = "fewer" | "standard" | "more";
type Difficulty = "easy" | "medium" | "hard";

const AMOUNTS: { key: Amount; label: string; hint: string }[] = [
  { key: "fewer", label: "Fewer", hint: "~8 cards" },
  { key: "standard", label: "Standard", hint: "~16 cards" },
  { key: "more", label: "More", hint: "~30 cards" },
];

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

const IDEAS = [
  "Photosynthesis — light and dark reactions",
  "Key dates and causes of the French Revolution",
  "Trigonometric identities I keep forgetting",
  "Everything from the chapter I just uploaded",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Deck to add cards into. When omitted a new deck is created. */
  deckId?: string;
  onCreated?: (deckId: string) => void;
}

export default function FlashcardGenerator({ open, onOpenChange, deckId, onCreated }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState<Amount>("standard");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState<{ name: string; text: string } | null>(null);
  const [noteId, setNoteId] = useState("");
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data: notes = [] } = useQuery({
    queryKey: ["notes-for-cards", user?.id],
    enabled: !!user && open,
    queryFn: async () =>
      (await supabase.from("notes").select("id, title, content").eq("user_id", user!.id).order("updated_at", { ascending: false }).limit(50)).data ?? [],
  });

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const text = await extractTextFromFile(file);
      setSource({ name: file.name, text });
      setNoteId("");
      toast.success(`Read ${file.name}`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not read that file.");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const pickNote = (id: string) => {
    setNoteId(id);
    const note = (notes as any[]).find((n) => n.id === id);
    if (note) setSource({ name: note.title, text: note.content ?? "" });
    else setSource(null);
  };

  const generate = async () => {
    if (!user) return;
    if (!topic.trim() && !source?.text.trim()) {
      toast.error("Add a topic or upload notes/a PDF first.");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("flashcards-generate", {
        body: {
          amount,
          difficulty,
          topic,
          source: source?.text ?? "",
          source_name: source?.name ?? "",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const cards: { front: string; back: string }[] = data.cards ?? [];
      if (!cards.length) throw new Error("No cards came back. Try a different topic.");

      let targetDeck = deckId;
      if (!targetDeck) {
        const { data: deck, error: deckErr } = await supabase
          .from("decks")
          .insert({ user_id: user.id, name: data.deck_name || topic.slice(0, 40) || "AI Deck" })
          .select("id")
          .single();
        if (deckErr) throw deckErr;
        targetDeck = deck.id;
      }

      const { error: cardErr } = await supabase.from("flashcards").insert(
        cards.map((c) => ({ user_id: user.id, deck_id: targetDeck!, front: c.front, back: c.back })),
      );
      if (cardErr) throw cardErr;

      qc.invalidateQueries({ queryKey: ["decks"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
      toast.success(`${cards.length} cards created 🎉`);
      onCreated?.(targetDeck!);
      onOpenChange(false);
      setTopic("");
      setSource(null);
      setNoteId("");
    } catch (e: any) {
      toast.error(e.message ?? "Could not generate cards.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Customize Flashcards
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Source */}
          <div>
            <div className="label-mono mb-2">Study material <span className="opacity-60">(optional)</span></div>
            {source ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm truncate flex-1">{source.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {source.text.length.toLocaleString()} chars
                </span>
                <button
                  onClick={() => { setSource(null); setNoteId(""); }}
                  aria-label="Remove source"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={parsing}
                  className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface-2 py-3 text-sm hover:border-primary transition-colors disabled:opacity-50"
                >
                  {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {parsing ? "Reading…" : "Upload PDF / notes"}
                </button>
                <select
                  value={noteId}
                  onChange={(e) => pickNote(e.target.value)}
                  aria-label="Use one of my notes"
                  className="rounded-md border border-border bg-surface-2 px-3 py-3 text-sm"
                >
                  <option value="">Use one of my notes…</option>
                  {(notes as any[]).map((n) => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))}
                </select>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown,.csv,text/*,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Number of cards */}
            <div>
              <div className="text-sm font-medium mb-2">Number of Cards</div>
              <div className="flex flex-wrap gap-2">
                {AMOUNTS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setAmount(a.key)}
                    aria-pressed={amount === a.key}
                    title={a.hint}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                      amount === a.key
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-surface-2 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {amount === a.key && <Check className="w-3.5 h-3.5" />}
                    {a.label}{a.key === "standard" ? " (Default)" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <div className="text-sm font-medium mb-2">Level of Difficulty</div>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDifficulty(d.key)}
                    aria-pressed={difficulty === d.key}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                      difficulty === d.key
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-surface-2 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {difficulty === d.key && <Check className="w-3.5 h-3.5" />}
                    {d.label}{d.key === "medium" ? " (Default)" : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Topic */}
          <div>
            <div className="label-mono mb-2">What should the cards cover?</div>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="e.g. Chapter 6 — Life Processes, focus on respiration"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
            <div className="mt-3">
              <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">Things to try</div>
              <ul className="space-y-1">
                {IDEAS.map((idea) => (
                  <li key={idea}>
                    <button
                      onClick={() => setTopic(idea)}
                      className="text-left text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      · {idea}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={generating || parsing}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary py-3 font-bold text-primary-foreground hover:bg-primary-glow transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Generating…" : "Generate"}
          </button>
          <p className="text-[10px] text-center text-muted-foreground">
            AI can make mistakes — check important facts against your textbook.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
