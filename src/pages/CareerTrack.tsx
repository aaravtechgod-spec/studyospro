import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getTrack, trackDayCount } from "@/lib/careerRoadmaps";
import { toast } from "sonner";
import { ArrowLeft, Check, ChevronDown, Loader2 } from "lucide-react";

export default function CareerTrack() {
  const { slug } = useParams();
  const track = getTrack(slug);
  const { user } = useAuth();
  const [done, setDone] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [openPhase, setOpenPhase] = useState<string | null>(
    track?.phases[0]?.key ?? null,
  );

  useEffect(() => {
    if (!user || !track) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("career_progress")
        .select("day_index")
        .eq("user_id", user.id)
        .eq("track", track.slug);
      if (!cancelled) {
        if (error) toast.error("Could not load your progress.");
        setDone(new Set((data ?? []).map((r: { day_index: number }) => r.day_index)));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, track]);

  const total = track ? trackDayCount(track) : 0;
  const pct = total ? Math.round((done.size / total) * 100) : 0;

  const currentDay = useMemo(() => {
    if (!track) return null;
    for (const phase of track.phases) {
      for (const d of phase.days) if (!done.has(d.day)) return { phase, day: d };
    }
    return null;
  }, [track, done]);

  if (!track) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">That track doesn't exist.</p>
        <Link to="/careers" className="text-primary hover:underline text-sm">Back to tracks</Link>
      </div>
    );
  }

  const toggleDay = async (dayIndex: number) => {
    if (!user) return;
    const isDone = done.has(dayIndex);
    const next = new Set(done);
    isDone ? next.delete(dayIndex) : next.add(dayIndex);
    setDone(next);

    if (isDone) {
      const { error } = await supabase
        .from("career_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("track", track.slug)
        .eq("day_index", dayIndex);
      if (error) { toast.error("Could not update."); setDone(done); }
    } else {
      const { error } = await supabase
        .from("career_progress")
        .insert({ user_id: user.id, track: track.slug, day_index: dayIndex });
      if (error) { toast.error("Could not update."); setDone(done); }
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <Link
        to="/careers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> All tracks
      </Link>

      <header className="surface p-5 md:p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl" aria-hidden>{track.emoji}</div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
              {track.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{track.blurb}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{done.size} of {total} days complete</span>
            <span className="font-semibold text-foreground">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {currentDay && (
          <div className="mt-5 rounded-md border border-border bg-surface-2 p-4">
            <div className="label-mono mb-1">Up next · Day {currentDay.day.day}</div>
            <div className="font-semibold">{currentDay.day.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{currentDay.phase.name}</div>
            <button
              onClick={() => { setOpenPhase(currentDay.phase.key); }}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Jump to it ↓
            </button>
          </div>
        )}
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your progress…
        </div>
      )}

      <div className="space-y-4">
        {track.phases.map((phase) => {
          const phaseDone = phase.days.filter((d) => done.has(d.day)).length;
          const isOpen = openPhase === phase.key;
          return (
            <section key={phase.key} className="surface overflow-hidden">
              <button
                onClick={() => setOpenPhase(isOpen ? null : phase.key)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-2 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-display font-extrabold text-base">{phase.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{phase.goal}</div>
                </div>
                <div className="label-mono shrink-0">{phaseDone}/{phase.days.length}</div>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <ul className="border-t border-border divide-y divide-border">
                  {phase.days.map((d) => {
                    const isDone = done.has(d.day);
                    return (
                      <li key={d.day} className="p-4 flex gap-3">
                        <button
                          onClick={() => toggleDay(d.day)}
                          aria-pressed={isDone}
                          aria-label={`Mark day ${d.day} ${isDone ? "incomplete" : "complete"}`}
                          className={`w-5 h-5 mt-0.5 shrink-0 rounded border flex items-center justify-center transition-colors ${
                            isDone
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-semibold ${isDone ? "line-through text-muted-foreground" : ""}`}>
                            <span className="label-mono mr-2">Day {d.day}</span>
                            {d.title}
                          </div>
                          <ul className="mt-1.5 space-y-0.5">
                            {d.tasks.map((t) => (
                              <li key={t} className="text-xs text-muted-foreground flex gap-1.5">
                                <span className="text-primary">·</span>{t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
