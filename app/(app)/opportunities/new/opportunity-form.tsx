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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExtractedJob } from "@/lib/ai/schemas";

const REMOTE_STATUS_ITEMS = {
  unknown: "Unknown",
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

const SOURCE_ITEMS = {
  linkedin: "LinkedIn",
  company_website: "Company website",
  referral: "Referral",
  indeed: "Indeed",
  recruiter: "Recruiter",
  other: "Other",
};

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
            <Select
              name="remoteStatus"
              defaultValue={draft?.remoteStatus ?? "unknown"}
              items={REMOTE_STATUS_ITEMS}
            >
              <SelectTrigger id="remoteStatus" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">Onsite</SelectItem>
              </SelectContent>
            </Select>
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
            <Select name="source" defaultValue={draft?.source ?? "other"} items={SOURCE_ITEMS}>
              <SelectTrigger id="source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="company_website">Company website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
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
