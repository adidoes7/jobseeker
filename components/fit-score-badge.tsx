import { cn } from "@/lib/utils";

export const RECOMMENDATION_LABEL: Record<string, string> = {
  strong_apply: "Strong Apply",
  apply: "Apply",
  consider: "Consider",
  low_priority: "Low Priority",
  skip: "Skip",
};

export const RECOMMENDATION_COLOR: Record<string, string> = {
  strong_apply: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  apply: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  consider: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  low_priority: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  skip: "bg-destructive/15 text-destructive",
};

export function FitScoreBadge({
  fitScore,
  recommendation,
  compact = false,
}: {
  fitScore: number | null;
  recommendation: string | null;
  /** Score only, no recommendation label — for tight spaces like a table cell. */
  compact?: boolean;
}) {
  if (fitScore === null || recommendation === null) {
    return <span className="text-sm text-muted-foreground">{compact ? "—" : "Not reviewed yet"}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span
        title={compact ? (RECOMMENDATION_LABEL[recommendation] ?? recommendation) : undefined}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium",
          RECOMMENDATION_COLOR[recommendation] ?? "bg-muted text-foreground"
        )}
      >
        {compact ? `${fitScore}%` : `${fitScore}% · ${RECOMMENDATION_LABEL[recommendation] ?? recommendation}`}
      </span>
    </div>
  );
}
