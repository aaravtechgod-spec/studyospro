import { careerData } from "@/lib/careerData";
import SectionHeading from "./SectionHeading";

export default function MissionSection() {
  return (
    <section id="career-mission" aria-labelledby="career-mission-title">
      <SectionHeading id="career-mission-title" eyebrow="02" title="The Mission" />

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {careerData.mission.map((m, i) => (
          <li key={m.key} className="surface relative p-5">
            <span className="label-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
            <div className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.label}</div>
            <div className="mt-1.5 text-sm font-semibold leading-snug">{m.value}</div>
          </li>
        ))}
      </ol>

      <blockquote className="surface-2 mt-5 border-l-2 border-l-primary p-6 text-base font-medium italic leading-relaxed sm:text-lg">
        “{careerData.missionStatement}”
      </blockquote>
    </section>
  );
}
