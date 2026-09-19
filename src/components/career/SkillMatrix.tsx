import { careerData, SkillGroup } from "@/lib/careerData";
import { useLocalState } from "@/hooks/useLocalState";
import SectionHeading from "./SectionHeading";

export default function SkillMatrix() {
  const [groups, setGroups] = useLocalState<SkillGroup[]>("career:skills", careerData.skills);
  const [editing, setEditing] = useLocalState<boolean>("career:skills:edit", false);

  const setLevel = (category: string, name: string, level: number) =>
    setGroups((gs) =>
      gs.map((g) =>
        g.category !== category
          ? g
          : { ...g, skills: g.skills.map((s) => (s.name === name ? { ...s, level } : s)) },
      ),
    );

  return (
    <section id="career-skills" aria-labelledby="career-skills-title">
      <SectionHeading
        id="career-skills-title"
        eyebrow="04"
        title="Current Skill Matrix"
        hint="Self-assessment only — these are honest estimates, not expertise claims."
        action={
          <button
            onClick={() => setEditing((e) => !e)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary hover:text-primary"
          >
            {editing ? "Done" : "Edit levels"}
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.category} className="surface p-5">
            <div className="label-mono mb-4 text-primary">{group.category}</div>
            <div className="space-y-3.5">
              {group.skills.map((s) => (
                <div key={s.name}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-semibold">{s.name}</span>
                    <span className="font-mono text-muted-foreground">{s.level}%</span>
                  </div>
                  {editing ? (
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={s.level}
                      aria-label={`${s.name} self-assessed level`}
                      onChange={(e) => setLevel(group.category, s.name, Number(e.target.value))}
                      className="h-2 w-full cursor-pointer accent-[hsl(var(--primary))]"
                    />
                  ) : (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-3))]">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${s.level}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
