# Roadmap

## Completed
6. **PWA installability** — manifest-only home-screen setup, StudyOS icons, and browser metadata verified; publish required for the live site.
7. **Audience growth research** — reviewed 30-day analytics, live entry flow, SEO scan, and relevant student-study resources; recommendations saved for owner review.

## In progress
8. **StudyOS clean glass redesign** — refine shared navigation and Dashboard with the approved dark glass direction; preserve existing study workflows. Completed.
9. **StudyOS Liquid Glass redesign** — apply the uploaded luminous glass direction across existing screens and preserve a persistent switch back to Current UI.
0. **Timer + stopwatch analytics accuracy** — record exact elapsed seconds and make saved sessions appear in Analytics. Completed.
1. **Terms & Conditions page** — `/terms`, linked from Auth + Settings, sign-up agreement checkbox.
2. **Career Tracks hub** — `/careers` with AI/ML, Software Engineering, Cybersecurity, Cloud, UI/UX roadmaps.
3. **Upload Notes / PDF → AI Flashcards** — customizer modal (count, difficulty, topic, source) + `flashcards-generate` edge function.
4. **XP System overhaul** — streak multipliers, daily quests, level titles, XP breakdown card.

## Queued
6. **Audience growth research** — review StudyOS pages, traffic, search visibility, and audience needs; recommend the strongest first growth action based on evidence.
5. **AI/ML Career Command Center** (`/career-command`) — personal long-term career OS for Aarav (Class 9 → B.Tech CSE → AI/ML Engineer).
   Sections: Hero, Mission, Long-term Roadmap timeline (2026→2034+), Skill Matrix, Project Lab,
   Learning Tracker, AI/ML Learning Tree, Achievements (honest empty state), Research/Experiments,
   GitHub panel (placeholders, API-ready), Career Scoreboard, Next Milestones checklist,
   Career Principles, Resume Preview, Future Vision.
   Components: CareerHero, RoadmapTimeline, SkillMatrix, ProjectLab, LearningTracker, AIMLTree,
   AchievementWall, ResearchLab, GithubPanel, CareerScoreboard, MilestoneTracker, ResumePreview.
   Data in `src/lib/careerData.ts`; editable trackers persisted to localStorage.
   Constraints: no fabricated achievements, stats, links, or credentials. Dark premium UI,
   subtle glassmorphism, responsive (horizontal timelines collapse to vertical on mobile).
