"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStatus, deleteApplication } from "./actions";
import { runFitReviewAction } from "../opportunities/actions";
import { PIPELINE_STATUSES } from "./[id]/status-changer";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MoreHorizontalIcon, CheckIcon, RefreshCwIcon } from "lucide-react";

export function ApplicationRowActions({
  applicationId,
  companyName,
  status,
  profileReady,
}: {
  applicationId: string;
  companyName: string;
  status: string;
  profileReady: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);

  function handleRerun() {
    setRerunError(null);
    startTransition(async () => {
      try {
        await runFitReviewAction(applicationId);
        router.refresh();
      } catch (err) {
        setRerunError(err instanceof Error ? err.message : "Couldn't re-run the review");
      }
    });
  }

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
          {profileReady && (
            <DropdownMenuItem disabled={isPending} onClick={handleRerun}>
              <RefreshCwIcon className="size-3.5" />
              Re-run AI review
            </DropdownMenuItem>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {PIPELINE_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  disabled={isPending || s === status}
                  onClick={() => startTransition(() => updateStatus(applicationId, s))}
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
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await deleteApplication(applicationId);
                  setConfirmOpen(false);
                })
              }
            >
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rerunError !== null} onOpenChange={(open) => !open && setRerunError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Couldn&apos;t re-run the review</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>{rerunError}</AlertDescription>
          </Alert>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRerunError(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
