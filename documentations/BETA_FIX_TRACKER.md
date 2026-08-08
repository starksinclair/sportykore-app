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
| Fix date picking for league start/end dates and profile DOB | Fixed | Hardened the shared native date field so selected dates stay inside allowed ranges across create league, edit season, game, and profile DOB forms. |
| Fix competition logo upload formats | Fixed | Competition logo picker now accepts JPG, PNG, and WebP with square crop and the existing 5 MB limit. |
| Fix YouTube highlight keyboard overlap | Fixed | Shared bottom-sheet modals now avoid the keyboard and keep scrollable form content reachable. |
| Fix venue success toast behind modal | Fixed | Venue sheet closes before success toast is shown. |

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

## Notes

- Avoid broad visual rewrites while fixing these launch issues.
- Keep fixes small and verify each affected screen after changes.
- If a bug depends on backend behavior, mark it as Needs follow-up with the endpoint or scenario.
