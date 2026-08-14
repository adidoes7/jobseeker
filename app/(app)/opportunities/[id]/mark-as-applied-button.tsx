"use client";

import { useState } from "react";
import { markAsApplied } from "../../applications/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Cv = { id: string; name: string; isDefault: boolean };

export function MarkAsAppliedButton({
  applicationId,
  cvs = [],
}: {
  applicationId: string;
  cvs?: Cv[];
}) {
  const [open, setOpen] = useState(false);
  const defaultCvId = cvs.find((cv) => cv.isDefault)?.id ?? cvs[0]?.id ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Mark as Applied</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as Applied</DialogTitle>
          <DialogDescription>
            This moves the opportunity into your Applications pipeline.
          </DialogDescription>
        </DialogHeader>
        <form action={markAsApplied.bind(null, applicationId)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cvId">CV used</Label>
            <select
              id="cvId"
              name="cvId"
              defaultValue={defaultCvId}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {cvs.length === 0 && <option value="">No CVs uploaded</option>}
              {cvs.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coverLetter">Cover letter (optional)</Label>
            <Textarea id="coverLetter" name="coverLetter" rows={4} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit">Confirm</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
