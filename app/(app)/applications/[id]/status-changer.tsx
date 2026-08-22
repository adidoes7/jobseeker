"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStatusChangeWithDate } from "../use-status-change";
import { StatusDateDialog } from "../status-date-dialog";

export const PIPELINE_STATUSES = [
  "applied",
  "recruiter_screening",
  "hr_interview",
  "first_interview",
  "technical_interview",
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
  const [localStatus, setLocalStatus] = useState(status);
  const { requestChange, pendingStatus, confirmDate, cancel, isPending } = useStatusChangeWithDate(
    applicationId,
    (newStatus) => setLocalStatus(newStatus)
  );

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="status">Status</Label>
      <Select
        items={STATUS_ITEMS}
        value={localStatus}
        disabled={isPending}
        onValueChange={(value) => {
          if (!value) return;
          setLocalStatus(value);
          requestChange(value);
        }}
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

      <StatusDateDialog
        status={pendingStatus}
        isPending={isPending}
        onConfirm={confirmDate}
        onCancel={() => {
          cancel();
          setLocalStatus(status);
        }}
      />
    </div>
  );
}
