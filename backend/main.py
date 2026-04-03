"""
GastroFlow — FastAPI Backend

Stateless architecture: all patient session data lives only in RAM.
Sessions are purged immediately after SOAP note generation.

Endpoints:
  POST /session/start    — create a new intake session
  POST /session/greeting — get the opening message (no user input needed)
  POST /session/chat     — send a patient message, get agent reply
  POST /session/complete — synthesize SOAP note, handoff, wipe session
  POST /handoff          — mock EHR receiver
"""

from __future__ import annotations

import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any

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
    GreetingRequest,
    HandoffPayload,
    HandoffResponse,
    Message,
    SessionData,
    SOAPNote,
    StartSessionResponse,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("gastroflow")

# ---------------------------------------------------------------------------
# Config from environment
# ---------------------------------------------------------------------------
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

SESSION_TTL_HOURS = int(os.environ.get("SESSION_TTL_HOURS", "2"))

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
    logger.info("GastroFlow started. CORS origins: %s", ALLOWED_ORIGINS)
    yield
    sessions.clear()
    logger.info("GastroFlow shutting down — all sessions wiped.")


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
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/session/start", response_model=StartSessionResponse)
async def start_session() -> StartSessionResponse:
    """Create a new intake session. Sweeps expired sessions on each call."""
    _sweep_expired_sessions()
    session_id = str(uuid.uuid4())
    sessions[session_id] = SessionData(session_id=session_id)
    logger.info("Session started: %s", session_id)
    return StartSessionResponse(session_id=session_id)


@app.post("/session/greeting", response_model=ChatResponse)
async def session_greeting(request: GreetingRequest) -> ChatResponse:
    """
    Return the opening message without requiring a user message.
    Call this once after /session/start to kick off the conversation.
    """
    session = _get_session(request.session_id)
    reply = agent.greeting()
    session.messages.append(Message(role="assistant", content=reply))
    return ChatResponse(reply=reply, red_flags=[], is_complete=False)


@app.post("/session/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Send a patient message and receive the agent's reply."""
    session = _get_session(request.session_id)

    if session.is_complete:
        raise HTTPException(status_code=400, detail="Intake session is already complete.")

    if request.bristol_type is not None:
        session.bristol_type = BristolType(request.bristol_type)

    try:
        reply, new_red_flags = await agent.chat(session, request.message)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))

    session.messages.append(Message(role="user", content=request.message))
    session.messages.append(Message(role="assistant", content=reply))

    # Deduplicate red flags with a set for O(1) lookup
    existing = set(session.red_flags)
    for flag in new_red_flags:
        if flag not in existing:
            session.red_flags.append(flag)
            existing.add(flag)

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
    Finalize the intake:
    1. Synthesize SOAP note.
    2. Process EHR handoff.
    3. Wipe session from RAM.
    4. Return SOAP note to frontend.
    """
    session = _get_session(request.session_id)

    if not session.messages:
        raise HTTPException(
            status_code=400,
            detail="Cannot complete an empty session. Start the intake first."
        )

    try:
        soap = await agent.synthesize_soap(session)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Handoff — direct call, no self-HTTP loop
    _process_handoff(soap)

    # Wipe session — patient data is gone
    del sessions[request.session_id]
    logger.info("Session completed and wiped: %s", request.session_id)

    return CompleteResponse(soap=soap, session_id=request.session_id)


@app.post("/handoff", response_model=HandoffResponse)
async def handoff(payload: HandoffPayload) -> HandoffResponse:
    """
    Mock EHR endpoint. Replace with real EHR integration (Epic/Cerner FHIR) in production.
    """
    _process_handoff(payload.soap)
    return HandoffResponse(
        received=True,
        message=f"SOAP note received by EHR. Urgency: {payload.soap.urgency.upper()}.",
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


def _process_handoff(soap: SOAPNote) -> None:
    """
    Process EHR handoff. Currently a structured log.
    In production: replace with async POST to real EHR FHIR endpoint.
    """
    logger.info(
        "EHR handoff — urgency=%s red_flags=%d",
        soap.urgency.upper(),
        len(soap.red_flags),
    )


def _sweep_expired_sessions() -> None:
    """Remove sessions older than SESSION_TTL_HOURS to prevent RAM leaks."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=SESSION_TTL_HOURS)
    expired = [sid for sid, s in sessions.items() if s.created_at < cutoff]
    for sid in expired:
        del sessions[sid]
    if expired:
        logger.info("Swept %d expired session(s)", len(expired))
