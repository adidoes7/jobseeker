import Link from "next/link";
import { and, eq, notInArray, inArray, gte, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  companies,
  timelineEvents,
  OPPORTUNITY_STATUSES,
  REJECTED_STATUSES,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatTile } from "./stat-tile";
import { HorizontalBarChart, type BarDatum } from "./horizontal-bar-chart";
import { AddOpportunityDialog } from "../opportunities/add-opportunity-dialog";

const INTERVIEWING_STATUSES = [
  "recruiter_screening",
  "first_interview",
  "interview_process",
  "assignment_case_study",
  "final_interview",
];

const SOURCE_LABEL: Record<string, string> = {
  linkedin: "LinkedIn",
  company_website: "Company site",
  referral: "Referral",
  indeed: "Indeed",
  recruiter: "Recruiter",
  other: "Other",
};

const CATEGORICAL_SLOTS = [
  "var(--viz-series-1)",
  "var(--viz-series-2)",
  "var(--viz-series-3)",
  "var(--viz-series-4)",
  "var(--viz-series-5)",
  "var(--viz-series-6)",
  "var(--viz-series-7)",
  "var(--viz-series-8)",
];

function formatSalary(min: number | null, max: number | null) {
  const fmt = (n: number) => n.toLocaleString();
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return "—";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const allApplications = await db.query.applications.findMany({
    where: and(
      eq(applications.userId, user.id),
      notInArray(applications.status, [...OPPORTUNITY_STATUSES])
    ),
    with: { company: true },
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const upcomingEventsRaw = await db
    .select({
      id: timelineEvents.id,
      applicationId: timelineEvents.applicationId,
      title: timelineEvents.title,
      eventType: timelineEvents.eventType,
      eventDate: timelineEvents.eventDate,
      createdAt: timelineEvents.createdAt,
      companyName: companies.name,
      applicationTitle: applications.title,
    })
    .from(timelineEvents)
    .innerJoin(applications, eq(timelineEvents.applicationId, applications.id))
    .innerJoin(companies, eq(applications.companyId, companies.id))
    .where(
      and(
        eq(applications.userId, user.id),
        inArray(timelineEvents.eventType, ["interview", "assignment"]),
        gte(timelineEvents.eventDate, startOfToday)
      )
    )
    .orderBy(asc(timelineEvents.eventDate));

  // One application can rack up several dated events if its status changed
  // more than once (e.g. rescheduled) — only the most recently *logged* one
  // is still relevant, so keep one row per application.
  const latestByApplication = new Map<string, (typeof upcomingEventsRaw)[number]>();
  for (const event of upcomingEventsRaw) {
    const existing = latestByApplication.get(event.applicationId);
    if (!existing || event.createdAt > existing.createdAt) {
      latestByApplication.set(event.applicationId, event);
    }
  }
  const upcomingEvents = [...latestByApplication.values()]
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
    .slice(0, 10);

  // ---- KPIs ----
  const total = allApplications.length;
  const responded = allApplications.filter((a) => a.status !== "applied").length;
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
  const scored = allApplications.filter((a) => a.fitScore !== null);
  const avgFitScore =
    scored.length > 0 ? Math.round(scored.reduce((sum, a) => sum + a.fitScore!, 0) / scored.length) : null;
  const offers = allApplications.filter((a) => a.status === "offer").length;

  // ---- Funnel: current-status proxy, since most historical rows only have
  // a final status rather than a full per-stage history. An application
  // rejected mid-interview shows up here as "Rejected," not counted toward
  // the interview stage it actually reached. ----
  const funnelData: BarDatum[] = [
    { label: "Applied", value: total },
    {
      label: "Screening+",
      value: allApplications.filter((a) => [...INTERVIEWING_STATUSES, "offer"].includes(a.status))
        .length,
    },
    {
      label: "Interview+",
      value: allApplications.filter((a) =>
        ["first_interview", "interview_process", "assignment_case_study", "final_interview", "offer"].includes(
          a.status
        )
      ).length,
    },
    {
      label: "Final stage+",
      value: allApplications.filter((a) => ["assignment_case_study", "final_interview", "offer"].includes(a.status))
        .length,
    },
    { label: "Offer", value: offers },
  ];

  // ---- Fit score vs outcome ----
  // Rejections get split by whether the recorded reason was actually about
  // fit at all — a location/visa-only rejection says nothing about whether
  // the fit score was right, and blending it into "Rejected" muddies the
  // one comparison this chart exists to make.
  const LOGISTICS_KEYWORDS = ["location", "work_authorization", "visa", "sponsorship"];
  const isLogisticsRejection = (a: (typeof allApplications)[number]) =>
    a.status === "rejected" &&
    LOGISTICS_KEYWORDS.some((kw) => (a.rejectionReasonCategory ?? "").toLowerCase().includes(kw));

  const OUTCOME_BUCKETS = [
    {
      label: "Offer",
      color: "var(--viz-good)",
      match: (a: (typeof allApplications)[number]) => a.status === "offer",
    },
    {
      label: "Interviewing",
      color: "var(--viz-warning)",
      match: (a: (typeof allApplications)[number]) => INTERVIEWING_STATUSES.includes(a.status),
    },
    {
      label: "Rejected (fit)",
      color: "var(--viz-critical)",
      match: (a: (typeof allApplications)[number]) =>
        (REJECTED_STATUSES as readonly string[]).includes(a.status) && !isLogisticsRejection(a),
    },
    {
      label: "Rejected (location/visa)",
      color: "var(--viz-muted)",
      match: isLogisticsRejection,
    },
    {
      label: "Applied (pending)",
      color: "var(--viz-series-1)",
      match: (a: (typeof allApplications)[number]) => a.status === "applied",
    },
  ];
  const fitByOutcome: BarDatum[] = OUTCOME_BUCKETS.map((bucket) => {
    const rows = scored.filter(bucket.match);
    const avg = rows.length > 0 ? Math.round(rows.reduce((s, a) => s + a.fitScore!, 0) / rows.length) : 0;
    return { label: `${bucket.label} (${rows.length})`, value: avg, displayValue: `${avg}%`, color: bucket.color };
  }).filter((_, i) => OUTCOME_BUCKETS[i] && scored.some(OUTCOME_BUCKETS[i].match));

  // ---- Response rate by source ----
  const responseBySource: BarDatum[] = Object.entries(SOURCE_LABEL)
    .map(([key, label]) => {
      const rows = allApplications.filter((a) => (a.source ?? "other") === key);
      const respondedRows = rows.filter((a) => a.status !== "applied").length;
      const rate = rows.length > 0 ? Math.round((respondedRows / rows.length) * 100) : 0;
      return { label: `${label} (${rows.length})`, value: rate, displayValue: `${rate}%` };
    })
    .filter((_, i) => allApplications.some((a) => (a.source ?? "other") === Object.keys(SOURCE_LABEL)[i]))
    .sort((a, b) => b.value - a.value);

  // ---- Rejection reasons ----
  const rejectedRows = allApplications.filter((a) => a.status === "rejected");
  const reasonCounts = new Map<string, number>();
  for (const r of rejectedRows) {
    const cat = (r.rejectionReasonCategory ?? "unspecified").replace(/_/g, " ");
    reasonCounts.set(cat, (reasonCounts.get(cat) ?? 0) + 1);
  }
  const rejectionData: BarDatum[] = [...reasonCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: CATEGORICAL_SLOTS[i % CATEGORICAL_SLOTS.length] }));

  // ---- Salary ranges, grouped by currency (mixed currencies aren't
  // meaningfully comparable on one axis, so this is a table, not a chart) ----
  const salaryRows = allApplications.filter((a) => a.salaryMin || a.salaryMax);
  const byCurrency = new Map<string, typeof salaryRows>();
  for (const r of salaryRows) {
    const cur = r.salaryCurrency ?? "—";
    if (!byCurrency.has(cur)) byCurrency.set(cur, []);
    byCurrency.get(cur)!.push(r);
  }
  const currencyGroups = [...byCurrency.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How your search is actually going, not just what&apos;s in the grid.
          </p>
        </div>
        <AddOpportunityDialog label="Check Opportunity" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Applications" value={String(total)} />
        <StatTile label="Response rate" value={`${responseRate}%`} sublabel={`${responded} of ${total}`} />
        <StatTile
          label="Avg. fit score"
          value={avgFitScore !== null ? `${avgFitScore}%` : "—"}
          sublabel={`${scored.length} scored`}
        />
        <StatTile label="Offers" value={String(offers)} />
        <StatTile label="Upcoming events" value={String(upcomingEvents.length)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
            <CardDescription>Upcoming interviews and assignments, soonest first.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled. Dates get added when you change an application to an interview or
                assignment stage.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {upcomingEvents.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/applications/${e.applicationId}`}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.companyName}</p>
                        <p className="truncate text-xs text-muted-foreground">{e.applicationTitle}</p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {new Date(e.eventDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline stage reached</CardTitle>
            <CardDescription>
              Based on current status — doesn&apos;t capture a stage passed before a later rejection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={funnelData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fit score vs. outcome</CardTitle>
            <CardDescription>
              Average AI fit score per group (each bar stands alone — these aren&apos;t shares of a
              whole, so they won&apos;t sum to 100%).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={fitByOutcome} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response rate by source</CardTitle>
            <CardDescription>Share of applications that got any reply, by channel.</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={responseBySource} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rejection reasons</CardTitle>
            <CardDescription>{rejectedRows.length} rejections with a recorded reason.</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={rejectionData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary ranges</CardTitle>
            <CardDescription>Grouped by currency — not converted, so ranges aren&apos;t directly comparable across groups.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {currencyGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No salary data recorded yet.</p>
            ) : (
              currencyGroups.map(([currency, rows]) => (
                <div key={currency}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">{currency}</p>
                  <ul className="flex flex-col gap-1">
                    {rows
                      .sort((a, b) => (b.salaryMin ?? 0) - (a.salaryMin ?? 0))
                      .map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                          <Link href={`/applications/${r.id}`} className="truncate hover:underline">
                            {r.company.name}
                          </Link>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {formatSalary(r.salaryMin, r.salaryMax)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
