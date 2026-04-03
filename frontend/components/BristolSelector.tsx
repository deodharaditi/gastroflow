"use client";

import { cn } from "@/lib/utils";

const BRISTOL_TYPES = [
  {
    type: 1,
    appearance: "Separate hard lumps",
    meaning: "Severe constipation",
    direction: "constipation",
    colorClass: "border-amber-800",
    bgClass: "bg-amber-50",
    selectedBg: "bg-amber-100",
    ringClass: "ring-amber-800",
    dotColor: "#92400e",
    // Visual: several separate small circles
    shape: "lumps",
  },
  {
    type: 2,
    appearance: "Lumpy sausage",
    meaning: "Mild constipation",
    direction: "constipation",
    colorClass: "border-amber-700",
    bgClass: "bg-amber-50",
    selectedBg: "bg-amber-100",
    ringClass: "ring-amber-700",
    dotColor: "#b45309",
    shape: "lumpy-sausage",
  },
  {
    type: 3,
    appearance: "Sausage with cracks",
    meaning: "Normal",
    direction: "normal",
    colorClass: "border-yellow-600",
    bgClass: "bg-yellow-50",
    selectedBg: "bg-yellow-100",
    ringClass: "ring-yellow-600",
    dotColor: "#ca8a04",
    shape: "cracked-sausage",
  },
  {
    type: 4,
    appearance: "Smooth sausage",
    meaning: "Ideal",
    direction: "normal",
    colorClass: "border-green-600",
    bgClass: "bg-green-50",
    selectedBg: "bg-green-100",
    ringClass: "ring-green-600",
    dotColor: "#16a34a",
    shape: "smooth-sausage",
  },
  {
    type: 5,
    appearance: "Soft blobs",
    meaning: "Lacking fiber",
    direction: "loose",
    colorClass: "border-lime-500",
    bgClass: "bg-lime-50",
    selectedBg: "bg-lime-100",
    ringClass: "ring-lime-500",
    dotColor: "#65a30d",
    shape: "blobs",
  },
  {
    type: 6,
    appearance: "Fluffy & mushy",
    meaning: "Mild diarrhea",
    direction: "diarrhea",
    colorClass: "border-orange-500",
    bgClass: "bg-orange-50",
    selectedBg: "bg-orange-100",
    ringClass: "ring-orange-500",
    dotColor: "#ea580c",
    shape: "fluffy",
  },
  {
    type: 7,
    appearance: "Watery",
    meaning: "Severe diarrhea",
    direction: "diarrhea",
    colorClass: "border-red-500",
    bgClass: "bg-red-50",
    selectedBg: "bg-red-100",
    ringClass: "ring-red-500",
    dotColor: "#dc2626",
    shape: "watery",
  },
] as const;

type ShapeType = (typeof BRISTOL_TYPES)[number]["shape"];

