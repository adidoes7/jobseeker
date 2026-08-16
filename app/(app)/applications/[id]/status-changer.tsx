"use client";

import { useTransition } from "react";
import { updateStatus } from "../actions";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PIPELINE_STATUSES = [
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
  "abandoned",
  "position_closed",
] as const;

const STATUS_ITEMS = Object.fromEntries(
  PIPELINE_STATUSES.map((s) => [s, s.replace(/_/g, " ")])
);

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
      <Select
        items={STATUS_ITEMS}
        defaultValue={status}
        disabled={isPending}
        onValueChange={(value) =>
          startTransition(() =>
            updateStatus(applicationId, value as (typeof PIPELINE_STATUSES)[number])
          )
        }
      >
        <SelectTrigger id="status" className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PIPELINE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
