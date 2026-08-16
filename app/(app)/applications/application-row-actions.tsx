"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateStatus, deleteApplication } from "./actions";
import { runFitReviewAction } from "../opportunities/actions";
import { PIPELINE_STATUSES } from "./[id]/status-changer";
import { RECOMMENDATION_LABEL } from "@/components/fit-score-badge";
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

  function handleRerun() {
    startTransition(() => {
      toast.promise(
        runFitReviewAction(applicationId).then((result) => {
          router.refresh();
          return result;
        }),
        {
          loading: `Re-running AI review for ${companyName}…`,
          success: (result) =>
            `Fit score updated: ${result.fitScore}% (${RECOMMENDATION_LABEL[result.recommendation] ?? result.recommendation})`,
          error: (err) => (err instanceof Error ? err.message : "Couldn't re-run the review"),
        }
      );
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
          <DropdownMenuItem
            disabled={isPending || !profileReady}
            onClick={handleRerun}
            title={
              !profileReady
                ? "Add skills to your Career Profile (upload/extract a CV) to enable this"
                : undefined
            }
          >
            <RefreshCwIcon className="size-3.5" />
            Re-run AI review
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
    </>
  );
}
