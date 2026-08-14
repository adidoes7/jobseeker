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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
            {cvs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No CVs uploaded yet.</p>
            ) : (
              <Select
                name="cvId"
                defaultValue={defaultCvId}
                items={Object.fromEntries(cvs.map((cv) => [cv.id, cv.name]))}
              >
                <SelectTrigger id="cvId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cvs.map((cv) => (
                    <SelectItem key={cv.id} value={cv.id}>
                      {cv.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
