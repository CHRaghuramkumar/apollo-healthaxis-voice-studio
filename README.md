# Apollo HealthAxis · Voice AI Studio

A client-facing demo of Apollo HealthAxis AI voice agents for healthcare. It plays scripted live calls, with voice, for six use cases:

- Appointment booking and rescheduling
- Appointment reminders and cancellations
- ProHealth check-up reminders
- No-show follow-up
- Post-discharge care and feedback
- Patient support with human handoff

**Live:** https://apollo-healthaxis-voice-studio.vercel.app

## Files

| File | What it does |
|---|---|
| `index.html` | Page layout and styles |
| `app.js` | Use cases, call scripts, 19-language voice preview, ask bar, live call player |
| `drag.js` | Drag-to-reorder for the use-case cards |
| `logo.webp` | Apollo HealthAxis logo |

There is no build step. It is a static site, so open `index.html` in a browser or deploy the folder as-is.

## Run locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Notes

- Audio uses the browser's built-in speech voices. Chrome or Edge sound best, and Edge has the widest set of Indian-language voices.
- Full sample calls play in English. Other languages play the agent's opening line only.
- All patient names, UHIDs and phone numbers are fictional demo data.
