"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { runFitReviewAction } from "@/app/(app)/opportunities/actions";
import { RECOMMENDATION_LABEL } from "@/components/fit-score-badge";
import { Button } from "@/components/ui/button";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";

export function RerunReviewButton({
  applicationId,
  profileReady,
}: {
  applicationId: string;
  profileReady: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function handleClick() {
    setRunning(true);
    try {
      await toast.promise(
        runFitReviewAction(applicationId).then((result) => {
          router.refresh();
          return result;
        }),
        {
          loading: "Re-running AI review…",
          success: (result) =>
            `Fit score updated: ${result.fitScore}% (${RECOMMENDATION_LABEL[result.recommendation] ?? result.recommendation})`,
          error: (err) => (err instanceof Error ? err.message : "Couldn't re-run the review"),
        }
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={running || !profileReady}
      onClick={handleClick}
      title={
        !profileReady
          ? "Add skills to your Career Profile (upload/extract a CV) to enable this"
          : undefined
      }
    >
      {running ? (
        <Loader2Icon className="size-3.5 animate-spin" />
      ) : (
        <RefreshCwIcon className="size-3.5" />
      )}
      {running ? "Re-running…" : "Re-run review"}
    </Button>
  );
}
