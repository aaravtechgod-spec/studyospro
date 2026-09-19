import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { careerData } from "@/lib/careerData";
import SectionHeading from "./SectionHeading";

export default function RoadmapTimeline() {
  const [open, setOpen] = useState<string | null>(careerData.roadmap[0]?.id ?? null);

  return (
    <section id="career-roadmap" aria-labelledby="career-roadmap-title">
      <SectionHeading
        id="career-roadmap-title"
        eyebrow="03"
        title="Long-Term Roadmap"
        hint="2026 to 2034 and beyond. Tap a stage to see what it covers."
      />

      <ol className="relative space-y-3 border-l border-border pl-5 sm:pl-7">
        {careerData.roadmap.map((phase) => {
          const expanded = open === phase.id;
          return (
            <li key={phase.id} className="relative">
              <span
                aria-hidden
                className={`absolute -left-[26px] top-6 h-2.5 w-2.5 rounded-full ring-4 ring-background sm:-left-[34px] ${
                  expanded ? "bg-primary" : "bg-border"
                }`}
              />
              <div className="surface overflow-hidden">
                <button
                  onClick={() => setOpen(expanded ? null : phase.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-[hsl(var(--surface-2))]"
                >
                  <div className="min-w-0">
                    <div className="label-mono text-primary">{phase.years}</div>
                    <div className="mt-1 truncate text-base font-bold">{phase.title}</div>
                    <div className="text-xs text-muted-foreground">{phase.stage}</div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded && (
                  <div className="animate-fade-in border-t border-border p-5 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {phase.focus.map((f) => (
                        <span
                          key={f}
                          className="rounded-full border border-border bg-[hsl(var(--surface-2))] px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
