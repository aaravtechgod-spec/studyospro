import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, BookOpenCheck, CalendarCheck2, Check, Clock3,
  Flame, Layers, LockKeyhole, Pause, Play, RotateCcw, Sparkles, Timer,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUiMode } from "@/hooks/useUiMode";
import Dashboard from "@/pages/Dashboard";

export type HomeView = "loading" | "dashboard" | "landing";

export function resolveHomeView(loading: boolean, authenticated: boolean): HomeView {
  if (loading) return "loading";
  return authenticated ? "dashboard" : "landing";
}

export function PublicHome() {
  const { user, loading } = useAuth();
  useUiMode();
  const view = resolveHomeView(loading, Boolean(user));

  if (view === "loading") {
    return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">Loading StudyOS…</div>;
  }
  return view === "dashboard" ? <Dashboard /> : <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="StudyOS home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><BookOpenCheck className="h-5 w-5" /></span>
          <span className="font-display text-xl font-extrabold">Study<span className="text-primary">OS</span></span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Public navigation">
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/auth">Sign in</Link></Button>
          <Button asChild className="rounded-full px-5"><Link to="/auth?mode=signup">Get started <ArrowRight className="h-4 w-4" /></Link></Button>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 md:grid-cols-[0.95fr_1.05fr] md:pb-24 md:pt-16">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Your study day, thoughtfully organized
            </div>
            <h1 className="max-w-xl font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl md:text-6xl">
              StudyOS<span className="text-primary">.</span><br />Make every study session count.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              Bring your tasks, notes, flashcards, focus time, and learning goals together in one calm workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-6">
                <Link to="/auth?mode=signup">Create your free account <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6">
                <Link to="/demo">Explore as a guest <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" />Try the preview with sample data—no account needed.</p>
          </div>

          <DashboardPreview />
        </section>

        <section className="border-y border-border/70 bg-surface/35">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
            <div className="mb-8 max-w-2xl">
              <p className="label-mono">A better study rhythm</p>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Everything you need to keep moving.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Feature icon={CalendarCheck2} title="Plan your work" detail="Keep homework, exams, and your schedule in view." />
              <Feature icon={Timer} title="Focus with intention" detail="Set a pace, start a session, and build a steady habit." />
              <Feature icon={Layers} title="Practice actively" detail="Turn learning material into flashcards and review." />
              <Feature icon={TrendingUp} title="See your progress" detail="Notice your focus time, streaks, and study momentum." />
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-5 py-12 sm:px-8 md:flex-row md:items-center md:py-16">
          <div>
            <h2 className="font-display text-2xl font-bold">Take a look around first.</h2>
            <p className="mt-2 text-sm text-muted-foreground">Try sample tasks, flip a flashcard, and start a short focus timer.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/demo">Open guest preview <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </section>
      </main>
      <footer className="border-t border-border/70 px-5 py-6 text-center text-xs text-muted-foreground">
        <span>StudyOS · A clearer way to study</span><span className="mx-2">·</span><Link to="/terms" className="underline-offset-4 hover:underline">Terms &amp; Conditions</Link>
      </footer>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-5 -z-10 rounded-[36px] bg-primary/10 blur-3xl" />
      <div className="surface overflow-hidden rounded-[24px] p-3 sm:p-4">
        <div className="flex items-center justify-between border-b border-border/70 px-2 pb-3">
          <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground"><BookOpenCheck className="h-4 w-4" /></span><span className="text-sm font-bold">StudyOS</span></div>
          <span className="rounded-full border border-border px-3 py-1 text-[10px] text-muted-foreground">Dashboard preview</span>
        </div>
        <div className="p-2 pt-4 sm:p-4">
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-xs text-muted-foreground">MONDAY · STUDY PLAN</p><h2 className="mt-1 font-display text-2xl font-bold">Make it a good one.</h2></div>
            <div className="hidden rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary sm:block">Level 8 · 740 XP</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <PreviewStat icon={Flame} label="Streak" value="6 days" />
            <PreviewStat icon={Clock3} label="Focus" value="45 min" />
            <PreviewStat icon={Layers} label="To review" value="12 cards" />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-border/70 bg-surface/60 p-3 sm:p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold">Today’s plan</p><CalendarCheck2 className="h-4 w-4 text-primary" /></div>
              <div className="mt-3 space-y-2.5">
                <PreviewTask title="Review photosynthesis" time="Biology · 20 min" done />
                <PreviewTask title="Practice algebra" time="Math · 3 questions" />
                <PreviewTask title="Read chapter notes" time="History · 15 min" />
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-surface/60 p-3 sm:p-4">
              <div><div className="flex items-center justify-between"><p className="text-sm font-semibold">Focus this week</p><TrendingUp className="h-4 w-4 text-primary" /></div>
                <div className="mt-5 flex h-20 items-end justify-between gap-1.5" aria-label="Sample weekly focus chart">
                  {[34, 55, 42, 75, 48, 88, 62].map((height, index) => <div key={index} className={`w-full rounded-t-lg ${index === 5 ? "bg-primary" : "bg-primary/30"}`} style={{ height: `${height}%` }} />)}
                </div><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 p-2.5 text-xs"><Sparkles className="h-4 w-4 shrink-0 text-primary" /><span>Ready for a focused 25-minute session?</span></div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" /> Sample dashboard · Your real workspace starts when you sign in</div>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return <div className="rounded-2xl border border-border/70 bg-surface/55 p-2.5 sm:p-3"><Icon className="h-4 w-4 text-primary" /><p className="mt-2 text-[10px] text-muted-foreground">{label}</p><p className="mt-0.5 text-xs font-bold sm:text-sm">{value}</p></div>;
}

