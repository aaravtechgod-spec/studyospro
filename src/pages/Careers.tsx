import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CAREER_TRACKS, trackDayCount } from "@/lib/careerRoadmaps";
import { ArrowRight, Brain, Compass } from "lucide-react";

export default function Careers() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("career_progress")
        .select("track")
        .eq("user_id", user.id);
      const next: Record<string, number> = {};
      (data ?? []).forEach((r: { track: string }) => {
        next[r.track] = (next[r.track] ?? 0) + 1;
      });
      setCounts(next);
    })();
  }, [user]);

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-5 h-5 text-primary" />
          <span className="label-mono">Career Tracks</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
          Choose your path
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Each track is a structured, day-by-day roadmap. Tick off a day as you finish it and your
          progress is saved. You can follow more than one track at a time.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* AI/ML links to the dedicated existing experience */}
        <Link
          to="/aiml-roadmap"
          className={`surface p-5 group ring-1 ring-accent/50 hover:ring-accent transition-all hover:-translate-y-0.5`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-3xl" aria-hidden>🤖</div>
            <span className="label-mono text-accent">Full experience</span>
          </div>
          <h2 className="font-display text-xl font-extrabold mt-3">AI / ML Engineering</h2>
          <p className="text-xs text-muted-foreground mt-1">
            24-week roadmap with AI lessons, quizzes, capstones and code review
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-sm font-semibold text-accent">
            Open track <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {CAREER_TRACKS.map((track) => {
          const total = trackDayCount(track);
          const done = counts[track.slug] ?? 0;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <Link
              key={track.slug}
              to={`/careers/${track.slug}`}
              className={`surface p-5 group ring-1 ${track.accent} hover:ring-2 transition-all hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-3xl" aria-hidden>{track.emoji}</div>
                <span className="label-mono">{total} days</span>
              </div>
              <h2 className="font-display text-xl font-extrabold mt-3">{track.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">{track.tagline}</p>
              <p className="text-xs text-foreground/70 mt-3 leading-relaxed">{track.blurb}</p>

              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{done} / {total} days</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="surface p-5 mt-6 flex items-start gap-3">
        <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tracks are guides, not rules. Skip what you already know, repeat what you don't, and use
          the AI Coach on any day you get stuck.
        </p>
      </div>
    </div>
  );
}
