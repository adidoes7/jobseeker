"use client";

import { useState } from "react";

export type StatusSegment = {
  label: string;
  count: number;
  color: string;
};

// Part-to-whole: one stacked bar (proportional segments, 2px surface gaps,
// 4px rounded outer ends, per-segment hover tooltip) plus a legend that
// carries the exact numbers — this is the "≥2 series" case, so the legend
// is mandatory, not optional.
export function StatusBreakdown({ segments, total }: { segments: StatusSegment[]; total: number }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No applications yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex h-6 w-full overflow-hidden rounded-[4px]"
        style={{ backgroundColor: "var(--viz-surface)" }}
      >
        {segments.map((s, i) => {
          const pct = Math.round((s.count / total) * 100);
          return (
            <div
              key={s.label}
              className="relative"
              style={{
                width: `${(s.count / total) * 100}%`,
                backgroundColor: s.color,
                marginRight: i < segments.length - 1 ? "2px" : 0,
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              {hovered === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground shadow-md ring-1 ring-foreground/10">
                  {s.label}: {s.count} ({pct}%)
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {segments.map((s) => {
          const pct = Math.round((s.count / total) * 100);
          return (
            <li key={s.label} className="flex items-center gap-1.5 text-sm">
              <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-medium tabular-nums text-foreground">
                {s.count} <span className="font-normal text-muted-foreground">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
