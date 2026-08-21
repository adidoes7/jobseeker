"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NewOpportunityClient } from "./new/new-opportunity-client";

export function AddOpportunityDialog({ label = "Add Opportunity" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <DialogContent className="max-h-[85vh] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-2xl lg:max-w-4xl">
        <DialogTitle className="sr-only">Add an opportunity</DialogTitle>
        <NewOpportunityClient />
      </DialogContent>
    </Dialog>
  );
}
