import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FitScoreBadge } from "@/components/fit-score-badge";
import { RequirementMatrix } from "@/components/requirement-matrix";
import { StatusChanger } from "./status-changer";
import { Timeline } from "./timeline";

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

  const application = await db.query.applications.findFirst({
    where: and(eq(applications.id, id), eq(applications.userId, user.id)),
    with: { company: true, cv: true, timelineEvents: true },
  });
  if (!application) notFound();

  const review = application.fitReview;

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
            {application.appliedAt && (
              <span className="text-sm text-muted-foreground">
                Applied {new Date(application.appliedAt).toLocaleDateString()}
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

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <FitScoreBadge
            fitScore={application.fitScore}
            recommendation={application.fitRecommendation}
          />
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
