import { ArrowRight, Target } from "lucide-react";
import { careerData } from "@/lib/careerData";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function CareerHero() {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-[hsl(var(--surface))] px-6 py-12 sm:px-10 sm:py-16"
      aria-labelledby="career-hero-title"
    >
      {/* subtle grid + glow, purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 30% 0%, black, transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-primary/15 blur-[110px]"
      />

      <div className="relative grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <div className="label-mono mb-4 flex items-center gap-2 text-primary">
            <Target className="h-3.5 w-3.5" /> Career Command Center
          </div>
          <h1 id="career-hero-title" className="text-3xl font-black leading-tight sm:text-5xl">
            Building My Way to <span className="text-primary">AI/ML Engineering</span>
          </h1>
          <p className="mt-4 text-base font-medium text-muted-foreground sm:text-lg">
            Class 9 → Computer Science → Artificial Intelligence &amp; Machine Learning
          </p>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Starting early, building consistently, and turning curiosity into real engineering skills.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => scrollTo("career-roadmap")}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-glow"
            >
              View Roadmap <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollTo("career-projects")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-bold transition-colors hover:border-primary hover:text-primary"
            >
              View Projects
            </button>
          </div>
        </div>

        <dl className="surface-2 grid gap-5 p-6 backdrop-blur">
          <div>
            <dt className="label-mono text-muted-foreground">Current stage</dt>
            <dd className="mt-1 text-xl font-bold">{careerData.currentStage}</dd>
          </div>
          <div className="border-t border-border pt-4">
            <dt className="label-mono text-muted-foreground">Target</dt>
            <dd className="mt-1 text-xl font-bold text-primary">{careerData.target}</dd>
          </div>
          <div className="border-t border-border pt-4">
            <dt className="label-mono text-muted-foreground">Next milestone</dt>
            <dd className="mt-1 text-sm font-medium leading-relaxed">{careerData.nextMilestone}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
