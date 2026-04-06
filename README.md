# GastroFlow

An AI-powered intake agent for Gastroenterology. Conducts a structured clinical interview via chat, then synthesizes a SOAP note — reducing specialist wait times by eliminating manual intake work.

**Live demo:** https://gastroflow-xi.vercel.app/

## How it works

1. Patient starts a session and chats with the AI intake agent
2. Agent collects symptoms, history, and stool characteristics (Bristol Scale)
3. Red flags (bleeding, weight loss, dysphagia, etc.) are detected in real time
4. Patient clicks "Complete Intake" — a SOAP note is generated and dispatched to the EHR
5. Session data is wiped from memory immediately after handoff

---

## Architecture

```
┌─────────────────┐        ┌──────────────────────────┐
│  Next.js        │──/api/─▶  FastAPI (Python)         │
│  (Vercel)       │        │  (Render)                 │
│                 │        │                           │
│  Chat UI        │        │  GIAgent (stateless)      │
│  Bristol        │        │  ├── intake chat          │
│  Selector       │        │  │   llama-4-scout-17b    │
│  SOAP Viewer    │        │  └── SOAP synthesis       │
└─────────────────┘        │      llama-3.3-70b        │
                           │                           │
                           │  sessions: dict (RAM only)│
                           │  wiped on complete        │
                           └──────────────────────────┘
```

**Stateless by design** — no database. Session data lives only in RAM and is destroyed immediately after the SOAP note is generated. No PHI is ever written to disk or logs.

---

## Clinical standards

- **Rome IV Diagnostic Criteria** — IBS (C/D/M/U), Functional Dyspepsia (EPS/PDS), Functional Constipation, GERD
- **Bristol Stool Scale** — Types 1–7 with visual SVG selector
- **Red flag triage** — rectal bleeding, weight loss, dysphagia, anemia, nocturnal symptoms, fever, night sweats, family history of CRC/IBD, palpable mass

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, Tailwind CSS, Shadcn/UI |
| Backend | FastAPI, Python 3.11, Pydantic v2 |
| AI | Groq SDK — Llama 4 Scout (chat), Llama 3.3 70B (SOAP) |
| Hosting | Vercel (frontend), Render (backend) |

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/session/start` | Create a new intake session |
| `POST` | `/session/greeting` | Get the opening message |
| `POST` | `/session/chat` | Send a patient message |
| `POST` | `/session/complete` | Synthesize SOAP note and wipe session |
| `POST` | `/handoff` | Mock EHR receiver |
| `GET` | `/health` | Health check |

## Disclaimer

GastroFlow is a **clinical intake aid only**. It does not provide medical diagnoses or treatment recommendations. All output must be reviewed by a qualified clinician before clinical use.
