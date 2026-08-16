import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { applications, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FitScoreBadge } from "@/components/fit-score-badge";
import { RequirementMatrix } from "@/components/requirement-matrix";
import { RerunReviewButton } from "@/components/rerun-review-button";
import { isProfileReadyForReview } from "@/lib/profile-readiness";
import { StatusChanger } from "./status-changer";
import { Timeline } from "./timeline";

function formatFitLabel(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

function formatEstimate(estimate: Record<string, unknown> | null) {
  if (!estimate) return null;
  const min = typeof estimate.min === "number" ? estimate.min : null;
  const max = typeof estimate.max === "number" ? estimate.max : null;
  const currency = typeof estimate.currency === "string" ? estimate.currency : "";
  const period = typeof estimate.period === "string" ? `/${estimate.period}` : "";
  const source = typeof estimate.source === "string" ? estimate.source : null;
  if (min === null && max === null) return null;
  const range = [min, max].filter((v): v is number => v !== null).join(" – ");
  return `${range} ${currency}${period}${source ? ` (${source})` : ""}`.trim();
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [application, profile] = await Promise.all([
    db.query.applications.findFirst({
      where: and(eq(applications.id, id), eq(applications.userId, user.id)),
      with: { company: true, cv: true, timelineEvents: true },
    }),
    db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) }),
  ]);
  if (!application) notFound();

  const review = application.fitReview;
  const profileReady = isProfileReadyForReview(profile);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">{application.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {application.company.name}
            {application.location && ` · ${application.location}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{application.status.replace(/_/g, " ")}</Badge>
            {application.employmentType && (
              <span className="text-sm text-muted-foreground">{application.employmentType}</span>
            )}
            {application.appliedAt && (
              <span className="text-sm text-muted-foreground">
                Applied {new Date(application.appliedAt).toLocaleDateString()}
              </span>
            )}
            {(application.sourceDetail || application.source) && (
              <span className="text-sm text-muted-foreground">
                via {application.sourceDetail ?? application.source}
              </span>
            )}
            {application.jobUrl && (
              <Link
                href={application.jobUrl}
                target="_blank"
                className="text-sm text-muted-foreground hover:underline"
              >
                View job posting
              </Link>
            )}
          </div>
        </div>
        <StatusChanger applicationId={application.id} status={application.status} />
      </div>

      {application.status === "rejected" && application.rejectionReason && (
        <Alert variant="destructive">
          <AlertDescription>
            <span className="font-medium">
              Rejected
              {application.rejectionDate &&
                ` on ${new Date(application.rejectionDate).toLocaleDateString()}`}
              :
            </span>{" "}
            {application.rejectionReason}
            {application.rejectionReasonCategory && (
              <span className="text-xs">
                {" "}
                ({application.rejectionReasonCategory.replace(/_/g, " ")})
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FitScoreBadge
              fitScore={application.fitScore}
              recommendation={application.fitRecommendation}
            />
            <RerunReviewButton applicationId={application.id} profileReady={profileReady} />
          </div>
          {application.fitSummary && <p>{application.fitSummary}</p>}
          {review && <RequirementMatrix rows={review.requirementMatrix} />}
          {(application.salaryMin || application.salaryMax) && (
            <p>
              <span className="font-medium">Salary: </span>
              {[application.salaryMin, application.salaryMax].filter(Boolean).join(" – ")}{" "}
              {application.salaryCurrency}
            </p>
          )}
          {application.description && (
            <div>
              <p className="font-medium">Description</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {application.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {(application.fitBreakdown ||
        application.compensationDetail ||
        (application.importNotes?.length ?? 0) > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Imported Assessment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {application.fitBreakdown && (
              <div>
                <p className="font-medium">Fit breakdown</p>
                <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
                  {Object.entries(application.fitBreakdown)
                    .filter(([, v]) => v !== null)
                    .map(([key, value]) => (
                      <span key={key}>
                        <span className="text-foreground">{formatFitLabel(key)}:</span> {value}/10
                      </span>
                    ))}
                </div>
              </div>
            )}

            {application.compensationDetail && (
              <div>
                <p className="font-medium">Compensation</p>
                <div className="mt-1.5 flex flex-col gap-1 text-muted-foreground">
                  {application.compensationDetail.text && <p>{application.compensationDetail.text}</p>}
                  <p className="text-xs">
                    {application.compensationDetail.employerPublished === true
                      ? "Employer-published"
                      : application.compensationDetail.employerPublished === false
                        ? "Not disclosed by employer"
                        : null}
                    {application.compensationDetail.grossNet &&
                      application.compensationDetail.grossNet !== "unspecified" &&
                      ` · ${application.compensationDetail.grossNet}`}
                    {application.compensationDetail.equity && " · equity"}
                    {application.compensationDetail.bonus && ` · ${application.compensationDetail.bonus}`}
                  </p>
                  {formatEstimate(application.compensationDetail.candidateExpectation) && (
                    <p className="text-xs">
                      Your stated expectation:{" "}
                      {formatEstimate(application.compensationDetail.candidateExpectation)}
                    </p>
                  )}
                  {formatEstimate(application.compensationDetail.thirdPartyEstimate) && (
                    <p className="text-xs">
                      Third-party estimate: {formatEstimate(application.compensationDetail.thirdPartyEstimate)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {(application.importNotes?.length ?? 0) > 0 && (
              <div>
                <p className="font-medium">Notes</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-muted-foreground">
                  {application.importNotes!.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Application Materials</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="font-medium">CV used: </span>
            {application.cv?.name ?? "—"}
          </p>
          {application.coverLetter && (
            <div>
              <p className="font-medium">Cover letter</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {application.coverLetter}
              </p>
            </div>
          )}
          {application.notes && (
            <div>
              <p className="font-medium">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{application.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline applicationId={application.id} events={application.timelineEvents} />
        </CardContent>
      </Card>
    </div>
  );
}
