# StudyOS clean glass redesign

## Scope
Redesign the shared signed-in navigation and Dashboard, using the previously chosen dark glass HUD direction while keeping the existing StudyOS features and data intact.

## Work
- Refine global dark surfaces, typography, borders, and subtle lighting with semantic tokens; preserve the existing lime accent and light theme.
- Replace the dense desktop sidebar with a compact glass navigation rail and keep all destinations available in a mobile menu.
- Rebuild the Dashboard hierarchy around a clear greeting, compact progress indicators, upcoming work, and prominent study actions.
- Keep layouts readable and operable on the current mobile preview size and on desktop.

## Technical details
- Limit UI changes to `src/index.css`, `src/components/AppLayout.tsx`, and `src/pages/Dashboard.tsx`; do not change study logic or data.
- Record the shared navigation/layout decision in `AGENTS.md`.
- Verify the live preview, responsive layout, and build logs after implementation.
