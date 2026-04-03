/**
 * GastroFlow API client.
 * All session data lives only in RAM on the backend.
 * Session ID is held in component state — never persisted.
 */

const API_BASE = "/api";
const TIMEOUT_MS = 30_000;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  red_flags: string[];
  bristol_type: number | null;
  urgency: "routine" | "urgent" | "emergent";
}

export interface StartSessionResponse {
  session_id: string;
}

export interface ChatResponse {
  reply: string;
  red_flags: string[];
  is_complete: boolean;
}

export interface CompleteResponse {
  soap: SOAPNote;
  session_id: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(error.detail ?? "Unknown API error");
    }

    return res.json() as Promise<T>;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  startSession(): Promise<StartSessionResponse> {
    return post<StartSessionResponse>("/session/start", {});
  },

  greeting(sessionId: string): Promise<ChatResponse> {
    return post<ChatResponse>("/session/greeting", { session_id: sessionId });
  },

  chat(
    sessionId: string,
    message: string,
    bristolType?: number
  ): Promise<ChatResponse> {
    return post<ChatResponse>("/session/chat", {
      session_id: sessionId,
      message,
      ...(bristolType !== undefined && { bristol_type: bristolType }),
    });
  },

  completeSession(sessionId: string): Promise<CompleteResponse> {
    return post<CompleteResponse>("/session/complete", {
      session_id: sessionId,
    });
  },
};
