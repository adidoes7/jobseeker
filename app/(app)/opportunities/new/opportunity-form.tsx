"use client";

import { useActionState } from "react";
import { saveOpportunity, type SaveOpportunityState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ExtractedJob } from "@/lib/ai/schemas";

export function OpportunityForm({ draft, jobUrl }: { draft: ExtractedJob | null; jobUrl: string }) {
  const [state, action, pending] = useActionState<SaveOpportunityState, FormData>(
    saveOpportunity,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" name="jobUrl" value={jobUrl} />

      <Card>
        <CardHeader>
          <CardTitle>Job details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company" name="company" defaultValue={draft?.company} required />
          <Field label="Job title" name="title" defaultValue={draft?.title} required />
          <Field label="Location" name="location" defaultValue={draft?.location} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="remoteStatus">Remote status</Label>
            <select
              id="remoteStatus"
              name="remoteStatus"
              defaultValue={draft?.remoteStatus ?? "unknown"}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="unknown">Unknown</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </div>
          <Field
            label="Salary min"
            name="salaryMin"
            type="number"
            defaultValue={draft?.salaryMin?.toString()}
          />
          <Field
            label="Salary max"
            name="salaryMax"
            type="number"
            defaultValue={draft?.salaryMax?.toString()}
          />
          <Field label="Salary currency" name="salaryCurrency" defaultValue={draft?.salaryCurrency} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="source">Source</Label>
            <select
              id="source"
              name="source"
              defaultValue={draft?.source ?? "other"}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="linkedin">LinkedIn</option>
              <option value="company_website">Company website</option>
              <option value="referral">Referral</option>
              <option value="indeed">Indeed</option>
              <option value="recruiter">Recruiter</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Field label="Application URL" name="applicationUrl" defaultValue={draft?.applicationUrl} />

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="description">Job description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={draft?.description ?? ""}
              rows={5}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="responsibilities">Responsibilities</Label>
            <Textarea
              id="responsibilities"
              name="responsibilities"
              defaultValue={draft?.responsibilities.join("\n") ?? ""}
              rows={4}
              placeholder="One per line"
            />
          </div>
          <Field
            label="Required skills"
            name="requiredSkills"
            defaultValue={draft?.requiredSkills.join(", ")}
            hint="Comma-separated"
          />
          <Field
            label="Preferred skills"
            name="preferredSkills"
            defaultValue={draft?.preferredSkills.join(", ")}
            hint="Comma-separated"
          />
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="experienceRequirements">Experience requirements</Label>
            <Textarea
              id="experienceRequirements"
              name="experienceRequirements"
              defaultValue={draft?.experienceRequirements ?? ""}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save opportunity"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
