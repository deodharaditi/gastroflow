# GastroFlow

An AI-powered intake agent for Gastroenterology. Conducts a structured clinical interview via chat, then synthesizes a SOAP note — reducing specialist wait times by eliminating manual intake work.

**Live demo:** _add your Vercel URL here_

---

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

---

## Local development

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Groq API key](https://console.groq.com)

### Backend

```bash
# From repo root
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt

# Create .env in repo root
echo "GROQ_API_KEY=gsk_..." > .env

uvicorn backend.main:app --reload
# → http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# .env.local already points to http://127.0.0.1:8000

npm install
npm run dev
# → http://localhost:3000
```

---

## Environment variables

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | Groq API key |
| `ALLOWED_ORIGINS` | Yes (prod) | `http://localhost:3000` | Comma-separated CORS origins |
| `SESSION_TTL_HOURS` | No | `2` | Session expiry time |

### Frontend

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Yes (prod) | `http://127.0.0.1:8000` | Backend base URL |

---

## Deployment

### Backend → Render

1. New Web Service → connect GitHub repo
2. Build command: `pip install -r backend/requirements.txt`
3. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add env vars: `GROQ_API_KEY`, `ALLOWED_ORIGINS` (your Vercel URL)

### Frontend → Vercel

1. New Project → import GitHub repo
2. Set **Root Directory** to `frontend`
3. Add env var: `NEXT_PUBLIC_BACKEND_URL` (your Render URL)

### After both are deployed

Update `ALLOWED_ORIGINS` on Render to your Vercel URL, then redeploy.

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/session/start` | Create a new intake session |
| `POST` | `/session/greeting` | Get the opening message |
| `POST` | `/session/chat` | Send a patient message |
| `POST` | `/session/complete` | Synthesize SOAP note and wipe session |
| `POST` | `/handoff` | Mock EHR receiver |
| `GET` | `/health` | Health check |

---

## Project structure

```
gastroflow/
├── backend/
│   ├── clinical/
│   │   ├── bristol.py        # Bristol Stool Scale descriptions
│   │   ├── red_flags.py      # Red flag regex triage
│   │   └── rome_iv.py        # Rome IV diagnostic criteria
│   ├── prompts/
│   │   ├── intake_system.py  # Chat system prompt
│   │   └── soap_synthesis.py # SOAP synthesis prompt
│   ├── agent.py              # GIAgent — Groq API calls
│   ├── main.py               # FastAPI app + session lifecycle
│   ├── models.py             # Pydantic models
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Next.js App Router
│   ├── components/
│   │   ├── BristolSelector.tsx
│   │   ├── ChatInterface.tsx
│   │   └── SoapNote.tsx
│   └── lib/
│       └── api.ts            # Typed API client
├── render.yaml               # Render deployment config
└── runtime.txt               # Python 3.11 pin
```

---

## Disclaimer

GastroFlow is a **clinical intake aid only**. It does not provide medical diagnoses or treatment recommendations. All output must be reviewed by a qualified clinician before clinical use.
