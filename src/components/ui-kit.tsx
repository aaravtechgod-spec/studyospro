import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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

export const EmptyState = ({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) => (
  <div className="surface p-12 text-center flex flex-col items-center">
    {icon && <div className="text-5xl mb-3 opacity-60 animate-fade-in">{icon}</div>}
    <div className="font-display font-bold text-lg">{title}</div>
    {hint && <div className="text-muted-foreground text-sm mt-1 max-w-sm">{hint}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/** Quick skeleton primitives — no extra deps. */
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-surface-2 rounded-md", className)} />
);

export const SkeletonRow = () => (
  <div className="surface p-4 flex items-center gap-3">
    <Skeleton className="w-6 h-6 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-2 w-1/3" />
    </div>
  </div>
);

export const SkeletonCard = ({ lines = 3 }: { lines?: number }) => (
  <div className="surface p-5 space-y-2">
    <Skeleton className="h-4 w-1/3" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className="h-3 w-full" />
    ))}
  </div>
);
