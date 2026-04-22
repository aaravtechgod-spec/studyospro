import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, xpForLevel } from "@/hooks/useProfile";
import { useEffect } from "react";
import {
  LayoutGrid, Calendar, ListChecks, FileText, Timer, CalendarDays,
  GraduationCap, Layers, Bot, Trophy, BarChart3, Settings, LogOut, Menu, Sparkles, Command as CommandIcon,
} from "lucide-react";
import { CoachChatProvider, useCoachChat } from "@/hooks/useCoachChat";
import CoachPanel from "@/components/CoachPanel";
import CommandPalette from "@/components/CommandPalette";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/useTheme";

// Routes where the floating "Ask Coach" button is shown.
const COACH_ROUTES = ["/notes", "/tasks", "/exams", "/timer"];

const navItems = [
  { to: "/", icon: LayoutGrid, label: "Dashboard", end: true },
  { to: "/exams", icon: Calendar, label: "Exams" },
  { to: "/tasks", icon: ListChecks, label: "Homework" },
  { to: "/notes", icon: FileText, label: "Notes" },
  { to: "/timer", icon: Timer, label: "Study Timer" },
  { to: "/schedule", icon: CalendarDays, label: "Schedule" },
  { to: "/subjects", icon: GraduationCap, label: "Subjects" },
  { to: "/flashcards", icon: Layers, label: "Flashcards" },
  { to: "/coach", icon: Bot, label: "AI Coach" },
  { to: "/gamification", icon: Trophy, label: "XP & Badges", badge: "NEW" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout() {
  return (
    <CoachChatProvider>
      <AppLayoutInner />
    </CoachChatProvider>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpThis = xp - xpForLevel(level - 1);
  const xpNeed = xpForLevel(level) - xpForLevel(level - 1);
  const pct = Math.min(100, Math.round((xpThis / xpNeed) * 100));

  return (
    <div className="flex flex-col h-full py-5">
      <div className="px-5 pb-3 border-b border-border mb-2">
        <h1 className="font-display text-xl font-extrabold tracking-tight">
          Study<span className="text-primary">OS</span>
          <span className="ml-2 inline-block bg-primary text-primary-foreground text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-widest align-middle">PRO</span>
        </h1>
        <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest">COMMAND CENTER</p>
      </div>

      <div className="mx-3 mt-1 mb-2 px-2.5 py-2 bg-surface-2 rounded-md border border-border">
        <div className="flex items-center justify-between text-[10px] tracking-widest text-muted-foreground uppercase">
          <span>LVL {level}</span>
          <span className="text-xp">{xp} XP</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full mt-1.5 overflow-hidden">
          <div className="h-full bg-xp transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
          <span>{xpThis}/{xpNeed}</span>
          <span>🔥 {profile?.streak_days ?? 0}d</span>
        </div>
      </div>

      <nav className="flex-1 px-2 mt-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground/80 hover:bg-surface-2 hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="text-[8px] font-extrabold bg-primary text-primary-foreground px-1.5 py-0.5 rounded tracking-widest">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pt-3 border-t border-border mt-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm">
            {(profile?.display_name ?? user?.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{profile?.display_name ?? "Student"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

function AppLayoutInner() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, openSidebar, setContext } = useCoachChat();
  useTheme(); // ensures the html.light class reflects profile.theme

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  // Tell the coach which page the user is on, so the conversation has light context.
  useEffect(() => {
    const map: Record<string, string> = {
      "/notes": "Notes", "/tasks": "Homework", "/exams": "Exams", "/timer": "Study Timer",
    };
    setContext(map[location.pathname] ?? null);
  }, [location.pathname, setContext]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="font-mono text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const showCoachLauncher = COACH_ROUTES.some(r => location.pathname === r || location.pathname.startsWith(r + "/"));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[230px] bg-surface border-r border-border overflow-y-auto">
        <SidebarBody />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-surface/95 backdrop-blur border-b border-border flex items-center px-3 gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-2 rounded-md hover:bg-surface-2" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] bg-surface border-border">
            <MobileSidebarBody />
          </SheetContent>
        </Sheet>
        <div className="font-display font-extrabold text-base">
          Study<span className="text-primary">OS</span>
        </div>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="ml-auto p-2 rounded-md hover:bg-surface-2"
          aria-label="Open command palette"
        >
          <CommandIcon className="w-4 h-4" />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 min-w-0 p-5 md:p-8 max-w-[1400px] mx-auto w-full pt-[72px] lg:pt-8">
        <Outlet />
      </main>

      {/* Floating Coach launcher */}
      {showCoachLauncher && !sidebarOpen && (
        <button
          onClick={openSidebar}
          className="fixed bottom-5 right-5 z-40 bg-primary text-primary-foreground rounded-full shadow-xl shadow-primary/30 px-4 py-3 flex items-center gap-2 font-semibold text-sm hover:bg-primary-glow transition-colors"
          aria-label="Open AI Coach"
        >
          <Sparkles className="w-4 h-4" />
          Ask Coach
        </button>
      )}

      <CoachPanel />
      <CommandPalette />
    </div>
  );
}

// Wrapper that closes the Sheet when a link is clicked. The Sheet's close
// behavior is handled by Radix when the children's NavLink triggers navigation,
// but we also force re-render via location change.
function MobileSidebarBody() {
  return <SidebarBody />;
}
