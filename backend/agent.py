"""
GIAgent — stateless service class for the GastroFlow AI intake agent.

This class does NOT hold session state. All session data is passed in
from the in-memory session store in main.py.

Models:
  Chat:      meta-llama/llama-4-scout-17b-16e-instruct  (speed)
  Synthesis: llama-3.3-70b-versatile                    (accuracy)

Zero Data Retention: X-Groq-Privacy: zero-retention header is set
globally on the Groq client and applied to every request.
"""

from __future__ import annotations

import json
import os

from groq import AsyncGroq

from backend.clinical.red_flags import triage_red_flags, get_urgency_level
from backend.models import Message, SessionData, SOAPNote
from backend.prompts.intake_system import INTAKE_SYSTEM_PROMPT
from backend.prompts.soap_synthesis import (
    SOAP_SYNTHESIS_SYSTEM_PROMPT,
    build_synthesis_user_prompt,
)

CHAT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
SYNTHESIS_MODEL = "llama-3.3-70b-versatile"


class GIAgent:
    """
    Stateless AI intake agent for Gastroenterology.

    Usage:
        agent = GIAgent()
        reply = await agent.chat(session, user_message)
        soap  = await agent.synthesize_soap(session)
    """

    def __init__(self) -> None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. "
                "Copy backend/.env.example to backend/.env and add your key."
            )
        self._client = AsyncGroq(
            api_key=api_key,
            default_headers={"X-Groq-Privacy": "zero-retention"},
        )

    async def chat(self, session: SessionData, user_message: str) -> tuple[str, list[str]]:
        """
        Process a patient message and return (agent_reply, new_red_flags).

        Red flags found in this turn are returned separately so main.py
        can merge them into the session without this method touching state.
        """
        new_red_flags = triage_red_flags(user_message)

        # Build the messages list for this API call
        groq_messages: list[dict] = [
            {"role": "system", "content": INTAKE_SYSTEM_PROMPT}
        ]
        for msg in session.messages:
            groq_messages.append({"role": msg.role, "content": msg.content})
        groq_messages.append({"role": "user", "content": user_message})

        response = await self._client.chat.completions.create(
            model=CHAT_MODEL,
            messages=groq_messages,
            temperature=0.4,
            max_tokens=512,
        )

        reply = response.choices[0].message.content or ""
        return reply, new_red_flags

    async def synthesize_soap(self, session: SessionData) -> SOAPNote:
        """
        Synthesize the full conversation into a structured SOAP note.
        Uses the high-accuracy model (llama-3.3-70b-versatile).
        """
        conversation_text = _format_conversation(session.messages)
        user_prompt = build_synthesis_user_prompt(
            conversation_text=conversation_text,
            bristol_type=int(session.bristol_type) if session.bristol_type else None,
            red_flags=session.red_flags,
        )

        response = await self._client.chat.completions.create(
            model=SYNTHESIS_MODEL,
            messages=[
                {"role": "system", "content": SOAP_SYNTHESIS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,  # deterministic for clinical accuracy
            max_tokens=2048,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        return _parse_soap_response(raw, session)

    def is_intake_complete(self, reply: str) -> bool:
        """
        Heuristic: detect when the agent signals intake is complete.
        Matches the trigger phrase from the system prompt.
        """
        markers = [
            "i have gathered all the information",
            "please click 'complete intake'",
            "please click complete intake",
            "i will now prepare a summary",
        ]
        reply_lower = reply.lower()
        return any(marker in reply_lower for marker in markers)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _format_conversation(messages: list[Message]) -> str:
    lines: list[str] = []
    for msg in messages:
        role = "Patient" if msg.role == "user" else "GastroFlow"
        lines.append(f"{role}: {msg.content}")
    return "\n".join(lines)


def _parse_soap_response(raw: str, session: SessionData) -> SOAPNote:
    """Parse the JSON SOAP response from the synthesis model."""
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: return a minimal note flagging the parse error
        data = {
            "subjective": raw,
            "objective": "Bristol Stool Type: " + (
                str(int(session.bristol_type)) if session.bristol_type else "Not provided"
            ),
            "assessment": "Synthesis model returned malformed JSON. Manual review required.",
            "plan": "Please review the raw intake conversation and complete the note manually.",
            "urgency": get_urgency_level(session.red_flags),
        }

    urgency = data.get("urgency", get_urgency_level(session.red_flags))
    if urgency not in ("routine", "urgent", "emergent"):
        urgency = get_urgency_level(session.red_flags)

    return SOAPNote(
        subjective=data.get("subjective", ""),
        objective=data.get("objective", ""),
        assessment=data.get("assessment", ""),
        plan=data.get("plan", ""),
        red_flags=session.red_flags,
        bristol_type=session.bristol_type,
        urgency=urgency,
    )
