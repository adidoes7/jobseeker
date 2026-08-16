"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { runFitReviewAction } from "../opportunities/actions";
import { FitScoreBadge, RECOMMENDATION_LABEL } from "@/components/fit-score-badge";
import { Button } from "@/components/ui/button";
import { PlayIcon, RefreshCwIcon, Loader2Icon } from "lucide-react";

export function FitScoreCell({
  applicationId,
  companyName,
  fitScore,
  fitRecommendation,
  profileReady,
}: {
  applicationId: string;
  companyName: string;
  fitScore: number | null;
  fitRecommendation: string | null;
  profileReady: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    startTransition(() => {
      toast.promise(
        runFitReviewAction(applicationId).then((result) => {
          router.refresh();
          return result;
        }),
        {
          loading: `Running AI review for ${companyName}…`,
          success: (result) =>
            `Fit score: ${result.fitScore}% (${RECOMMENDATION_LABEL[result.recommendation] ?? result.recommendation})`,
          error: (err) => (err instanceof Error ? err.message : "Couldn't run the review"),
        }
      );
    });
  }

  const title = !profileReady
    ? "Add skills to your Career Profile (upload/extract a CV) to enable this"
    : fitScore !== null
      ? "Re-run AI review"
      : "Run AI review";

  const icon = isPending ? (
    <Loader2Icon className="animate-spin" />
  ) : fitScore !== null ? (
    <RefreshCwIcon />
  ) : (
    <PlayIcon />
  );

  if (fitScore !== null) {
    return (
      <div className="flex items-center gap-1.5">
        <FitScoreBadge fitScore={fitScore} recommendation={fitRecommendation} compact />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={isPending || !profileReady}
          onClick={handleRun}
          title={title}
        >
          {icon}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-xs"
      disabled={isPending || !profileReady}
      onClick={handleRun}
      title={title}
    >
      {icon}
    </Button>
  );
}
