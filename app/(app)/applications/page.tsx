import Link from "next/link";
import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  profiles,
  OPPORTUNITY_STATUSES,
  APPLIED_STATUSES,
  PROCEEDED_STATUSES,
  REJECTED_STATUSES,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatLocationShort } from "@/lib/format-location";
import { isProfileReadyForReview } from "@/lib/profile-readiness";
import { ApplicationRowActions } from "./application-row-actions";
import { FitScoreCell } from "./fit-score-cell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from "lucide-react";

const FILTERS = [
  { key: "all", label: "All", statuses: null },
  { key: "applied", label: "Applied", statuses: APPLIED_STATUSES as readonly string[] },
  { key: "proceeded", label: "Proceeded", statuses: PROCEEDED_STATUSES as readonly string[] },
  { key: "rejected", label: "Rejected", statuses: REJECTED_STATUSES as readonly string[] },
] as const;

const REMOTE_STATUS_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
  unknown: "—",
};

const SOURCE_LABEL: Record<string, string> = {
  linkedin: "LinkedIn",
  company_website: "Company site",
  referral: "Referral",
  indeed: "Indeed",
  recruiter: "Recruiter",
  other: "Other",
};

const STATUS_COLOR: Record<string, string> = {
  applied: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  recruiter_screening: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  first_interview: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  interview_process: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  assignment_case_study: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  final_interview: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  offer: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-destructive/15 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  ghosted: "bg-muted text-muted-foreground",
  abandoned: "bg-muted text-muted-foreground",
  position_closed: "bg-muted text-muted-foreground",
};

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return "—";
  const range = [min, max].filter((v): v is number => v !== null).join(" – ");
  return currency ? `${range} ${currency}` : range;
}

type SortKey = "company" | "role" | "salary" | "fitScore" | "applied";

type Application = Awaited<ReturnType<typeof loadApplications>>[number];

async function loadApplications(userId: string) {
  return db.query.applications.findMany({
    where: and(
      eq(applications.userId, userId),
      notInArray(applications.status, [...OPPORTUNITY_STATUSES])
    ),
    with: { company: true },
  });
}

function getSortColumns(): {
  key: SortKey;
  label: string;
  defaultDir: "asc" | "desc";
  value: (a: Application) => string | number | null;
}[] {
  return [
    { key: "company", label: "Company", defaultDir: "asc", value: (a) => a.company.name.toLowerCase() },
    { key: "role", label: "Role", defaultDir: "asc", value: (a) => a.title.toLowerCase() },
    { key: "salary", label: "Salary", defaultDir: "desc", value: (a) => a.salaryMax ?? a.salaryMin },
    { key: "fitScore", label: "Fit score", defaultDir: "desc", value: (a) => a.fitScore },
    {
      key: "applied",
      label: "Applied",
      defaultDir: "desc",
      value: (a) => (a.appliedAt ? new Date(a.appliedAt).getTime() : null),
    },
  ];
}

// Postgres doesn't guarantee row order without an ORDER BY, and it can shift
// a row's physical position on UPDATE — so ties on the sort column (e.g. many
// rows applied the same day, with no time component) need a deterministic
// tiebreaker or the list visibly reshuffles after an unrelated edit.
function tiebreak(a: Application, b: Application) {
  const byCompany = a.company.name.toLowerCase().localeCompare(b.company.name.toLowerCase());
  return byCompany !== 0 ? byCompany : a.id.localeCompare(b.id);
}

function sortApplications(rows: Application[], sort: SortKey | null, dir: "asc" | "desc") {
  if (!sort) return rows;
  const column = getSortColumns().find((c) => c.key === sort);
  if (!column) return rows;

  return [...rows].sort((a, b) => {
    const av = column.value(a);
    const bv = column.value(b);
    if (av === null && bv === null) return tiebreak(a, b);
    if (av === null) return 1;
    if (bv === null) return -1;
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return tiebreak(a, b);
  });
}

