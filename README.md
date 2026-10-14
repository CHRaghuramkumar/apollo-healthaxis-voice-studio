# Apollo HealthAxis · Voice AI Studio

A client-facing demo of Apollo HealthAxis voice agents. Use cases on the main page come from a password-protected admin. Each use case can be chatted with in the browser through a live [ElevenLabs](https://elevenlabs.io) agent.

## Run

```bash
cp .env.example .env
```

Set `ADMIN_PASSWORD` and `ELEVENLABS_API_KEY` in `.env`, then:

```bash
npm start
```

Open http://localhost:8000. Manage use cases at http://localhost:8000/admin.

The API key stays on the server. The browser only receives a short-lived ElevenLabs session for the agent you attached to a use case.

## Admin

Sign in and add:

- **Title:** the card heading
- **Direction:** Inbound or Outbound
- **Use cases:** one or more filters, such as Appointment booking or Cancellations
- **Description:** the summary under the title
- **Agent ID:** the ElevenLabs agent, for example `agent_abc123`

The main page has the same Direction and Use case dropdowns. Pick a filter, then start the agent that remains.

Saving updates the list the main page loads. The order in the admin is the order visitors see.

In ElevenLabs, the agent needs to allow browser conversations. A private agent works: this server requests the WebRTC token (voice) or signed URL (text) with the API key.

## Files

| File | What it does |
|---|---|
| `server.js` | Serves the site, the admin API, and ElevenLabs session tokens |
| `data/use-cases.json` | The use cases. Agent IDs live here and are not sent to the public page |
| `admin.html` | Password-protected editor |
| `index.html` | The studio page |
| `app.js` | Loads use cases and runs live chat with `@elevenlabs/client` |
| `drag.js` | Drag-to-reorder for the use-case cards in this browser |