function PreviewTask({ title, time, done = false }: { title: string; time: string; done?: boolean }) {
  return <div className="flex items-center gap-2.5"><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${done ? "bg-primary text-primary-foreground" : "border border-border"}`}>{done && <Check className="h-3 w-3" />}</span><div className="min-w-0"><p className="truncate text-xs font-medium">{title}</p><p className="text-[10px] text-muted-foreground">{time}</p></div></div>;
}

function Feature({ icon: Icon, title, detail }: { icon: typeof Timer; title: string; detail: string }) {
  return <div className="surface min-h-40 p-5"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{detail}</p></div>;
}

type DemoTab = "overview" | "tasks" | "flashcards" | "focus";
const demoTasks = ["Review cell structure", "Finish 5 algebra problems", "Read 3 pages of history"];
const demoCards = [
  { question: "What is the powerhouse of the cell?", answer: "The mitochondrion produces most of the cell’s usable energy." },
  { question: "What is photosynthesis?", answer: "The process plants use to convert light energy into chemical energy." },
];

export function GuestDemo() {
  const [tab, setTab] = useState<DemoTab>("overview");
  const [completed, setCompleted] = useState<number[]>([0]);
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [seconds, setSeconds] = useState(5 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const toggleTask = (index: number) => setCompleted((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index]);
  const nextCard = () => { setCardIndex((index) => (index + 1) % demoCards.length); setShowAnswer(false); };
  const tabs: { id: DemoTab; label: string }[] = [
    { id: "overview", label: "Overview" }, { id: "tasks", label: "Tasks" }, { id: "flashcards", label: "Flashcards" }, { id: "focus", label: "Focus timer" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><BookOpenCheck className="h-4 w-4" /></span>StudyOS<span className="text-primary">.</span></Link>
          <div className="flex items-center gap-2"><span className="hidden rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">Guest preview · sample data</span><Button asChild size="sm" className="rounded-full"><Link to="/auth?mode=signup">Create account</Link></Button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="label-mono">Interactive preview</p><h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Take StudyOS for a spin.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Try a few sample workflows. Changes stay on this page and disappear when you leave.</p></div>
          <Button asChild variant="outline" className="w-fit rounded-full"><Link to="/auth">Already have an account? Sign in</Link></Button>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Guest preview sections">
            {tabs.map((item) => <Button key={item.id} type="button" variant={tab === item.id ? "default" : "ghost"} onClick={() => setTab(item.id)} className="shrink-0 justify-start rounded-full lg:w-full">{item.label}</Button>)}
            <div className="hidden rounded-2xl border border-border/70 bg-surface/55 p-4 text-xs leading-5 text-muted-foreground lg:block"><LockKeyhole className="mb-2 h-4 w-4 text-primary" />This preview uses sample content only. Your account and study data stay private.</div>
          </nav>

          <section className="surface min-h-[430px] p-4 sm:p-6" aria-live="polite">
            {tab === "overview" && <DemoOverview completed={completed} onToggleTask={toggleTask} onOpen={setTab} />}
            {tab === "tasks" && <DemoTasks completed={completed} onToggleTask={toggleTask} />}
            {tab === "flashcards" && <DemoFlashcards card={demoCards[cardIndex]} index={cardIndex} showAnswer={showAnswer} onFlip={() => setShowAnswer((value) => !value)} onNext={nextCard} />}
            {tab === "focus" && <DemoFocus seconds={seconds} running={running} onToggle={() => seconds > 0 && setRunning((value) => !value)} onReset={() => { setRunning(false); setSeconds(5 * 60); }} />}
          </section>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:flex-row sm:items-center sm:p-6">
          <div><p className="font-semibold">Ready for your own study space?</p><p className="mt-1 text-sm text-muted-foreground">Create an account to save your notes, plans, and progress.</p></div>
          <Button asChild className="shrink-0 rounded-full"><Link to="/auth?mode=signup">Get started <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </main>
    </div>
  );
}

function DemoOverview({ completed, onToggleTask, onOpen }: { completed: number[]; onToggleTask: (index: number) => void; onOpen: (tab: DemoTab) => void }) {
  return <>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted-foreground">MONDAY · SAMPLE WORKSPACE</p><h2 className="mt-1 font-display text-2xl font-bold">Welcome, Student</h2></div><span className="rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">Level 3 · 180 XP</span></div>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><DemoMetric icon={Flame} label="Streak" value="3 days" /><DemoMetric icon={Clock3} label="Focus today" value="25 min" /><DemoMetric icon={Layers} label="Due cards" value="8" /><DemoMetric icon={CalendarCheck2} label="Upcoming" value="2" /></div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border/70 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Today’s tasks</h3><button type="button" onClick={() => onOpen("tasks")} className="text-xs text-primary">Open tasks</button></div>{demoTasks.map((task, index) => <label key={task} className="flex cursor-pointer items-center gap-3 border-t border-border/60 py-3 first:border-0"><input type="checkbox" checked={completed.includes(index)} onChange={() => onToggleTask(index)} className="h-4 w-4 accent-primary" /><span className={`text-sm ${completed.includes(index) ? "text-muted-foreground line-through" : ""}`}>{task}</span></label>)}</div>
      <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-surface/45 p-4"><div><h3 className="font-semibold">Quick practice</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Two sample Biology cards are ready. Flip one to reveal its answer.</p></div><div className="mt-4 flex flex-wrap gap-2"><Button type="button" onClick={() => onOpen("flashcards")} className="rounded-full"><Layers className="h-4 w-4" /> Try flashcards</Button><Button type="button" variant="outline" onClick={() => onOpen("focus")} className="rounded-full"><Timer className="h-4 w-4" /> Try focus timer</Button></div></div>
    </div>
  </>;
}

function DemoTasks({ completed, onToggleTask }: { completed: number[]; onToggleTask: (index: number) => void }) {
  return <><p className="label-mono">Sample task list</p><h2 className="mt-2 font-display text-2xl font-bold">A little progress adds up.</h2><p className="mt-2 text-sm text-muted-foreground">Check or uncheck these examples. They are not saved.</p><div className="mt-6 divide-y divide-border/70">{demoTasks.map((task, index) => <label key={task} className="flex cursor-pointer items-center gap-4 py-4"><input type="checkbox" checked={completed.includes(index)} onChange={() => onToggleTask(index)} className="h-5 w-5 accent-primary" /><span className="min-w-0 flex-1"><span className={`block text-sm font-medium ${completed.includes(index) ? "text-muted-foreground line-through" : ""}`}>{task}</span><span className="mt-1 block text-xs text-muted-foreground">{index === 0 ? "Biology · Today" : index === 1 ? "Mathematics · Tomorrow" : "History · Friday"}</span></span><span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">{index === 0 ? "15 min" : index === 1 ? "20 min" : "10 min"}</span></label>)}</div></>;
}

function DemoFlashcards({ card, index, showAnswer, onFlip, onNext }: { card: { question: string; answer: string }; index: number; showAnswer: boolean; onFlip: () => void; onNext: () => void }) {
  return <><p className="label-mono">Sample Biology deck · Card {index + 1} of {demoCards.length}</p><h2 className="mt-2 font-display text-2xl font-bold">Practice active recall.</h2><button type="button" onClick={onFlip} className="mt-6 flex min-h-[210px] w-full flex-col items-center justify-center rounded-2xl border border-border/70 bg-surface/60 p-6 text-center transition-colors hover:border-primary/50"><span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary"><Layers className="h-5 w-5" /></span><span className="max-w-xl text-lg font-semibold">{showAnswer ? card.answer : card.question}</span><span className="mt-5 text-xs text-muted-foreground">{showAnswer ? "Answer · click to see question" : "Question · click to reveal answer"}</span></button><div className="mt-4 flex items-center justify-between"><Button type="button" variant="outline" onClick={onFlip} className="rounded-full">{showAnswer ? "Show question" : "Reveal answer"}</Button><Button type="button" onClick={onNext} className="rounded-full">Next card <ArrowRight className="h-4 w-4" /></Button></div></>;
}

function DemoFocus({ seconds, running, onToggle, onReset }: { seconds: number; running: boolean; onToggle: () => void; onReset: () => void }) {
  const time = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  return <div className="flex min-h-[380px] flex-col items-center justify-center text-center"><span className="label-mono">Sample focus session · 5 minutes</span><div className="mt-6 grid h-48 w-48 place-items-center rounded-full border-[10px] border-primary/25 bg-primary/10"><span className="font-display text-5xl font-extrabold tabular-nums">{time}</span></div><p className="mt-5 text-sm text-muted-foreground">{seconds === 0 ? "Preview complete. Nice focus." : running ? "You’re in a sample focus session." : "Start the timer whenever you’re ready."}</p><div className="mt-5 flex gap-2"><Button type="button" onClick={onToggle} disabled={seconds === 0} className="min-w-28 rounded-full">{running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{running ? "Pause" : "Start"}</Button><Button type="button" onClick={onReset} variant="outline" className="rounded-full"><RotateCcw className="h-4 w-4" /> Reset</Button></div><p className="mt-4 text-xs text-muted-foreground">This timer is temporary and does not record a study session.</p></div>;
}

function DemoMetric({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return <div className="rounded-2xl border border-border/70 bg-surface/45 p-3"><Icon className="h-4 w-4 text-primary" /><p className="mt-2 text-[11px] text-muted-foreground">{label}</p><p className="mt-0.5 font-display text-lg font-bold">{value}</p></div>;
}