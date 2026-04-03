from __future__ import annotations

from enum import IntEnum
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Bristol Stool Scale
# ---------------------------------------------------------------------------

class BristolType(IntEnum):
    TYPE_1 = 1  # Separate hard lumps — severe constipation
    TYPE_2 = 2  # Sausage-shaped but lumpy — mild constipation
    TYPE_3 = 3  # Sausage-shaped with cracks — normal (tending constipated)
    TYPE_4 = 4  # Smooth, soft sausage — normal / ideal
    TYPE_5 = 5  # Soft blobs with clear-cut edges — lacking fiber
    TYPE_6 = 6  # Fluffy pieces with ragged edges — mild diarrhea
    TYPE_7 = 7  # Watery, no solid pieces — severe diarrhea


# ---------------------------------------------------------------------------
# Session data (lives only in RAM)
# ---------------------------------------------------------------------------

class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class SessionData(BaseModel):
    session_id: str
    messages: list[Message] = Field(default_factory=list)
    bristol_type: Optional[BristolType] = None
    red_flags: list[str] = Field(default_factory=list)
    # Structured symptom fields populated progressively during chat
    chief_complaint: Optional[str] = None
    symptom_duration_months: Optional[float] = None
    is_complete: bool = False


# ---------------------------------------------------------------------------
# API request / response models
# ---------------------------------------------------------------------------

class StartSessionResponse(BaseModel):
    session_id: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    bristol_type: Optional[BristolType] = None


class ChatResponse(BaseModel):
    reply: str
    red_flags: list[str]
    is_complete: bool


class CompleteRequest(BaseModel):
    session_id: str


# ---------------------------------------------------------------------------
# SOAP Note
# ---------------------------------------------------------------------------

class SOAPNote(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str
    red_flags: list[str]
    bristol_type: Optional[BristolType] = None
    urgency: str  # "routine" | "urgent" | "emergent"


class CompleteResponse(BaseModel):
    soap: SOAPNote
    session_id: str  # for frontend display; session is already wiped server-side


# ---------------------------------------------------------------------------
# Mock EHR handoff
# ---------------------------------------------------------------------------

class HandoffPayload(BaseModel):
    soap: SOAPNote
    # No patient identifiers — only the clinical note


class HandoffResponse(BaseModel):
    received: bool
    message: str
