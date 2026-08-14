"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { runFitReviewAction } from "../actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2Icon } from "lucide-react";

export function ReviewTrigger({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    runFitReviewAction(applicationId)
      .then(() => {
        router.refresh();
      })
      .catch(() => {
        setError("Couldn't generate the AI review. You can retry from this page.");
      })
      .finally(() => setRunning(false));
  }, [applicationId, router]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!running) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      Running AI fit review…
    </div>
  );
}
