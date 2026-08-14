import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { applications, cvs } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FitScoreBadge } from "@/components/fit-score-badge";
import { RequirementMatrix } from "@/components/requirement-matrix";
import { ReviewTrigger } from "./review-trigger";
import { MarkAsAppliedButton } from "./mark-as-applied-button";

export default async function OpportunityDetailPage({
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

  const [application, userCvs] = await Promise.all([
    db.query.applications.findFirst({
      where: and(eq(applications.id, id), eq(applications.userId, user.id)),
      with: { company: true, cv: true },
    }),
    db.query.cvs.findMany({ where: eq(cvs.userId, user.id) }),
  ]);
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
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary">{application.status.replace(/_/g, " ")}</Badge>
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
        <MarkAsAppliedButton
          applicationId={application.id}
          cvs={userCvs.map((cv) => ({ id: cv.id, name: cv.name, isDefault: cv.isDefault }))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Job Review</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!application.fitReviewedAt && <ReviewTrigger applicationId={application.id} />}

          {application.fitReviewedAt && (
            <>
              <FitScoreBadge
                fitScore={application.fitScore}
                recommendation={application.fitRecommendation}
              />
              {application.fitSummary && <p className="text-sm">{application.fitSummary}</p>}

              {review && (
                <>
                  <MatchList title="Strong matches" items={review.strongMatches} />
                  <MatchList title="Partial matches" items={review.partialMatches} />
                  <MatchList title="Gaps" items={review.gaps} />
                  <MatchList title="Unknown" items={review.unknown} />
                  <RequirementMatrix rows={review.requirementMatrix} />
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
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
          {(application.requiredSkills?.length ?? 0) > 0 && (
            <div>
              <p className="font-medium">Required skills</p>
              <p className="mt-1 text-muted-foreground">
                {application.requiredSkills!.join(", ")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MatchList({
  title,
  items,
}: {
  title: string;
  items: { requirement: string; evidence: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>
            <span className="text-foreground">{item.requirement}</span> — {item.evidence}
          </li>
        ))}
      </ul>
    </div>
  );
}
