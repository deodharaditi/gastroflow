"use client";

import { useEffect, useRef, useState } from "react";
import { api, type ChatMessage, type SOAPNote } from "@/lib/api";
import { BristolSelector } from "./BristolSelector";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  onComplete: (soap: SOAPNote) => void;
}

/** Detect when the agent is asking about stool consistency / Bristol scale. */
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [bristolType, setBristolType] = useState<number | null>(null);
  const [showBristol, setShowBristol] = useState(false);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isIntakeComplete, setIsIntakeComplete] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Start session on mount
  useEffect(() => {
    api
      .startSession()
      .then((res) => {
        setSessionId(res.session_id);
        return api.chat(res.session_id, "__START__");
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
      const res = await api.chat(
        sessionId,
        userMessage,
        bristolType ?? undefined
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply },
      ]);
      setRedFlags(res.red_flags);

      // Show Bristol selector when the agent asks; hide once answered
      if (agentIsAskingAboutBristol(res.reply)) {
        setShowBristol(true);
      } else if (showBristol && bristolType !== null) {
        // Agent moved on — slide it away
        setShowBristol(false);
      }

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

  async function handleBristolSelect(type: number) {
    if (!sessionId || isLoading) return;
    setBristolType(type);
    setShowBristol(false);

    const bristolLabels: Record<number, string> = {
      1: "separate hard lumps (severe constipation)",
      2: "lumpy sausage-shaped (mild constipation)",
      3: "sausage-shaped with cracks (normal)",
      4: "smooth soft sausage (normal/ideal)",
      5: "soft blobs with clear edges (lacking fiber)",
      6: "fluffy mushy pieces (mild diarrhea)",
      7: "watery, no solid pieces (severe diarrhea)",
    };

    const autoMessage = `My stool is typically Bristol Type ${type} — ${bristolLabels[type]}.`;
    setMessages((prev) => [...prev, { role: "user", content: autoMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.chat(sessionId, autoMessage, type);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply },
      ]);
      setRedFlags(res.red_flags);
      if (agentIsAskingAboutBristol(res.reply)) setShowBristol(true);
      if (res.is_complete) setIsIntakeComplete(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-2rem)]">

      {/* Red flag banner — slides down when it appears */}
      {redFlags.length > 0 && (
        <div className="animate-slide-down bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-red-700 text-xs font-semibold uppercase tracking-wide mb-1">
            ⚠ Alarm features noted
          </p>
          <ul className="text-red-600 text-xs space-y-0.5">
            {redFlags.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && !error && (
          <div className="flex items-center justify-center h-32">
            <span className="text-muted-foreground text-sm animate-pulse">
              Connecting…
            </span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm animate-msg-right"
                  : "bg-muted text-foreground rounded-bl-sm animate-msg-left"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Animated typing indicator */}
        {isLoading && (
          <div className="flex justify-start animate-msg-left">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
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

      {/* Selected Bristol type chip (when selector is hidden) */}
      {!showBristol && bristolType !== null && (
        <div className="animate-slide-down flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground">Stool type recorded:</span>
          <button
            onClick={() => setShowBristol(true)}
            className="text-xs font-medium bg-muted px-2.5 py-1 rounded-full border
              hover:bg-accent transition-colors"
          >
            Bristol Type {bristolType} — tap to change
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="mt-3 flex flex-col gap-2">
        {error && (
          <p className="text-destructive text-xs text-center animate-slide-down">
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
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm
              placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring
              disabled:opacity-50 disabled:cursor-not-allowed transition-shadow duration-200"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isSynthesizing || !sessionId}
            className="px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium
              hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150"
          >
            Send
          </button>
        </div>

        {isIntakeComplete && (
          <button
            onClick={handleComplete}
            disabled={isSynthesizing}
            className="animate-slide-up w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold
              hover:bg-green-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150"
          >
            {isSynthesizing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="ml-1">Generating SOAP Note…</span>
              </span>
            ) : (
              "Complete Intake — Generate SOAP Note"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
