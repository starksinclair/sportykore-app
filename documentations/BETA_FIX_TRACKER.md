# SportyKore Beta Fix Tracker

This file tracks the launch-fix pass from the August 2026 tester report.

## Status Key

- Pending: not started.
- In progress: currently being worked on.
- Fixed: code change completed.
- Verified: tested or otherwise confirmed after the fix.
- Needs follow-up: requires backend, product, or reproduction work.

## Start Here

| Issue | Status | Notes |
| --- | --- | --- |
| Explain the FaceID prompt in Manage | Fixed | Added a short explanation before the native unlock prompt and kept device passcode fallback enabled. |
| Fix date picking for league start/end dates and profile DOB | Fixed | Hardened the shared native date field, increased the iOS picker sheet height so actions stay visible, and added dark-mode styling for manage sheets. |
| Fix competition logo upload formats | Fixed | Competition logo picker now accepts JPG, PNG, and WebP with square crop and the existing 5 MB limit. |
| Fix YouTube highlight keyboard overlap | Fixed | Shared bottom-sheet modals now avoid the keyboard and keep scrollable form content reachable. |
| Fix venue success toast behind modal | Fixed | Venue sheet closes before success toast is shown. |
| Fix venue map pin default country | Fixed | The venue pin map now starts in the league country instead of always defaulting to Lagos, and Places search is scoped to that country when available. |
| Fix onboarding swipe/dot/back confusion | Fixed | Onboarding dots are tappable, the first-step back button returns to the welcome screen, and the copy now explains league setup, live scoring, and player profiles more clearly. |

## Easy Fixes

| Issue | Status | Notes |
| --- | --- | --- |
| Remove debug log in invite API | Fixed | Removed the invite token log. |
| Remove debug log in team detail route | Fixed | Removed the team id log. |
| Rename support spelling to "Help center" | Fixed | Updated account support copy. |
| Verify SportyKore capitalization in frontend copy | Fixed | Visible app copy now uses SportyKore casing in the checked account/profile areas. |
| Fix create league Step 2 button hierarchy | Fixed | Back is narrower and secondary while Continue/Create remains primary. |
| Fix dead tap on own profile header name | Fixed | Detail headers only use a tappable title when a league destination exists. |
| Review OTP input sizing on small screens | Fixed | OTP boxes now size down based on screen width. |
| Fix clipped bottom tab labels like "Creat..." | Fixed | Tab labels now use semibold text, fixed below-icon layout, disabled label font scaling, and bottom safe-area padding for Android button navigation. |

## Follow-up Fixes From Report Diagnosis

| Issue | Status | Notes |
| --- | --- | --- |
| Prevent permission errors from logging users out | Fixed | Global session teardown now only runs on 401, while 403 remains a normal "not allowed" error. |
| Keep team managers lineup-only | Fixed | Team managers no longer get the manage-hub invite shortcut, and score/clock actions remain league-admin-only on the API. |
| Make Match Center score buttons feel faster | Fixed | Score plus/minus now updates optimistically and rolls back if the server rejects the change. |
| Split backend live-game rate limits | Fixed | API now uses separate buckets for score, stat, clock, and lineup updates instead of one shared game-update bucket. |
| Route invite profile creation through the enhanced profile form | Fixed | `/join/create-profile` now reuses the updated player profile form, then accepts the pending invite after profile creation. |
| Make invite codes reusable until expiry | Fixed | Backend invite acceptance now allows pending or previously accepted invite links until the 7-day expiry, while still blocking duplicate roster joins for the same player. |
| Clean up role wording | Fixed | Visible copy now uses League admin for people who run a league and Team manager for people who can set a team's lineup. |
| Make league-running controls easier to understand | Fixed | Added a Match Center flow guide, setup runbook, and role guide so admins can see the next match-day action and understand which controls belong to each role. |
| Add in-app Help center FAQ | Fixed | Added an Account settings Help center with searchable local FAQ data that can be swapped to CMS-backed content later. |
| Back Help center and bug reports with Google Sheets | Fixed | API now reads FAQs from a `faq` sheet, appends reports to a `bugs` sheet, and the app falls back to bundled FAQ content if the API is unavailable. |
| Clarify competition setup choices | Fixed | Format choices now explain league table, knockout cup, group stage, two-legged ties, double round-robin, seeding, and what is locked after creation. |
| Show active season format | Fixed | Public league overview and Manage now show the active season's competition format with a short explanation. |
| Reduce OTP restart pain on low-memory Android | Fixed | Pending OTP email is stored locally for 10 minutes so users can continue entering a code after the app restarts. |
| Lower player height minimum | Fixed | Player profile height now accepts 50 to 250 cm and displays an approximate ft/in conversion. |
| Add pass, shot, and possession tracking | Fixed | Backend stores pass/shot events in `stats`, derives possession/completion/accuracy live, and Match Center now has local-first advanced tracking with batch sync. |
| Add optimistic updates and double-submit guards | Fixed | Venues, teams, roster rows, team-manager removal, highlights, and MOTM now update the UI immediately with rollback on failure. Write requests send a client-generated idempotency key, and destructive controls guard against repeated taps while pending. |

## Notes

- Avoid broad visual rewrites while fixing these launch issues.
- Keep fixes small and verify each affected screen after changes.
- If a bug depends on backend behavior, mark it as Needs follow-up with the endpoint or scenario.
