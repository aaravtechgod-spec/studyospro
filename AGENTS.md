# Architecture rules

- Store exact elapsed focus-session seconds alongside legacy minutes so Analytics can report stopwatch precision without disrupting existing XP consumers.
- Keep installability manifest-only unless offline use is explicitly requested; avoid adding service workers and app-shell caching by default so previews and updates stay straightforward.