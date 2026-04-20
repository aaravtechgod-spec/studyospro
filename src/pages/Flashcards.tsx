import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAwardXp } from "@/hooks/useProfile";
import { PageHeader, EmptyState } from "@/components/ui-kit";
import { useState } from "react";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { addDays } from "date-fns";

// SM-2 algorithm
function sm2(card: any, quality: number) {
  let { ease, interval_days, repetitions } = card;
  if (quality < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval_days = 1;
    else if (repetitions === 2) interval_days = 6;
    else interval_days = Math.round(interval_days * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }
  return { ease, interval_days, repetitions, due_date: addDays(new Date(), interval_days).toISOString(), last_reviewed: new Date().toISOString() };
}

export default function Flashcards() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const awardXp = useAwardXp();
  const [activeDeck, setActiveDeck] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [studyIdx, setStudyIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const { data: decks = [] } = useQuery({
    queryKey: ["decks", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("decks").select("*").eq("user_id", user!.id).order("created_at")).data ?? [],
  });

  const { data: cards = [] } = useQuery({
    queryKey: ["cards", activeDeck],
    enabled: !!activeDeck,
    queryFn: async () => (await supabase.from("flashcards").select("*").eq("deck_id", activeDeck!).order("created_at")).data ?? [],
  });

  const { data: dueCards = [] } = useQuery({
    queryKey: ["due-cards-deck", activeDeck],
    enabled: !!activeDeck && studyMode,
    queryFn: async () => (await supabase.from("flashcards").select("*").eq("deck_id", activeDeck!).lte("due_date", new Date().toISOString())).data ?? [],
  });

  const createDeck = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!newDeckName.trim()) throw new Error("Name required");
      const { error } = await supabase.from("decks").insert({ user_id: user.id, name: newDeckName.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setNewDeckName(""); qc.invalidateQueries({ queryKey: ["decks"] }); toast.success("Deck created"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const removeDeck = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("decks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const addCard = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!front.trim() || !back.trim()) throw new Error("Both sides required");
      const { error } = await supabase.from("flashcards").insert({ user_id: user.id, deck_id: activeDeck!, front, back });
      if (error) throw error;
    },
    onSuccess: () => { setFront(""); setBack(""); qc.invalidateQueries({ queryKey: ["cards"] }); qc.invalidateQueries({ queryKey: ["due-cards"] }); toast.success("Card added"); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const removeCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("flashcards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const review = useMutation({
    mutationFn: async ({ card, quality }: { card: any; quality: number }) => {
      const next = sm2(card, quality);
      const { error } = await supabase.from("flashcards").update(next).eq("id", card.id);
      if (error) throw error;
      if (quality >= 3) await awardXp.mutateAsync({ event_type: "flashcard_review" });
    },
    onSuccess: () => {
      setShowBack(false);
      if (studyIdx + 1 >= dueCards.length) {
        toast.success("Session complete! 🎉");
        setStudyMode(false);
        setStudyIdx(0);
        qc.invalidateQueries({ queryKey: ["due-cards"] });
        qc.invalidateQueries({ queryKey: ["cards"] });
      } else {
        setStudyIdx(i => i + 1);
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  // STUDY MODE
  if (studyMode && activeDeck) {
    const card = dueCards[studyIdx];
    if (!card) {
      return (
        <div className="animate-fade-in">
          <PageHeader title="All caught up!" subtitle="No cards due right now in this deck." />
          <button onClick={() => setStudyMode(false)} className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-md text-sm">Back</button>
        </div>
      );
    }
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <button onClick={() => { setStudyMode(false); setStudyIdx(0); setShowBack(false); }} className="text-sm text-muted-foreground flex items-center gap-1 mb-4 hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Exit
        </button>
        <div className="text-xs label-mono mb-2">Card {studyIdx + 1} of {dueCards.length}</div>
        <div className="surface p-10 min-h-[300px] flex flex-col items-center justify-center text-center mb-4">
          <div className="font-display font-extrabold text-2xl whitespace-pre-wrap">{card.front}</div>
          {showBack && (
            <>
              <hr className="border-border w-24 my-6" />
              <div className="text-lg whitespace-pre-wrap">{card.back}</div>
            </>
          )}
        </div>
        {!showBack ? (
          <button onClick={() => setShowBack(true)} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md">Show answer</button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => review.mutate({ card, quality: 1 })} className="bg-destructive/20 text-destructive font-bold py-3 rounded-md hover:bg-destructive/30">Again</button>
            <button onClick={() => review.mutate({ card, quality: 3 })} className="bg-warning/20 text-warning font-bold py-3 rounded-md hover:bg-warning/30">Hard</button>
            <button onClick={() => review.mutate({ card, quality: 4 })} className="bg-info/20 text-info font-bold py-3 rounded-md hover:bg-info/30">Good</button>
            <button onClick={() => review.mutate({ card, quality: 5 })} className="bg-success/20 text-success font-bold py-3 rounded-md hover:bg-success/30">Easy</button>
          </div>
        )}
      </div>
    );
  }

  // DECK VIEW
  if (activeDeck) {
    const deck = decks.find((d: any) => d.id === activeDeck);
    const dueCount = cards.filter((c: any) => new Date(c.due_date) <= new Date()).length;
    return (
      <div className="animate-fade-in">
        <button onClick={() => setActiveDeck(null)} className="text-sm text-muted-foreground flex items-center gap-1 mb-3 hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Decks
        </button>
        <PageHeader
          title={deck?.name ?? "Deck"}
          subtitle={`${cards.length} cards · ${dueCount} due now`}
          action={
            <button onClick={() => { setStudyMode(true); setStudyIdx(0); setShowBack(false); }} disabled={dueCount === 0}
              className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-md text-sm disabled:opacity-50">
              Study {dueCount > 0 ? `(${dueCount})` : ""}
            </button>
          }
        />

        <div className="surface p-5 mb-5 space-y-3">
          <div className="label-mono">Add card</div>
          <textarea value={front} onChange={e => setFront(e.target.value)} placeholder="Front (question)" rows={2} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          <textarea value={back} onChange={e => setBack(e.target.value)} placeholder="Back (answer)" rows={2} className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          <button onClick={() => addCard.mutate()} className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-sm">Add card</button>
        </div>

        {cards.length === 0 ? (
          <EmptyState title="No cards yet" hint="Add your first card above." />
        ) : (
          <div className="space-y-2">
            {cards.map((c: any) => (
              <div key={c.id} className="surface p-4 flex items-start gap-3">
                <div className="flex-1 grid md:grid-cols-2 gap-3">
                  <div className="text-sm">{c.front}</div>
                  <div className="text-sm text-muted-foreground border-l border-border pl-3">{c.back}</div>
                </div>
                <button onClick={() => removeCard.mutate(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // DECK LIST
  return (
    <div className="animate-fade-in">
      <PageHeader title="Flashcards" subtitle="Active recall + spaced repetition (SM-2)" />

      <div className="surface p-5 mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          <input value={newDeckName} onChange={e => setNewDeckName(e.target.value)} placeholder="New deck name" className="flex-1 min-w-[200px] bg-surface-2 border border-border rounded-md px-3 py-2 text-sm" />
          <button onClick={() => createDeck.mutate()} className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-md text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Create deck</button>
        </div>
      </div>

      {decks.length === 0 ? (
        <EmptyState icon="🃏" title="No decks yet" hint="Create your first deck to start memorizing." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((d: any) => (
            <div key={d.id} className="surface p-5 hover:border-primary transition-colors group">
              <button onClick={() => setActiveDeck(d.id)} className="text-left w-full">
                <div className="font-display font-extrabold text-lg">{d.name}</div>
                <div className="text-xs text-muted-foreground mt-1">Click to study</div>
              </button>
              <button onClick={() => removeDeck.mutate(d.id)} className="absolute opacity-0 group-hover:opacity-100 text-destructive text-xs">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
