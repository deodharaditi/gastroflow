"use client";

import { useEffect, useRef, useState } from "react";
import { api, type ChatMessage, type SOAPNote } from "@/lib/api";
import { BristolSelector } from "./BristolSelector";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  onComplete: (soap: SOAPNote) => void;
}

const INTAKE_PHASES = [
  { label: "Chief complaint",  threshold: 2  },
  { label: "Symptom history",  threshold: 6  },
  { label: "Stool & diet",     threshold: 10 },
  { label: "Medical history",  threshold: 14 },
  { label: "Ready to review",  threshold: 18 },
];

function getPhase(messageCount: number) {
  const idx = INTAKE_PHASES.findIndex((p) => messageCount < p.threshold);
  return idx === -1 ? INTAKE_PHASES.length - 1 : idx;
}

function agentIsAskingAboutBristol(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("bristol") ||
    lower.includes("stool type") ||
    lower.includes("stool consistency") ||
    lower.includes("consistency of your stool") ||
    lower.includes("what does your stool") ||
    lower.includes("describe your stool") ||
    lower.includes("type 1") ||
    lower.includes("type 4") ||
    lower.includes("type 7") ||
    lower.includes("selector")
  );
}

export function ChatInterface({ onComplete }: ChatInterfaceProps) {
  const [sessionId, setSessionId]           = useState<string | null>(null);
  const [messages, setMessages]             = useState<ChatMessage[]>([]);
  const [input, setInput]                   = useState("");
  const [bristolType, setBristolType]       = useState<number | null>(null);
  const [showBristol, setShowBristol]       = useState(false);
  const [redFlags, setRedFlags]             = useState<string[]>([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [isIntakeComplete, setIsIntakeComplete] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .startSession()
      .then((res) => {
        setSessionId(res.session_id);
        return api.greeting(res.session_id);
      })
      .then((res) => {
        setMessages([{ role: "assistant", content: res.reply }]);
        if (agentIsAskingAboutBristol(res.reply)) setShowBristol(true);
      })
      .catch(() =>
        setError("Could not connect to GastroFlow. Is the backend running?")
      );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, showBristol]);

  async function handleSend() {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.chat(sessionId, userMessage, bristolType ?? undefined);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      setRedFlags(res.red_flags);
      if (agentIsAskingAboutBristol(res.reply)) setShowBristol(true);
      else if (showBristol && bristolType !== null) setShowBristol(false);
      if (res.is_complete) setIsIntakeComplete(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBristolSelect(type: number) {
    if (!sessionId || isLoading) return;
    setBristolType(type);
    setShowBristol(false);

    const labels: Record<number, string> = {
      1: "separate hard lumps (severe constipation)",
      2: "lumpy sausage-shaped (mild constipation)",
      3: "sausage-shaped with cracks (normal)",
      4: "smooth soft sausage (normal/ideal)",
      5: "soft blobs with clear edges (lacking fiber)",
      6: "fluffy mushy pieces (mild diarrhea)",
      7: "watery, no solid pieces (severe diarrhea)",
    };

    const autoMessage = `My stool is typically Bristol Type ${type} — ${labels[type]}.`;
    setMessages((prev) => [...prev, { role: "user", content: autoMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.chat(sessionId, autoMessage, type);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      setRedFlags(res.red_flags);
      if (agentIsAskingAboutBristol(res.reply)) setShowBristol(true);
      if (res.is_complete) setIsIntakeComplete(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleComplete() {
    if (!sessionId || isSynthesizing) return;
    setIsSynthesizing(true);
    setError(null);
    try {
      const res = await api.completeSession(sessionId);
      setSessionId(null);
      onComplete(res.soap);
    } catch (e) {
      setError((e as Error).message);
      setIsSynthesizing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const phaseIdx    = getPhase(messages.length);
  const progressPct = Math.min(100, (messages.length / 18) * 100);
  const isConnecting = messages.length === 0 && !error;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-2rem)]">

      {/* Progress bar */}
      {!isConnecting && (
        <div className="mb-3 animate-fade-in">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-muted-foreground font-medium">
              {INTAKE_PHASES[phaseIdx].label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Red flag banner */}
      {redFlags.length > 0 && (
        <div className="animate-slide-down bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
          <p className="text-red-700 text-xs font-bold uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <span>⚠</span> Alarm features noted
          </p>
          <ul className="text-red-600 text-xs space-y-0.5">
            {redFlags.map((f) => <li key={f}>• {f}</li>)}
          </ul>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">

        {/* Connecting skeleton */}
        {isConnecting && (
          <div className="space-y-3 pt-2">
            <div className="flex gap-2.5 items-end">
              <div className="skeleton w-7 h-7 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-[70%]">
                <div className="skeleton h-3.5 rounded w-full" />
                <div className="skeleton h-3.5 rounded w-4/5" />
                <div className="skeleton h-3.5 rounded w-3/5" />
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex items-end gap-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {/* Agent avatar */}
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mb-0.5">
                <span className="text-white text-[11px] font-bold">G</span>
              </div>
            )}

            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm animate-msg-right"
                  : "bg-white border border-border text-foreground rounded-bl-sm shadow-sm animate-msg-left"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-end gap-2 animate-msg-left">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold">G</span>
            </div>
            <div className="bg-white border border-border rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 flex items-center gap-1.5">
              <span className="typing-dot text-muted-foreground" />
              <span className="typing-dot text-muted-foreground" />
              <span className="typing-dot text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bristol selector — slides up only when asked */}
      {showBristol && (
        <div className="animate-slide-up border-t pt-3 mt-3">
          <BristolSelector value={bristolType} onChange={handleBristolSelect} />
        </div>
      )}

      {/* Bristol chip when selector is hidden */}
      {!showBristol && bristolType !== null && (
        <div className="animate-slide-down flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground">Stool type:</span>
          <button
            onClick={() => setShowBristol(true)}
            className="text-xs font-medium bg-muted px-2.5 py-1 rounded-full border
              hover:bg-accent transition-colors"
          >
            Bristol Type {bristolType} · tap to change
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="mt-3 flex flex-col gap-2">
        {error && (
          <p className="text-destructive text-xs text-center animate-slide-down bg-destructive/5 border border-destructive/20 rounded-lg py-2 px-3">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response…"
            rows={2}
            disabled={isLoading || isSynthesizing || !sessionId}
            className="flex-1 resize-none rounded-xl border border-input bg-white px-3 py-2 text-sm
              placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring
              disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-shadow duration-200"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isSynthesizing || !sessionId}
            className="px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
              hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-150 shadow-sm"
          >
            Send
          </button>
        </div>

        {isIntakeComplete && (
          <button
            onClick={handleComplete}
            disabled={isSynthesizing}
            className="animate-slide-up w-full py-3 rounded-xl bg-green-600 text-white text-sm font-semibold
              hover:bg-green-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150 shadow-sm"
          >
            {isSynthesizing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="ml-1 opacity-80">Generating SOAP Note…</span>
              </span>
            ) : (
              "Complete Intake — Generate SOAP Note →"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
