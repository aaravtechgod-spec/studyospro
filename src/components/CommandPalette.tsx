import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutGrid, ListChecks, FileText, Calendar, CalendarDays, Timer as TimerIcon,
  GraduationCap, Layers, Bot, Trophy, BarChart3, Settings as SettingsIcon,
  Plus, Sparkles, Sun, Moon,
} from "lucide-react";
import { useCoachChat } from "@/hooks/useCoachChat";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PAGES = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/exams", label: "Exams", icon: Calendar },
  { to: "/tasks", label: "Homework", icon: ListChecks },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/timer", label: "Study Timer", icon: TimerIcon },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/subjects", label: "Subjects", icon: GraduationCap },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/coach", label: "AI Coach", icon: Bot },
  { to: "/gamification", label: "XP & Badges", icon: Trophy },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleSidebar, openSidebar } = useCoachChat();
  const { theme, toggle: toggleTheme } = useTheme();
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (fn: () => void) => { setOpen(false); setTimeout(fn, 50); };

  const newNote = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("notes").insert({
      user_id: user.id, title: "Untitled note", content: "",
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["notes"] });
    navigate("/notes");
    toast.success("Note created");
  };

  const newTask = async () => {
    if (!user) return;
    const title = window.prompt("Task title?")?.trim();
    if (!title) return;
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id, title, priority: "medium",
    });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["dashboard-tasks"] });
    toast.success("Task added");
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {PAGES.map(p => (
            <CommandItem key={p.to} onSelect={() => run(() => navigate(p.to))}>
              <p.icon className="mr-2 h-4 w-4" /> {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Create">
          <CommandItem onSelect={() => run(newNote)}>
            <Plus className="mr-2 h-4 w-4" /> New note
          </CommandItem>
          <CommandItem onSelect={() => run(newTask)}>
            <Plus className="mr-2 h-4 w-4" /> New task
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(openSidebar)}>
            <Sparkles className="mr-2 h-4 w-4" /> Open AI Coach
          </CommandItem>
          <CommandItem onSelect={() => run(toggleSidebar)}>
            <Bot className="mr-2 h-4 w-4" /> Toggle Coach panel
          </CommandItem>
          <CommandItem onSelect={() => run(toggleTheme)}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Switch to {theme === "dark" ? "light" : "dark"} theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
