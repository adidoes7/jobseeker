"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatLocationShort } from "@/lib/format-location";
import { FitScoreCell } from "./fit-score-cell";
import { ApplicationRowActions } from "./application-row-actions";
import { REMOTE_STATUS_LABEL, SOURCE_LABEL, STATUS_COLOR, formatSalary } from "./format-helpers";
import { ChevronDownIcon } from "lucide-react";

type MobileApplication = {
  id: string;
  title: string;
  location: string | null;
  remoteStatus: string | null;
  employmentType: string | null;
  source: string | null;
  sourceDetail: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  fitScore: number | null;
  fitRecommendation: string | null;
  status: string;
  appliedAt: string | Date | null;
  company: { name: string };
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export function MobileApplicationCard({
  app,
  profileReady,
}: {
  app: MobileApplication;
  profileReady: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 truncate font-medium">{app.company.name}</span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary" className={cn(STATUS_COLOR[app.status] ?? "")}>
            {app.status.replace(/_/g, " ")}
          </Badge>
          <ChevronDownIcon
            className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
          />
        </span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 border-t px-4 py-3">
          <Field label="Role">
            <Link href={`/applications/${app.id}`} className="hover:underline">
              {app.title}
            </Link>
          </Field>
          <Field label="Location">{formatLocationShort(app.location)}</Field>
          <Field label="Work type">{REMOTE_STATUS_LABEL[app.remoteStatus ?? "unknown"]}</Field>
          <Field label="Employment">{app.employmentType ?? "—"}</Field>
          <Field label="Source">{app.sourceDetail ?? SOURCE_LABEL[app.source ?? "other"]}</Field>
          <Field label="Salary">{formatSalary(app.salaryMin, app.salaryMax, app.salaryCurrency)}</Field>
          <Field label="Applied">
            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
          </Field>

          <div className="mt-1 flex items-center justify-between gap-3 border-t pt-3">
            <FitScoreCell
              applicationId={app.id}
              companyName={app.company.name}
              fitScore={app.fitScore}
              fitRecommendation={app.fitRecommendation}
              profileReady={profileReady}
            />
            <ApplicationRowActions
              applicationId={app.id}
              companyName={app.company.name}
              status={app.status}
            />
          </div>
        </div>
      )}
    </div>
  );
}
