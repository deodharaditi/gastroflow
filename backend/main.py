"""
GastroFlow — FastAPI Backend

Stateless architecture: all patient session data lives only in RAM.
Sessions are purged immediately after SOAP note generation.

Endpoints:
  POST /session/start    — create a new intake session
  POST /session/chat     — send a patient message, get agent reply
  POST /session/complete — synthesize SOAP note, handoff, wipe session
  POST /handoff          — mock EHR receiver
"""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.agent import GIAgent
from backend.models import (
    BristolType,
    ChatRequest,
    ChatResponse,
    CompleteRequest,
    CompleteResponse,
    HandoffPayload,
    HandoffResponse,
    Message,
    SessionData,
    StartSessionResponse,
)

load_dotenv()

# ---------------------------------------------------------------------------
# In-memory session store — the ONLY place patient data lives
# ---------------------------------------------------------------------------
sessions: dict[str, SessionData] = {}

# ---------------------------------------------------------------------------
# Singleton agent (stateless — safe to share across requests)
# ---------------------------------------------------------------------------
agent: GIAgent


@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent
    agent = GIAgent()
    yield
    # On shutdown: wipe all sessions defensively
    sessions.clear()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="GastroFlow API",
    description="Stateless AI intake agent for Gastroenterology",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/session/start", response_model=StartSessionResponse)
async def start_session() -> StartSessionResponse:
    """
    Create a new intake session.
    Returns a session_id (UUID). No patient data is stored yet.
    """
    session_id = str(uuid.uuid4())
    sessions[session_id] = SessionData(session_id=session_id)
    return StartSessionResponse(session_id=session_id)


@app.post("/session/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Send a patient message and receive the agent's reply.

    Optionally include a bristol_type (1–7) from the visual selector.
    Red flags are checked on every turn and accumulated in the session.
    """
    session = _get_session(request.session_id)

    if session.is_complete:
        raise HTTPException(status_code=400, detail="Intake session is already complete.")

    # Update Bristol type if the patient used the selector
    if request.bristol_type is not None:
        session.bristol_type = BristolType(request.bristol_type)

    reply, new_red_flags = await agent.chat(session, request.message)

    # Persist this turn to RAM session
    session.messages.append(Message(role="user", content=request.message))
    session.messages.append(Message(role="assistant", content=reply))

    # Merge new red flags (deduplicated)
    for flag in new_red_flags:
        if flag not in session.red_flags:
            session.red_flags.append(flag)

    # Detect completion signal from agent
    is_complete = agent.is_intake_complete(reply)
    if is_complete:
        session.is_complete = True

    return ChatResponse(
        reply=reply,
        red_flags=session.red_flags,
        is_complete=is_complete,
    )


@app.post("/session/complete", response_model=CompleteResponse)
async def complete_session(request: CompleteRequest) -> CompleteResponse:
    """
    Finalize the intake session:
    1. Synthesize a SOAP note from the conversation.
    2. POST the note to the mock EHR /handoff endpoint.
    3. Wipe the session from RAM.
    4. Return the SOAP note to the frontend (for display only).

    After this call, all patient data is gone from the server.
    """
    session = _get_session(request.session_id)

    if not session.messages:
        raise HTTPException(
            status_code=400,
            detail="Cannot complete an empty session. Start the intake first."
        )

    # Step 1: Synthesize SOAP note
    soap = await agent.synthesize_soap(session)

    # Step 2: Handoff to mock EHR
    await _post_to_handoff(soap)

    # Step 3: Wipe session from RAM — patient data is gone
    del sessions[request.session_id]

    # Step 4: Return SOAP to frontend
    return CompleteResponse(soap=soap, session_id=request.session_id)


@app.post("/handoff", response_model=HandoffResponse)
async def handoff(payload: HandoffPayload) -> HandoffResponse:
    """
    Mock EHR endpoint. In production, this would POST to the hospital's
    EHR system (Epic/Cerner FHIR endpoint, etc.).

    Receives the SOAP note, acknowledges receipt.
    No patient identifiers are sent — only the clinical note.
    """
    # In production: forward to real EHR system
    # For MVP: acknowledge receipt
    urgency_label = payload.soap.urgency.upper()
    return HandoffResponse(
        received=True,
        message=f"SOAP note received by EHR. Urgency: {urgency_label}.",
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "active_sessions": len(sessions)}


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _get_session(session_id: str) -> SessionData:
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found. It may have expired or never existed."
        )
    return session


async def _post_to_handoff(soap) -> None:
    """Internal call from /session/complete to /handoff."""
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "http://localhost:8000/handoff",
                json=HandoffPayload(soap=soap).model_dump(),
                timeout=10.0,
            )
        except httpx.RequestError:
            # Handoff failure is non-fatal — SOAP note is still returned
            # In production, implement retry logic or a dead-letter queue
            pass
