"use client";

import { cn } from "@/lib/utils";

const BRISTOL_TYPES = [
  {
    type: 1,
    emoji: "🟤",
    label: "Type 1",
    appearance: "Separate hard lumps",
    meaning: "Severe constipation",
    color: "border-amber-800 bg-amber-50",
    selected: "border-amber-800 bg-amber-100 ring-2 ring-amber-800",
  },
  {
    type: 2,
    emoji: "🟫",
    label: "Type 2",
    appearance: "Lumpy, sausage-shaped",
    meaning: "Mild constipation",
    color: "border-amber-700 bg-amber-50",
    selected: "border-amber-700 bg-amber-100 ring-2 ring-amber-700",
  },
  {
    type: 3,
    emoji: "🟡",
    label: "Type 3",
    appearance: "Sausage with cracks",
    meaning: "Normal (tending constipated)",
    color: "border-yellow-600 bg-yellow-50",
    selected: "border-yellow-600 bg-yellow-100 ring-2 ring-yellow-600",
  },
  {
    type: 4,
    emoji: "🟢",
    label: "Type 4",
    appearance: "Smooth, soft sausage",
    meaning: "Normal / Ideal",
    color: "border-green-600 bg-green-50",
    selected: "border-green-600 bg-green-100 ring-2 ring-green-600",
  },
  {
    type: 5,
    emoji: "🟡",
    label: "Type 5",
    appearance: "Soft blobs, clear edges",
    meaning: "Lacking fiber",
    color: "border-lime-500 bg-lime-50",
    selected: "border-lime-500 bg-lime-100 ring-2 ring-lime-500",
  },
  {
    type: 6,
    emoji: "🟠",
    label: "Type 6",
    appearance: "Fluffy, mushy pieces",
    meaning: "Mild diarrhea",
    color: "border-orange-500 bg-orange-50",
    selected: "border-orange-500 bg-orange-100 ring-2 ring-orange-500",
  },
  {
    type: 7,
    emoji: "🔴",
    label: "Type 7",
    appearance: "Watery, no solid pieces",
    meaning: "Severe diarrhea",
    color: "border-red-500 bg-red-50",
    selected: "border-red-500 bg-red-100 ring-2 ring-red-500",
  },
] as const;

interface BristolSelectorProps {
  value: number | null;
  onChange: (type: number) => void;
}

export function BristolSelector({ value, onChange }: BristolSelectorProps) {
  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
        Bristol Stool Scale — select your typical stool type
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {BRISTOL_TYPES.map((item) => {
          const isSelected = value === item.type;
          return (
            <button
              key={item.type}
              onClick={() => onChange(item.type)}
              title={`${item.label}: ${item.appearance} — ${item.meaning}`}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-all text-center",
                "hover:scale-105 hover:shadow-sm",
                isSelected ? item.selected : item.color
              )}
            >
              <span className="text-xl mb-1">{item.emoji}</span>
              <span className="text-[10px] font-bold text-gray-700">
                {item.type}
              </span>
              <span className="text-[9px] text-gray-500 leading-tight hidden sm:block">
                {item.meaning.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
      {value && (
        <div className="mt-2 text-xs text-center text-muted-foreground">
          Selected:{" "}
          <span className="font-semibold text-foreground">
            {BRISTOL_TYPES[value - 1].label} — {BRISTOL_TYPES[value - 1].appearance}
          </span>{" "}
          ({BRISTOL_TYPES[value - 1].meaning})
        </div>
      )}
    </div>
  );
}
