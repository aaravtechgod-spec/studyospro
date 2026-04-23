
# 25 Upgrades to Make the AI/ML Roadmap World-Class

Below is a prioritized roadmap (P0 = ship first, P1 = next, P2 = polish) of 25 features to evolve `/aiml-roadmap` from a static checklist into a true learning operating system.

## P0 — Foundation (turn it into a real learning system)

1. **Adaptive pacing engine** — Let the user pick a pace (Sprint 3h/day, Standard 2h, Chill 1h) and auto-recompute target date, weekly load, and "are you on track?" status. Persist in `aiml_settings`.
2. **Streaks, XP & level integration** — Award XP via existing `award_xp()` when a day is completed; surface a streak ring + freeze tokens (1/week) so a missed day doesn't kill momentum.
3. **Daily checklist of sub-tasks** — Each day expands into 3–6 concrete sub-steps (read X, build Y, quiz Z) stored in `aiml_subtasks`, individually checkable. This is the single biggest UX win.
4. **Project milestones (capstones)** — Insert 6 capstone projects between phases (e.g. Titanic, MNIST, Tweet sentiment, RAG bot, LoRA fine-tune, MLOps deploy) with rubric + GitHub link field.
5. **Skill graph / prerequisite map** — Replace flat list with a visual DAG (Phase → Skill → Day) so users see *why* today matters and what unlocks next.
6. **"Coach me on today" → full lesson plan** — Upgrade the current Coach call to return a structured plan (intro, theory, code walkthrough, exercise, quiz) rendered as an inline tabbed lesson, not just a chat reply.
7. **Auto-generated quizzes per day** — Button "Quiz me on Day N" creates 5 MCQ flashcards via Lovable AI and pushes them into the existing Flashcards deck tagged `aiml/dayN`.
8. **Spaced-repetition review queue** — Surface a "Today's reviews: 12 cards" widget that pulls due flashcards from past AI/ML days using SM-2 scheduling.

## P1 — Engagement & feedback loops

9. **Time-tracking integration with Timer page** — Start a Pomodoro from any day; logged minutes update an "actual vs estimated hours" stat per day & phase.
10. **Weekly review ritual** — Every Sunday show a modal: what you learned, hours, completion %, AI-generated reflection prompt, export to Notes.
11. **Calendar / Schedule sync** — Auto-create Schedule events for the next 7 days of targets; respect existing Tasks page so each day appears as a due task.
12. **Resource library per day** — Each day card carries 2–4 curated free resources (video, article, Colab) with "✓ watched" tracking, not just per-phase links.
13. **Code sandbox links** — One-click "Open in Colab / Kaggle / StackBlitz" pre-loaded with a starter notebook for that day's exercise.
14. **Progress export & shareable certificate** — Generate a PDF certificate + a public profile page (`/u/username/aiml`) showing phases conquered. Great for LinkedIn.
15. **Job-readiness tracker** — A right-rail panel scoring 8 hireable skills (Python, SQL, ML, DL, NLP, MLOps, System Design, Portfolio) 0–100 based on completed days + capstones.
16. **Interview prep mode** — After Phase 6, unlock a "Mock Interview" button that runs a voice/text mock with the Coach using real FAANG ML questions.

## P2 — World-class polish

17. **Personalized roadmap remix** — Onboarding quiz (background, goal: research vs applied vs MLOps vs GenAI) re-orders/skips phases. Save as `roadmap_variant`.
18. **Cohort / accountability buddy** — Optional pairing with another user on similar week; shared chat thread + weekly check-in.
19. **Leaderboard (opt-in)** — Anonymous global + friends leaderboard by XP/streak in the AI/ML track only.
20. **Achievements & badges** — 20+ unlockable badges (First Neural Net, RAG Builder, Kaggle Bronze, 30-Day Streak) with confetti animation.
21. **Voice-first daily standup** — Mic button: "What did you learn today?" → Whisper-style transcription → AI summarizes into a Note + auto-marks day done.
22. **Offline / PWA support** — Cache today's lesson + resources so users can study on the train.
23. **Dark/light themed roadmap visualization** — A horizontal scrollable Gantt-style timeline (24 weeks) with current-day playhead; printable poster export.
24. **Analytics dashboard** — Heatmap (GitHub-style), hours/week chart, phase velocity, projected completion date — all on a new `/aiml-roadmap/insights` sub-route.
25. **Notifications & habit nudges** — Daily reminder at user-chosen time (browser push + email via existing infra), smart nudge if streak about to break.

---

## Technical Plan (how we'd build the P0 batch first)

**New tables (one migration):**
- `aiml_settings` — user_id, pace, daily_target_minutes, start_date, freeze_tokens, notify_at
- `aiml_subtasks` — id, user_id, day_number, idx, title, done, kind (`read|build|quiz`)
- `aiml_capstones` — id, user_id, capstone_id, status, github_url, completed_at
- `aiml_resources_progress` — user_id, day_number, resource_url, watched_at
- `aiml_lessons_cache` — user_id, day_number, lesson_json, created_at (cache "Coach me on today" output)

All with RLS `user_id = auth.uid()` and composite index `(user_id, day_number)`.

**Edge functions:**
- `aiml-lesson` — POST { day } → returns structured lesson JSON (tabs: theory/code/exercise/quiz) using `openai/gpt-5-mini` via Lovable AI gateway, cached in `aiml_lessons_cache`.
- `aiml-quiz` — POST { day } → returns 5 MCQs via tool-calling, inserts into `flashcards` tagged `aiml/dayN`.
- `aiml-weekly-review` — POST { week } → reflection prompts + summary.

**Frontend changes:**
- Refactor `src/pages/AIMLRoadmap.tsx` into:
  - `RoadmapHeader` (stats + pace selector)
  - `TodayLessonCard` (tabbed lesson, sub-tasks, timer, quiz button)
  - `SkillGraph` (new component, lightweight SVG DAG)
  - `WeekTimeline` (existing week list + capstone slots)
  - `ReviewQueue` (due flashcards widget)
- New sub-route `/aiml-roadmap/insights` for analytics (heatmap via existing chart lib).
- New `src/lib/aimlCapstones.ts` and extend `aimlRoadmap.ts` with `subtasks` + `resources` per day.
- Hook into existing `award_xp('task_complete', dayUUID)` flow by treating each day as a synthetic task or extend `award_xp` with `aiml_day` event.

**Integrations reused:**
- Coach (`useCoachChat`) for lesson chat fallback.
- Timer page for time tracking.
- Flashcards table for spaced repetition.
- Tasks/Schedule for calendar sync.
- `award_xp` RPC for gamification.

**Suggested build order:**
1. Migration + `aiml_settings` + pace selector (#1)
2. Sub-tasks table + UI (#3)
3. XP/streak hookup (#2)
4. Lesson edge function + tabbed UI (#6)
5. Quiz generator + flashcard tagging (#7, #8)
6. Capstones (#4) + Skill graph (#5)
7. Then iterate into P1/P2 batches.

Tell me **"go"** to implement P0 (items 1–8) in one pass, or pick specific numbers and I'll scope just those.
