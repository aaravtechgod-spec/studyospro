import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, xpForLevel } from "@/hooks/useProfile";
import { PageHeader, StatCard } from "@/components/ui-kit";
import { Trophy, Flame, Star, Zap, BookOpen, Target, Award, Crown } from "lucide-react";

const BADGES = [
  { id: "first_task", icon: Star, label: "First Step", desc: "Complete your first task", check: (s: any) => s.tasks >= 1 },
  { id: "ten_tasks", icon: Target, label: "Task Slayer", desc: "Complete 10 tasks", check: (s: any) => s.tasks >= 10 },
  { id: "fifty_tasks", icon: Trophy, label: "Productivity Pro", desc: "Complete 50 tasks", check: (s: any) => s.tasks >= 50 },
  { id: "first_focus", icon: Zap, label: "Deep Diver", desc: "Complete a focus session", check: (s: any) => s.sessions >= 1 },
  { id: "ten_hours", icon: BookOpen, label: "Scholar", desc: "10 hours of focus", check: (s: any) => s.minutes >= 600 },
  { id: "streak_7", icon: Flame, label: "On Fire", desc: "7-day streak", check: (s: any) => s.streak >= 7 },
  { id: "streak_30", icon: Crown, label: "Unstoppable", desc: "30-day streak", check: (s: any) => s.streak >= 30 },
  { id: "level_5", icon: Award, label: "Level 5", desc: "Reach level 5", check: (s: any) => s.level >= 5 },
  { id: "level_10", icon: Crown, label: "Level 10", desc: "Reach level 10", check: (s: any) => s.level >= 10 },
];

export default function Gamification() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: stats } = useQuery({
    queryKey: ["gam-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [tasksRes, focusRes] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "done"),
        supabase.from("focus_sessions").select("duration_minutes").eq("user_id", user!.id),
      ]);
      const minutes = (focusRes.data ?? []).reduce((s, r) => s + r.duration_minutes, 0);
      return {
        tasks: tasksRes.count ?? 0,
        sessions: focusRes.data?.length ?? 0,
        minutes,
        streak: profile?.streak_days ?? 0,
        level: profile?.level ?? 1,
      };
    },
  });

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpThis = xp - xpForLevel(level - 1);
  const xpNeed = xpForLevel(level) - xpForLevel(level - 1);
  const pct = Math.min(100, Math.round((xpThis / xpNeed) * 100));

  const earnedCount = stats ? BADGES.filter(b => b.check(stats)).length : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader title="XP & Badges" subtitle="Your learning achievements" />

      <div className="surface p-6 mb-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-extrabold text-4xl mx-auto animate-pulse-glow">
              {level}
            </div>
            <div className="label-mono mt-2">Level</div>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-3xl text-xp">{xp}</span>
              <span className="label-mono">total XP</span>
            </div>
            <div className="h-3 bg-surface-3 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-xp transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-mono">
              {xpThis} / {xpNeed} XP to level {level + 1}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Streak" value={`${stats?.streak ?? 0}d`} accent="warning" />
        <StatCard label="Tasks done" value={stats?.tasks ?? 0} accent="success" />
        <StatCard label="Focus min" value={stats?.minutes ?? 0} accent="primary" />
        <StatCard label="Badges" value={`${earnedCount}/${BADGES.length}`} accent="xp" />
      </div>

      <h3 className="font-display font-bold text-xl mb-3">Badges</h3>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {BADGES.map(b => {
          const earned = stats ? b.check(stats) : false;
          const Icon = b.icon;
          return (
            <div key={b.id} className={`surface p-4 flex items-center gap-3 transition-all ${earned ? "border-primary glow-accent" : "opacity-50"}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${earned ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-sm">{b.label}</div>
                <div className="text-xs text-muted-foreground">{b.desc}</div>
              </div>
              {earned && <span className="text-[10px] font-bold text-primary">EARNED</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
