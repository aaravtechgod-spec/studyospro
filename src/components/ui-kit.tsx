import { ReactNode } from "react";

export const PageHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-5 border-b border-border">
    <div>
      <h1 className="display-xl">{title}</h1>
      {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const StatCard = ({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: string; accent?: "primary" | "xp" | "success" | "warning" | "info" }) => {
  const colorClass =
    accent === "primary" ? "text-primary"
    : accent === "xp" ? "text-xp"
    : accent === "success" ? "text-success"
    : accent === "warning" ? "text-warning"
    : accent === "info" ? "text-info"
    : "";
  return (
    <div className="surface p-5">
      <div className="label-mono">{label}</div>
      <div className={`font-display font-extrabold text-3xl mt-2 ${colorClass}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
};

export const EmptyState = ({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) => (
  <div className="surface p-12 text-center">
    {icon && <div className="text-4xl mb-3 opacity-50">{icon}</div>}
    <div className="font-display font-bold text-lg">{title}</div>
    {hint && <div className="text-muted-foreground text-sm mt-1">{hint}</div>}
  </div>
);
