"use client";

import { useTransition } from "react";
import { skipOpportunity } from "./actions";
import { Button } from "@/components/ui/button";

export function SkipButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => skipOpportunity(id))}
    >
      Skip
    </Button>
  );
}
