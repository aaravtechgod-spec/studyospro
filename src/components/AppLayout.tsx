import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, xpForLevel } from "@/hooks/useProfile";
import { useEffect } from "react";
import {
  LayoutGrid, Calendar, ListChecks, FileText, Timer, CalendarDays,
  GraduationCap, Layers, Bot, Trophy, BarChart3, Settings, LogOut, Menu, Sparkles, Command as CommandIcon,
  Brain, Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoachChatProvider, useCoachChat } from "@/hooks/useCoachChat";
import CoachPanel from "@/components/CoachPanel";
import CommandPalette from "@/components/CommandPalette";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/useTheme";
import { useTimeTracker } from "@/hooks/useTimeTracker";

// Routes where the floating "Ask Coach" button is shown.
const COACH_ROUTES = ["/notes", "/tasks", "/exams", "/timer"];

const navItems = [
  { to: "/", icon: LayoutGrid, label: "Dashboard", end: true, section: "Home" },
  { to: "/exams", icon: Calendar, label: "Exams", section: "Study" },
  { to: "/tasks", icon: ListChecks, label: "Homework", section: "Study" },
  { to: "/notes", icon: FileText, label: "Notes", section: "Study" },
  { to: "/timer", icon: Timer, label: "Study Timer", section: "Study" },
  { to: "/schedule", icon: CalendarDays, label: "Schedule", section: "Study" },
  { to: "/subjects", icon: GraduationCap, label: "Subjects", section: "Study" },
  { to: "/flashcards", icon: Layers, label: "Flashcards", section: "Study" },
  { to: "/coach", icon: Bot, label: "AI Coach", section: "Learn" },
  { to: "/aiml-roadmap", icon: Brain, label: "AI/ML Roadmap", badge: "NEW", section: "Learn" },
  { to: "/aiml-capstones", icon: Trophy, label: "Capstones", section: "Learn" },
  { to: "/careers", icon: Compass, label: "Career Tracks", badge: "NEW", section: "Learn" },
  { to: "/gamification", icon: Trophy, label: "XP & Badges", section: "Progress" },
  { to: "/analytics", icon: BarChart3, label: "Analytics", section: "Progress" },
  { to: "/settings", icon: Settings, label: "Settings", section: "Progress" },
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
      <div className="px-5 pb-5 border-b border-border/70 mb-3">
        <h1 className="font-display text-xl font-extrabold">
          Study<span className="text-primary">OS</span>
          <span className="ml-2 inline-block bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded align-middle">PRO</span>
        </h1>
        <p className="text-[10px] text-muted-foreground mt-1">Your space to learn</p>
      </div>

      <div className="mx-3 mb-3 px-3 py-3 bg-surface-2/70 rounded-lg border border-border/70">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Level {level}</span>
          <span className="text-xp font-medium">{xp} XP</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full mt-1.5 overflow-hidden">
          <div className="h-full bg-xp transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
          <span>{xpThis}/{xpNeed}</span>
          <span>🔥 {profile?.streak_days ?? 0}d</span>
        </div>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto" aria-label="Main navigation">
        {["Home", "Study", "Learn", "Progress"].map((section) => {
          const sectionItems = navItems.filter((item) => item.section === section);
          return (
            <div key={section} className="mb-4">
              {section !== "Home" && <p className="px-2 mb-1.5 text-[10px] font-semibold text-muted-foreground/75">{section}</p>}
              <div className="space-y-0.5">
                {sectionItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold ring-1 ring-inset ring-primary/15"
                          : "text-foreground/75 hover:bg-surface-2/80 hover:text-foreground"
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 opacity-80" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && <span className="text-[9px] font-semibold text-primary">{item.badge}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-3 pt-3 border-t border-border/70 mt-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm">
            {(profile?.display_name ?? user?.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{profile?.display_name ?? "Student"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full justify-start gap-2 px-3 py-2 h-9 text-xs text-muted-foreground"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </Button>
      </div>
    </div>
  );
}

function AppLayoutInner() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, openSidebar, setContext } = useCoachChat();
  useTimeTracker(!!user && !loading);
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
      <aside className="hidden lg:flex flex-col w-[248px] shrink-0 bg-surface/75 border-r border-border/70 backdrop-blur-2xl overflow-y-auto">
        <SidebarBody />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-background/85 backdrop-blur-xl border-b border-border/70 flex items-center px-3 gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] bg-surface border-border">
            <MobileSidebarBody />
          </SheetContent>
        </Sheet>
        <div className="font-display font-extrabold text-base">
          Study<span className="text-primary">OS</span>
        </div>
        <Button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          variant="ghost"
          size="icon"
          className="ml-auto h-9 w-9"
          aria-label="Open command palette"
        >
          <CommandIcon className="w-4 h-4" />
        </Button>
      </header>

      {/* Main */}
      <main className="flex-1 min-w-0 p-4 sm:p-5 md:p-8 max-w-[1500px] mx-auto w-full pt-[72px] lg:pt-8">
        <Outlet />
      </main>

      {/* Floating Coach launcher */}
      {showCoachLauncher && !sidebarOpen && (
        <Button
          onClick={openSidebar}
          className="fixed bottom-5 right-5 z-40 h-11 rounded-full shadow-lg shadow-primary/15 px-4 flex items-center gap-2 font-semibold text-sm"
          aria-label="Open AI Coach"
        >
          <Sparkles className="w-4 h-4" />
          Ask Coach
        </Button>
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
