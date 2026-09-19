import { useState } from "react";
import { ExternalLink, Github, X } from "lucide-react";
import { careerData, Project } from "@/lib/careerData";
import SectionHeading from "./SectionHeading";

const statusStyle: Record<Project["status"], string> = {
  Built: "border-primary/40 bg-primary/10 text-primary",
  "In progress": "border-border bg-[hsl(var(--surface-2))] text-muted-foreground",
  Exploring: "border-border bg-[hsl(var(--surface-2))] text-muted-foreground",
};

export default function ProjectLab() {
  const [active, setActive] = useState<Project | null>(null);

  return (
    <section id="career-projects" aria-labelledby="career-projects-title">
      <SectionHeading
        id="career-projects-title"
        eyebrow="05"
        title="Project Lab"
        hint="Real things built, with real technologies. Links go live once each repo is published."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {careerData.projects.map((p) => (
          <article key={p.id} className="surface flex flex-col p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-base font-bold leading-snug">{p.name}</h3>
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyle[p.status]}`}>
                {p.status}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <span key={t} className="rounded border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              <a
                href={p.github ?? undefined}
                aria-disabled={!p.github}
                title={p.github ? "Open repository" : "Repository link not added yet"}
                className={`inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold ${
                  p.github ? "hover:border-primary hover:text-primary" : "cursor-not-allowed opacity-40"
                }`}
                onClick={(e) => !p.github && e.preventDefault()}
              >
                <Github className="h-3.5 w-3.5" /> GitHub
              </a>
              <a
                href={p.demo ?? undefined}
                aria-disabled={!p.demo}
                title={p.demo ? "Open demo" : "Demo link not added yet"}
                className={`inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold ${
                  p.demo ? "hover:border-primary hover:text-primary" : "cursor-not-allowed opacity-40"
                }`}
                onClick={(e) => !p.demo && e.preventDefault()}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Demo
              </a>
              <button
                onClick={() => setActive(p)}
                className="ml-auto rounded-md px-3 py-1.5 text-xs font-bold text-primary hover:underline"
              >
                View Details
              </button>
            </div>
          </article>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${active.name} details`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setActive(null)}
        >
          <div className="surface animate-fade-in max-h-[85vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <h3 className="text-lg font-black">{active.name}</h3>
              <button onClick={() => setActive(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{active.description}</p>
            <div className="label-mono mt-5 mb-2 text-primary">What it does</div>
            <ul className="space-y-1.5 text-sm">
              {active.details.map((d) => (
                <li key={d} className="flex gap-2 text-muted-foreground">
                  <span className="text-primary">·</span> {d}
                </li>
              ))}
            </ul>
            <div className="label-mono mt-5 mb-2 text-primary">Stack</div>
            <div className="flex flex-wrap gap-1.5">
              {active.tech.map((t) => (
                <span key={t} className="rounded border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
