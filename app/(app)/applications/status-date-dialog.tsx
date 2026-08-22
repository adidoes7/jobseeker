"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STATUS_LABEL: Record<string, string> = {
  recruiter_screening: "Recruiter screening",
  hr_interview: "HR interview",
  first_interview: "First interview",
  technical_interview: "Technical interview",
  interview_process: "Interview",
  assignment_case_study: "Assignment / case study",
  final_interview: "Final interview",
};

function todayLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function StatusDateDialog({
  status,
  isPending,
  onConfirm,
  onCancel,
}: {
  status: string | null;
  isPending: boolean;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}) {
  const [dateValue, setDateValue] = useState(todayLocal());

  return (
    <Dialog
      open={status !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>When is the {status ? (STATUS_LABEL[status] ?? status) : ""}?</DialogTitle>
          <DialogDescription>
            This date shows up in the application timeline and on the dashboard&apos;s upcoming
            events.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-date">Date</Label>
          <Input
            id="event-date"
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending || !dateValue}
            onClick={() => onConfirm(new Date(`${dateValue}T00:00:00`))}
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
