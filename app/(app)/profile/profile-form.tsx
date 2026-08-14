"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCaseStudies } from "@/lib/validation/parse";

type ProfileFormProps = {
  profile: {
    fullName: string | null;
    currentRole: string | null;
    yearsExperience: number | null;
    location: string | null;
    preferredLocations: string[];
    workPreference: "remote" | "hybrid" | "onsite" | "flexible" | null;
    workAuthorization: string | null;
    salaryExpectationMin: number | null;
    salaryExpectationMax: number | null;
    salaryCurrency: string | null;
    targetRoles: string[];
    targetSeniority: string | null;
    preferredIndustries: string[];
    preferredCompanyTypes: string[];
    preferredCompanySizes: string[];
    avoidRolesIndustries: string | null;
    portfolioUrl: string | null;
    portfolioCaseStudies: { label: string; url: string }[];
    linkedinUrl: string | null;
    skills: string[];
    experienceSummary: string | null;
  };
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.success && (
        <Alert>
          <AlertDescription>Profile saved.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Used as context for AI job reviews and generated materials.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" name="fullName" defaultValue={profile.fullName} />
          <Field label="Current role" name="currentRole" defaultValue={profile.currentRole} />
          <Field
            label="Years of experience"
            name="yearsExperience"
            type="number"
            defaultValue={profile.yearsExperience?.toString() ?? ""}
          />
          <Field label="Location" name="location" defaultValue={profile.location} />
          <Field
            label="Preferred working locations"
            name="preferredLocations"
            defaultValue={profile.preferredLocations.join(", ")}
            hint="Comma-separated"
            className="sm:col-span-2"
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workPreference">Remote / hybrid / onsite</Label>
            <select
              id="workPreference"
              name="workPreference"
              defaultValue={profile.workPreference ?? ""}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Not set</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          <Field
            label="Work authorization"
            name="workAuthorization"
            defaultValue={profile.workAuthorization}
          />
          <Field
            label="Salary expectation min"
            name="salaryExpectationMin"
            type="number"
            defaultValue={profile.salaryExpectationMin?.toString() ?? ""}
          />
          <Field
            label="Salary expectation max"
            name="salaryExpectationMax"
            type="number"
            defaultValue={profile.salaryExpectationMax?.toString() ?? ""}
          />
          <Field
            label="Salary currency"
            name="salaryCurrency"
            defaultValue={profile.salaryCurrency ?? "USD"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Career Goals</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Target roles"
            name="targetRoles"
            defaultValue={profile.targetRoles.join(", ")}
            hint="Comma-separated"
          />
          <Field
            label="Target seniority"
            name="targetSeniority"
            defaultValue={profile.targetSeniority}
          />
          <Field
            label="Preferred industries"
            name="preferredIndustries"
            defaultValue={profile.preferredIndustries.join(", ")}
            hint="Comma-separated"
          />
          <Field
            label="Preferred company types"
            name="preferredCompanyTypes"
            defaultValue={profile.preferredCompanyTypes.join(", ")}
            hint="Comma-separated"
          />
          <Field
            label="Preferred company sizes"
            name="preferredCompanySizes"
            defaultValue={profile.preferredCompanySizes.join(", ")}
            hint="Comma-separated"
          />
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="avoidRolesIndustries">Roles or industries to avoid</Label>
            <Textarea
              id="avoidRolesIndustries"
              name="avoidRolesIndustries"
              defaultValue={profile.avoidRolesIndustries ?? ""}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional Materials</CardTitle>
          <CardDescription>Portfolio and LinkedIn — CVs are managed below.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Portfolio URL" name="portfolioUrl" defaultValue={profile.portfolioUrl} />
          <Field label="LinkedIn URL" name="linkedinUrl" defaultValue={profile.linkedinUrl} />
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="portfolioCaseStudies">Case studies</Label>
            <Textarea
              id="portfolioCaseStudies"
              name="portfolioCaseStudies"
              defaultValue={formatCaseStudies(profile.portfolioCaseStudies)}
              rows={3}
              placeholder={"Label | https://example.com/case-study"}
            />
            <p className="text-xs text-muted-foreground">One per line, formatted as: Label | URL</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills & Experience</CardTitle>
          <CardDescription>
            Extracted from your CV — review and edit before saving.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field
            label="Skills"
            name="skills"
            defaultValue={profile.skills.join(", ")}
            hint="Comma-separated"
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="experienceSummary">Experience summary</Label>
            <Textarea
              id="experienceSummary"
              name="experienceSummary"
              defaultValue={profile.experienceSummary ?? ""}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
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
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
