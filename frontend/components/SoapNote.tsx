"use client";

import type { SOAPNote } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SoapNoteProps {
  soap: SOAPNote;
  onNewIntake?: () => void;
}

const URGENCY_STYLES = {
  routine: {
    badge: "bg-green-100 text-green-800 border-green-200",
    banner: "",
    label: "Routine",
  },
  urgent: {
    badge: "bg-orange-100 text-orange-800 border-orange-200",
    banner: "border-l-4 border-orange-500",
    label: "URGENT",
  },
  emergent: {
    badge: "bg-red-100 text-red-800 border-red-200",
    banner: "border-l-4 border-red-600",
    label: "EMERGENT",
  },
};

const SECTIONS = [
  { key: "subjective", label: "S — Subjective", icon: "💬" },
  { key: "objective", label: "O — Objective", icon: "📋" },
  { key: "assessment", label: "A — Assessment", icon: "🔍" },
  { key: "plan", label: "P — Plan", icon: "📝" },
] as const;

export function SoapNoteCard({ soap, onNewIntake }: SoapNoteProps) {
  const urgencyStyle = URGENCY_STYLES[soap.urgency];

  return (
    <div className={cn("rounded-xl border bg-card p-6 space-y-5", urgencyStyle.banner)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">SOAP Note</h2>
          <p className="text-xs text-muted-foreground">AI Gastroenterology Intake Summary</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wide",
              urgencyStyle.badge
            )}
          >
            {urgencyStyle.label}
          </span>
          {soap.bristol_type && (
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full border">
              Bristol Type {soap.bristol_type}
            </span>
          )}
        </div>
      </div>

      {/* Red flags */}
      {soap.red_flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-xs font-bold uppercase tracking-wide mb-1.5">
            ⚠ Alarm Features Identified
          </p>
          <ul className="space-y-0.5">
            {soap.red_flags.map((flag) => (
              <li key={flag} className="text-red-600 text-sm">
                • {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SOAP sections */}
      {SECTIONS.map(({ key, label, icon }) => (
        <div key={key}>
          <h3 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <span>{icon}</span>
            <span>{label}</span>
          </h3>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/40 rounded-lg p-3 border">
            {soap[key] || (
              <em className="text-muted-foreground">No data recorded.</em>
            )}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => window.print()}
          className="flex-1 py-2 rounded-lg border border-input bg-background text-sm font-medium
            hover:bg-muted transition-colors"
        >
          Print / Export PDF
        </button>
        {onNewIntake && (
          <button
            onClick={onNewIntake}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium
              hover:bg-primary/90 transition-colors"
          >
            New Intake
          </button>
        )}
      </div>
    </div>
  );
}
