# GastroFlow — CLAUDE.md

## Project Overview
GastroFlow is a stateless, specialist AI intake agent for Gastroenterology. It performs clinical intake via AI chat to generate a SOAP note, reducing specialist wait times by eliminating manual intake work.

---

## Architecture Rules

### Stateless by Design (NON-NEGOTIABLE)
- **No databases.** No SQLite, PostgreSQL, Redis, or any persistent store for patient data.
- Session data lives **only in RAM** in the `sessions: dict[str, SessionData]` store in `main.py`.
- Sessions are **destroyed immediately** after the SOAP note is dispatched to `/handoff`.
- Never log PHI (Protected Health Information) to disk, stdout, or any external service.
- Session IDs are UUIDs — never expose patient identifiers.

### AI Stack
- **Patient chat model:** `meta-llama/llama-4-scout-17b-16e-instruct` (speed-optimized)
- **SOAP synthesis model:** `llama-3.3-70b-versatile` (accuracy-optimized)
- **Zero Data Retention:** All Groq SDK requests MUST include the header:
  ```
  X-Groq-Privacy: zero-retention
  ```
  This is set globally on the `Groq` client via `default_headers`. Never remove it.

---

## Clinical Standards

### Rome IV Diagnostic Criteria
All GI symptom classification MUST follow the **Rome IV criteria** (2016).

Key thresholds:
- Symptoms must be present for **≥ 6 months** with active symptoms in the **last 3 months**.
- IBS requires **recurrent abdominal pain ≥ 1 day/week** in the last 3 months, associated with ≥ 2 of:
  1. Related to defecation
  2. Associated with a change in stool frequency
  3. Associated with a change in stool form/appearance
- Subtypes:
  - **IBS-C** (Constipation-predominant): Bristol Types 1–2 in >25% of bowel movements
  - **IBS-D** (Diarrhea-predominant): Bristol Types 6–7 in >25% of bowel movements
  - **IBS-M** (Mixed): Both Bristol 1–2 and 6–7 each >25%
  - **IBS-U** (Unclassified): Does not meet above criteria
- **Functional Dyspepsia** subtypes: EPS (Epigastric Pain Syndrome) and PDS (Postprandial Distress Syndrome)
- **GERD:** Heartburn ≥ 2 days/week for quality-of-life impact

The intake agent should collect all data needed to apply these criteria. The synthesis model applies the classification.

### Bristol Stool Scale
Always reference stool type using both the **number and description**:

| Type | Description | Clinical Meaning |
|------|-------------|-----------------|
| 1 | Separate hard lumps, like nuts | Severe constipation |
| 2 | Sausage-shaped but lumpy | Mild constipation |
| 3 | Sausage-shaped with cracks | Normal (tending constipated) |
| 4 | Smooth, soft sausage or snake | Normal / Ideal |
| 5 | Soft blobs with clear-cut edges | Lacking fiber |
| 6 | Fluffy pieces with ragged edges | Mild diarrhea |
| 7 | Watery, no solid pieces | Severe diarrhea |

### Red Flags (Triage — Urgent)
The following symptoms require **urgent flagging** in the SOAP assessment and must be surfaced to the clinician immediately:

- Rectal bleeding / blood in stool / melena / black tarry stools
- Unintentional weight loss (≥ 10% body weight, or any unexplained loss)
- Dysphagia (difficulty swallowing) or odynophagia (painful swallowing)
- Iron-deficiency anemia
- Nocturnal symptoms (waking from sleep with pain/diarrhea)
- Fever (unexplained)
- Night sweats
- Family history of colorectal cancer, IBD, or celiac disease
- Age > 50 with new-onset symptoms
- Palpable abdominal mass (if mentioned)

Red flags MUST be listed prominently in the **Assessment** section of the SOAP note with an `URGENT` marker.

---

## Code Standards

### Python (Backend)
- Python 3.11+
- Use `async/await` throughout (FastAPI async handlers, async Groq calls)
- Pydantic v2 for all request/response models
- Type hints on all function signatures
- Keep clinical logic in `backend/clinical/` — never inline it in `agent.py` or `main.py`
- Keep prompts in `backend/prompts/` as Python string constants — never hardcode prompts in `agent.py`
- `GIAgent` is a stateless service class — it does NOT hold session state itself
- Never catch broad `Exception` — catch specific errors from Groq SDK

### TypeScript (Frontend)
- Next.js 14+ App Router
- Tailwind CSS for all styling
- Shadcn/UI for component primitives
- Typed API client in `lib/api.ts` — no raw `fetch` calls in components
- Session ID lives in React component state only — never in `localStorage`, cookies, or URL params
- No patient data is persisted in the browser

### Environment Variables
Required in `.env` (never committed):
```
GROQ_API_KEY=gsk_...
```

---

## Session Lifecycle
```
POST /session/start
  → creates SessionData in RAM
  → returns session_id (UUID)

POST /session/chat  (many times)
  → appends messages to session
  → runs red flag triage on each turn
  → returns agent reply

POST /session/complete
  → synthesizes SOAP note (llama-3.3-70b-versatile)
  → POSTs SOAP to POST /handoff (mock EHR)
  → del sessions[session_id]   ← data is gone
  → returns SOAP note to frontend (for display only)
```

---

## What NOT to Do
- Do not add a database layer "for convenience"
- Do not log patient messages to files or stdout in production
- Do not use `model="gpt-*"` or any non-Groq model
- Do not remove the `X-Groq-Privacy: zero-retention` header
- Do not store session_id in the browser beyond the active session
- Do not skip Rome IV criteria in the synthesis prompt
- Do not mark a Red Flag as non-urgent