function BristolShape({ shape, color }: { shape: ShapeType; color: string }) {
  const s = { fill: color, stroke: "none" };

  switch (shape) {
    case "lumps":
      return (
        <svg viewBox="0 0 48 28" className="w-full h-7">
          <circle cx="9"  cy="14" r="6" style={s} />
          <circle cx="24" cy="10" r="6" style={s} />
          <circle cx="39" cy="16" r="6" style={s} />
        </svg>
      );
    case "lumpy-sausage":
      return (
        <svg viewBox="0 0 48 28" className="w-full h-7">
          <ellipse cx="24" cy="14" rx="20" ry="8" style={s} />
          <ellipse cx="12" cy="10" rx="5" ry="4" style={s} />
          <ellipse cx="28" cy="9"  rx="5" ry="4" style={s} />
          <ellipse cx="38" cy="12" rx="4" ry="3" style={s} />
        </svg>
      );
    case "cracked-sausage":
      return (
        <svg viewBox="0 0 48 28" className="w-full h-7">
          <ellipse cx="24" cy="14" rx="21" ry="8" style={s} />
          <line x1="16" y1="6" x2="14" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="26" y1="6" x2="24" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="36" y1="7" x2="34" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "smooth-sausage":
      return (
        <svg viewBox="0 0 48 28" className="w-full h-7">
          <ellipse cx="24" cy="14" rx="21" ry="8" style={s} />
        </svg>
      );
    case "blobs":
      return (
        <svg viewBox="0 0 48 28" className="w-full h-7">
          <ellipse cx="12" cy="14" rx="8"  ry="6" style={s} />
          <ellipse cx="27" cy="13" rx="8"  ry="6" style={s} />
          <ellipse cx="41" cy="15" rx="6"  ry="5" style={s} />
        </svg>
      );
    case "fluffy":
      return (
        <svg viewBox="0 0 48 28" className="w-full h-7">
          <ellipse cx="14" cy="16" rx="9"  ry="6" style={s} />
          <ellipse cx="10" cy="12" rx="6"  ry="5" style={s} />
          <ellipse cx="20" cy="11" rx="6"  ry="5" style={s} />
          <ellipse cx="32" cy="15" rx="9"  ry="6" style={s} />
          <ellipse cx="28" cy="11" rx="6"  ry="5" style={s} />
          <ellipse cx="39" cy="11" rx="5"  ry="4" style={s} />
        </svg>
      );
    case "watery":
      return (
        <svg viewBox="0 0 48 28" className="w-full h-7">
          <path
            d="M4,18 Q10,8 16,16 Q22,24 28,14 Q34,4 44,16 L44,24 Q34,28 24,24 Q14,20 4,24 Z"
            style={s}
          />
        </svg>
      );
  }
}

interface BristolSelectorProps {
  value: number | null;
  onChange: (type: number) => void;
}

export function BristolSelector({ value, onChange }: BristolSelectorProps) {
  return (
    <div className="w-full space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground uppercase tracking-widest">
          Bristol Stool Scale
        </p>
        <p className="text-[11px] text-muted-foreground">Select your typical type</p>
      </div>

      {/* Scale spectrum bar */}
      <div className="flex rounded-full overflow-hidden h-1.5 gap-px">
        <div className="flex-[2] bg-amber-400 rounded-l-full" />
        <div className="flex-[2] bg-green-400" />
        <div className="flex-[3] bg-red-400 rounded-r-full" />
      </div>
      <div className="flex text-[10px] text-muted-foreground">
        <span className="flex-[2]">Constipation</span>
        <span className="flex-[2] text-center">Normal</span>
        <span className="flex-[3] text-right">Diarrhea</span>
      </div>

      {/* Type cards */}
      <div className="grid grid-cols-7 gap-1.5">
        {BRISTOL_TYPES.map((item) => {
          const isSelected = value === item.type;
          return (
            <button
              key={item.type}
              onClick={() => onChange(item.type)}
              title={`Type ${item.type}: ${item.appearance} — ${item.meaning}`}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 cursor-pointer",
                "transition-all duration-150 hover:scale-105 hover:shadow-md focus:outline-none",
                isSelected
                  ? cn(item.selectedBg, item.colorClass, `ring-2 ${item.ringClass}`, "scale-105 shadow-md")
                  : cn(item.bgClass, "border-transparent hover:" + item.colorClass)
              )}
            >
              {/* Shape illustration */}
              <div className="w-full px-0.5">
                <BristolShape shape={item.shape} color={item.dotColor} />
              </div>
              {/* Type number */}
              <span
                className="text-[11px] font-bold leading-none"
                style={{ color: item.dotColor }}
              >
                {item.type}
              </span>
              {/* Meaning (desktop only) */}
              <span className="hidden sm:block text-[9px] text-muted-foreground leading-tight text-center">
                {item.meaning}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected description */}
      {value !== null && (
        <div className="animate-slide-down text-xs text-center py-1.5 px-3 rounded-lg bg-muted border">
          <span className="font-semibold text-foreground">
            Type {value} — {BRISTOL_TYPES[value - 1].appearance}
          </span>
          <span className="text-muted-foreground ml-1">
            ({BRISTOL_TYPES[value - 1].meaning})
          </span>
        </div>
      )}
    </div>
  );
}
