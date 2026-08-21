"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateStatus } from "./actions";

// Statuses that represent a scheduled event — picking one prompts for a date
// instead of applying immediately. Kept in sync with EVENT_TYPE_BY_STATUS in
// actions.ts (that's the source of truth for which event type it becomes).
export const DATED_STATUSES = new Set([
  "recruiter_screening",
  "first_interview",
  "interview_process",
  "assignment_case_study",
  "final_interview",
]);

export function useStatusChangeWithDate(applicationId: string, onApplied?: (status: string) => void) {
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  function requestChange(status: string) {
    if (DATED_STATUSES.has(status)) {
      setPendingStatus(status);
      return;
    }
    startTransition(async () => {
      await updateStatus(applicationId, status as never);
      onApplied?.(status);
    });
  }

  function confirmDate(date: Date) {
    const status = pendingStatus;
    if (!status) return;
    setPendingStatus(null);
    startTransition(async () => {
      await toast.promise(updateStatus(applicationId, status as never, date), {
        loading: "Saving…",
        success: `Status updated — scheduled for ${date.toLocaleDateString()}`,
        error: "Couldn't update status",
      });
      onApplied?.(status);
    });
  }

  function cancel() {
    setPendingStatus(null);
  }

  return { requestChange, pendingStatus, confirmDate, cancel, isPending };
}
