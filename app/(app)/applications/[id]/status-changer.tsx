"use client";

import { useTransition } from "react";
import { updateStatus } from "../actions";
import { Label } from "@/components/ui/label";

const PIPELINE_STATUSES = [
  "applied",
  "recruiter_screening",
  "first_interview",
  "interview_process",
  "assignment_case_study",
  "final_interview",
  "offer",
  "rejected",
  "withdrawn",
  "ghosted",
  "position_closed",
] as const;

export function StatusChanger({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="status">Status</Label>
      <select
        id="status"
        defaultValue={status}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() =>
            updateStatus(applicationId, e.target.value as (typeof PIPELINE_STATUSES)[number])
          )
        }
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {PIPELINE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
