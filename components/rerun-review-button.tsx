"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runFitReviewAction } from "@/app/(app)/opportunities/actions";
import { Button } from "@/components/ui/button";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";

export function RerunReviewButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setRunning(true);
    setError(null);
    try {
      await runFitReviewAction(applicationId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't re-run the review");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="outline" size="sm" disabled={running} onClick={handleClick}>
        {running ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <RefreshCwIcon className="size-3.5" />
        )}
        {running ? "Re-running…" : "Re-run review"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
