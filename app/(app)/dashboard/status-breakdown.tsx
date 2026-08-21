export type StatusSegment = {
  label: string;
  count: number;
  color: string;
};

// Part-to-whole: one stacked bar (proportional segments, 2px surface gaps,
// 4px rounded outer ends) plus a legend that carries the exact numbers —
// this is the "≥2 series" case, so the legend is mandatory, not optional.
export function StatusBreakdown({ segments, total }: { segments: StatusSegment[]; total: number }) {
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No applications yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex h-6 w-full overflow-hidden rounded-[4px]"
        style={{ backgroundColor: "var(--viz-surface)" }}
      >
        {segments.map((s, i) => (
          <div
            key={s.label}
            style={{
              width: `${(s.count / total) * 100}%`,
              backgroundColor: s.color,
              marginRight: i < segments.length - 1 ? "2px" : 0,
            }}
            title={`${s.label}: ${s.count} (${Math.round((s.count / total) * 100)}%)`}
          />
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {segments.map((s) => {
          const pct = Math.round((s.count / total) * 100);
          return (
            <li key={s.label} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate text-muted-foreground">{s.label}</span>
              <span className="ml-auto shrink-0 font-medium tabular-nums text-foreground">
                {s.count} <span className="font-normal text-muted-foreground">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
