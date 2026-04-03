"use client";

import { useState } from "react";
import type { SOAPNote } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SoapNoteProps {
  soap: SOAPNote;
  onNewIntake?: () => void;
}

const URGENCY_CONFIG = {
  routine: {
    banner: "bg-green-50 border-green-200 text-green-800",
    badge:  "bg-green-100 text-green-800 border-green-300",
    dot:    "bg-green-500",
    label:  "Routine",
    icon:   "✓",
    description: "No alarm features. Standard referral pathway.",
  },
  urgent: {
    banner: "bg-orange-50 border-orange-300 text-orange-900",
    badge:  "bg-orange-100 text-orange-800 border-orange-300",
    dot:    "bg-orange-500 urgent-pulse",
    label:  "Urgent",
    icon:   "⚠",
    description: "Alarm features present. Prioritise within 1–2 weeks.",
  },
  emergent: {
    banner: "bg-red-50 border-red-300 text-red-900",
    badge:  "bg-red-100 text-red-800 border-red-300",
    dot:    "bg-red-600 urgent-pulse",
    label:  "Emergent",
    icon:   "🚨",
    description: "Critical alarm features. Same-day review required.",
  },
};

const SECTIONS = [
  {
    key: "subjective" as const,
    label: "Subjective",
    abbr: "S",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    description: "Chief complaint & history of present illness",
    stagger: "soap-section-1",
  },
  {
    key: "objective" as const,
    label: "Objective",
    abbr: "O",
    color: "text-purple-600 bg-purple-50 border-purple-200",
    description: "Measurable findings & observations",
    stagger: "soap-section-2",
  },
  {
    key: "assessment" as const,
    label: "Assessment",
    abbr: "A",
    color: "text-amber-600 bg-amber-50 border-amber-200",
    description: "Clinical impression & Rome IV classification",
    stagger: "soap-section-3",
  },
  {
    key: "plan" as const,
    label: "Plan",
    abbr: "P",
    color: "text-green-600 bg-green-50 border-green-200",
    description: "Recommended workup & follow-up",
    stagger: "soap-section-4",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors
        px-2 py-0.5 rounded border border-transparent hover:border-border hover:bg-muted"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

export function SoapNoteCard({ soap, onNewIntake }: SoapNoteProps) {
  const urgency = URGENCY_CONFIG[soap.urgency];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    subjective: true,
    objective: true,
    assessment: true,
    plan: true,
  });

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div id="soap-print" className="space-y-4 animate-fade-in">

      {/* Urgency banner */}
      <div className={cn("rounded-xl border-2 p-4", urgency.banner)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full shrink-0 mt-0.5", urgency.dot)} />
            <div>
              <p className="font-bold text-sm tracking-wide uppercase">
                {urgency.icon} {urgency.label} — GI Intake Complete
              </p>
              <p className="text-xs mt-0.5 opacity-80">{urgency.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {soap.bristol_type && (
              <span className="text-[11px] font-medium bg-white/70 px-2.5 py-1 rounded-full border">
                Bristol {soap.bristol_type}
              </span>
            )}
          </div>
        </div>

        {/* Red flags inline */}
        {soap.red_flags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-current/20">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5">
              Alarm Features
            </p>
            <div className="flex flex-wrap gap-1.5">
              {soap.red_flags.map((flag) => (
                <span
                  key={flag}
                  className="text-[11px] bg-white/60 border border-current/20 px-2 py-0.5 rounded-full"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SOAP sections */}
      {SECTIONS.map(({ key, label, abbr, color, description, stagger }) => (
        <div key={key} className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", stagger)}>
          {/* Section header */}
          <div
            onClick={() => toggleSection(key)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <span className={cn("text-xs font-black w-6 h-6 rounded-md flex items-center justify-center border", color)}>
                {abbr}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={soap[key]} />
              <span className="text-muted-foreground text-xs select-none">
                {expanded[key] ? "▲" : "▼"}
              </span>
            </div>
          </div>

          {/* Section content */}
          {expanded[key] && (
            <div className="px-4 pb-4 border-t">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pt-3">
                {soap[key] || (
                  <em className="text-muted-foreground">No data recorded.</em>
                )}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-2.5 no-print pt-1">
        <button
          onClick={() => window.print()}
          className="flex-1 py-2.5 rounded-xl border border-input bg-background text-sm font-medium
            hover:bg-muted active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          Export PDF
        </button>
        {onNewIntake && (
          <button
            onClick={onNewIntake}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
              hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shadow-sm"
          >
            New Intake
          </button>
        )}
      </div>
    </div>
  );
}
