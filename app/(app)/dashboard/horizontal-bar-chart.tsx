export type BarDatum = {
  label: string;
  value: number;
  displayValue?: string;
  color?: string;
};

// Thin horizontal bars: ≤24px thick, square baseline / 4px rounded tip,
// direct value label outside the bar (never clipped), category label
// beside it. One hue by default (sequential — magnitude is the point);
// pass per-bar colors when the bars are literally different categories
// (see fit-score-by-outcome / rejection-reasons on the dashboard).
export function HorizontalBarChart({
  data,
  maxValue,
  valueSuffix = "",
}: {
  data: BarDatum[];
  maxValue?: number;
  valueSuffix?: string;
}) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough data yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => {
        const pct = max > 0 ? Math.min(100, (d.value / max) * 100) : 0;
        return (
          <div key={d.label} className="flex items-center gap-3">
            <span
              className="w-28 shrink-0 truncate text-sm text-muted-foreground sm:w-36"
              title={d.label}
            >
              {d.label}
            </span>
            <div className="h-5 flex-1 border-b" style={{ borderColor: "var(--viz-baseline)" }}>
              <div
                className="h-5 rounded-r-[4px]"
                style={{ width: `${pct}%`, backgroundColor: d.color ?? "var(--viz-sequential)" }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
              {d.displayValue ?? `${d.value}${valueSuffix}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
