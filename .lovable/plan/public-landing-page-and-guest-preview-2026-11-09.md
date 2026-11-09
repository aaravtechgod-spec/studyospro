# Public Landing Page and Guest Preview

## Experience
- Make StudyOS’s front door public: visitors see a polished welcome page, with clear sign-in and account-creation actions.
- Add a guest preview that demonstrates the study dashboard and a few sample workflows without requiring an account.
- Keep guest activity isolated and temporary; it must not read or write a visitor’s real study data.
- Preserve the existing signed-in app, saved appearance preference, routes, and auth flow.

## Implementation
- Add public landing and demo pages using the existing bright Liquid Glass visual direction and semantic design tokens.
- Route signed-out visits to the welcome page, retain `/auth` for sign-in, and expose the guest preview at `/demo`.
- Use clearly labeled sample data and browser-local demo interactions only; include links from both public pages into sign-in/sign-up.
- Add app-specific page metadata and a focused test for guest/public routing behavior where the current test setup supports it.

## Validation
- Verify public welcome page and demo on desktop and mobile, signed-in route protection, and the sign-in/signup entry points.
- Run relevant tests and review current build/runtime logs.
