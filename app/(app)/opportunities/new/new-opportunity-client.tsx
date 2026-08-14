"use client";

import { useState, useTransition } from "react";
import { extractJobFromUrl } from "../actions";
import { OpportunityForm } from "./opportunity-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ExtractedJob } from "@/lib/ai/schemas";

const FAILURE_MESSAGES: Record<string, string> = {
  fetch_failed: "Couldn't fetch that page. Check the URL, or enter the details manually below.",
  insufficient_content:
    "This page didn't return enough readable text to extract from (common on JavaScript-heavy sites like LinkedIn). Enter the details manually below.",
  extraction_failed: "The AI couldn't extract structured data from this page. Enter the details manually below.",
};

export function NewOpportunityClient() {
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<ExtractedJob | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExtract() {
    if (!url.trim()) return;
    setMessage(null);
    startTransition(async () => {
      const result = await extractJobFromUrl(url.trim());
      if (result.ok) {
        setDraft(result.data);
      } else {
        setDraft(null);
        setMessage(FAILURE_MESSAGES[result.reason] ?? "Extraction failed.");
      }
      setShowForm(true);
    });
  }

  if (showForm) {
    return <OpportunityForm draft={draft} jobUrl={url} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add an opportunity</CardTitle>
        <CardDescription>Paste a job posting URL and we&apos;ll extract the details.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job-url">Job URL</Label>
          <div className="flex gap-2">
            <Input
              id="job-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://company.com/careers/job-id"
            />
            <Button type="button" onClick={handleExtract} disabled={isPending || !url.trim()}>
              {isPending ? "Extracting…" : "Extract"}
            </Button>
          </div>
        </div>
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            Or enter details manually
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
