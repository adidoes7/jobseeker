"use client";

import { useState, useTransition } from "react";
import { deleteApplication } from "./actions";
import { PIPELINE_STATUSES } from "./[id]/status-changer";
import { useStatusChangeWithDate } from "./use-status-change";
import { StatusDateDialog } from "./status-date-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontalIcon, CheckIcon } from "lucide-react";

export function ApplicationRowActions({
  applicationId,
  companyName,
  status,
}: {
  applicationId: string;
  companyName: string;
  status: string;
}) {
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    requestChange,
    pendingStatus,
    confirmDate,
    cancel,
    isPending: isStatusPending,
  } = useStatusChangeWithDate(applicationId);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontalIcon className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {PIPELINE_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  disabled={isStatusPending || s === status}
                  onClick={() => requestChange(s)}
                >
                  {s === status && <CheckIcon className="size-3.5" />}
                  {s.replace(/_/g, " ")}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            Delete application
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <StatusDateDialog
        status={pendingStatus}
        isPending={isStatusPending}
        onConfirm={confirmDate}
        onCancel={cancel}
      />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this application?</DialogTitle>
            <DialogDescription>
              This permanently removes your application to {companyName}, including its timeline
              and AI review. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletePending}
              onClick={() =>
                startDeleteTransition(async () => {
                  await deleteApplication(applicationId);
                  setConfirmOpen(false);
                })
              }
            >
              {isDeletePending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