function SortableHeader({
  column,
  activeSort,
  activeDir,
  filter,
}: {
  column: ReturnType<typeof getSortColumns>[number];
  activeSort: SortKey | null;
  activeDir: "asc" | "desc";
  filter: string;
}) {
  const isActive = activeSort === column.key;
  const nextDir = isActive ? (activeDir === "asc" ? "desc" : "asc") : column.defaultDir;

  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  params.set("sort", column.key);
  params.set("dir", nextDir);

  return (
    <Link
      href={`/applications?${params.toString()}`}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {column.label}
      {isActive ? (
        activeDir === "asc" ? (
          <ArrowUpIcon className="size-3.5" />
        ) : (
          <ArrowDownIcon className="size-3.5" />
        )
      ) : (
        <ArrowUpDownIcon className="size-3.5 text-muted-foreground/50" />
      )}
    </Link>
  );
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; sort?: string; dir?: string }>;
}) {
  const {
    filter: activeFilter = "all",
    sort: sortParam,
    dir: dirParam,
  } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [allRows, profile] = await Promise.all([
    loadApplications(user.id),
    db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) }),
  ]);
  const profileReady = isProfileReadyForReview(profile);

  const activeStatuses = FILTERS.find((f) => f.key === activeFilter)?.statuses ?? null;
  const filteredRows = activeStatuses
    ? allRows.filter((r) => activeStatuses.includes(r.status))
    : allRows;

  const sortColumns = getSortColumns();
  const sortColumnsByKey = Object.fromEntries(sortColumns.map((c) => [c.key, c])) as Record<
    SortKey,
    (typeof sortColumns)[number]
  >;
  const activeSort = sortColumns.find((c) => c.key === sortParam)?.key ?? null;
  const activeDir: "asc" | "desc" = dirParam === "asc" || dirParam === "desc" ? dirParam : "desc";
  // Defaults to newest-applied-first when no explicit sort is chosen.
  const rows = sortApplications(filteredRows, activeSort ?? "applied", activeDir);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jobs you&apos;ve applied to and their current status.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b">
        {FILTERS.map((f) => {
          const count = f.statuses
            ? allRows.filter((r) => f.statuses.includes(r.status)).length
            : allRows.length;
          const isActive = activeFilter === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/applications" : `/applications?filter=${f.key}`}
              className={cn(
                "border-b-2 px-3 py-2 text-sm transition-colors",
                isActive
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label} <span className="text-xs text-muted-foreground">({count})</span>
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {allRows.length === 0
            ? "No applications yet. Mark an opportunity as applied to see it here."
            : "No applications match this filter."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[14%] px-3">
                  <SortableHeader
                    column={sortColumnsByKey.company}
                    activeSort={activeSort}
                    activeDir={activeDir}
                    filter={activeFilter}
                  />
                </TableHead>
                <TableHead className="w-[15%] px-3">
                  <SortableHeader
                    column={sortColumnsByKey.role}
                    activeSort={activeSort}
                    activeDir={activeDir}
                    filter={activeFilter}
                  />
                </TableHead>
                <TableHead className="w-[10%] px-3">Location</TableHead>
                <TableHead className="w-[7%] px-3">Work type</TableHead>
                <TableHead className="w-[9%] px-3">Employment</TableHead>
                <TableHead className="w-[8%] px-3">Source</TableHead>
                <TableHead className="w-[10%] px-3">
                  <SortableHeader
                    column={sortColumnsByKey.salary}
                    activeSort={activeSort}
                    activeDir={activeDir}
                    filter={activeFilter}
                  />
                </TableHead>
                <TableHead className="w-[7%] px-3">
                  <SortableHeader
                    column={sortColumnsByKey.fitScore}
                    activeSort={activeSort}
                    activeDir={activeDir}
                    filter={activeFilter}
                  />
                </TableHead>
                <TableHead className="w-[8%] px-3">Status</TableHead>
                <TableHead className="w-[8%] px-3">
                  <SortableHeader
                    column={sortColumnsByKey.applied}
                    activeSort={activeSort}
                    activeDir={activeDir}
                    filter={activeFilter}
                  />
                </TableHead>
                <TableHead className="w-[4%] px-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((app) => (
                <TableRow key={app.id} className="h-16">
                  <TableCell className="truncate px-3 py-3 font-medium" title={app.company.name}>
                    <Link href={`/applications/${app.id}`} className="hover:underline">
                      {app.company.name}
                    </Link>
                  </TableCell>
                  <TableCell className="truncate px-3 py-3" title={app.title}>
                    {app.title}
                  </TableCell>
                  <TableCell
                    className="truncate px-3 py-3 text-muted-foreground"
                    title={app.location ?? undefined}
                  >
                    {formatLocationShort(app.location)}
                  </TableCell>
                  <TableCell
                    className="truncate px-3 py-3 text-muted-foreground"
                    title={REMOTE_STATUS_LABEL[app.remoteStatus ?? "unknown"]}
                  >
                    {REMOTE_STATUS_LABEL[app.remoteStatus ?? "unknown"]}
                  </TableCell>
                  <TableCell
                    className="truncate px-3 py-3 text-muted-foreground"
                    title={app.employmentType ?? undefined}
                  >
                    {app.employmentType ?? "—"}
                  </TableCell>
                  <TableCell
                    className="truncate px-3 py-3 text-muted-foreground"
                    title={app.sourceDetail ?? undefined}
                  >
                    {app.sourceDetail ?? SOURCE_LABEL[app.source ?? "other"]}
                  </TableCell>
                  <TableCell
                    className="truncate px-3 py-3 text-muted-foreground"
                    title={formatSalary(app.salaryMin, app.salaryMax, app.salaryCurrency)}
                  >
                    {formatSalary(app.salaryMin, app.salaryMax, app.salaryCurrency)}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <FitScoreCell
                      applicationId={app.id}
                      companyName={app.company.name}
                      fitScore={app.fitScore}
                      fitRecommendation={app.fitRecommendation}
                      profileReady={profileReady}
                    />
                  </TableCell>
                  <TableCell className="truncate px-3 py-3" title={app.status.replace(/_/g, " ")}>
                    <Badge
                      variant="secondary"
                      className={cn(STATUS_COLOR[app.status] ?? "")}
                    >
                      {app.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="truncate px-3 py-3"
                    title={app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : undefined}
                  >
                    {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <ApplicationRowActions
                      applicationId={app.id}
                      companyName={app.company.name}
                      status={app.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
