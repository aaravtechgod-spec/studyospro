# StudyOS Liquid Glass redesign

## Goal
Redesign the existing StudyOS app using the uploaded bright Liquid Glass references without replacing its working pages, data, or features. Keep a clear, persistent way to switch back to the current interface.

## Work
- Add a saved appearance choice for **Current UI** and **Liquid Glass**. Scope new visual styling to the Liquid Glass mode so returning to Current UI restores the existing look.
- Apply a shared visual system across the signed-in pages: pale luminous canvas, frosted translucent surfaces, crisp borders, restrained lime glow, accessible contrast, and motion that respects reduced-motion settings.
- Refresh the shared desktop navigation and add a compact floating mobile dock with access to every existing destination.
- Redesign the Dashboard with its existing live queries and add useful visual hierarchy for progress, tasks, events, and shortcuts without inventing data.
- Carry the visual system through the existing study modules, with focused layout treatments for the timer and other distinctive screens while preserving their interactions.
- Keep the current dark/light theme support and all app routes, authentication, integrations, and study workflows intact.

## Technical approach
- Use the existing React, Tailwind, Lucide, and CSS token patterns; add no visual dependency or backend schema changes.
- Store the appearance choice locally and apply a root mode class, keeping all current-mode styles intact.
- Keep desktop and mobile navigation destinations derived from the same existing navigation list.

## Verification
- Check the build diagnostics and existing tests.
- Verify the redesigned Dashboard and mobile navigation in the preview, then switch back to Current UI and confirm it restores the existing presentation.