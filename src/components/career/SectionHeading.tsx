import { ReactNode } from "react";

export default function SectionHeading({
  id,
  eyebrow,
  title,
  hint,
  action,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="label-mono mb-1 text-primary">{eyebrow}</div>}
        <h2 id={id} className="text-xl font-black sm:text-2xl">
          {title}
        </h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
