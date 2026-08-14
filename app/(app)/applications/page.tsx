import Link from "next/link";
import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  OPPORTUNITY_STATUSES,
  APPLIED_STATUSES,
  PROCEEDED_STATUSES,
  REJECTED_STATUSES,
} from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return "—";
  const range = [min, max].filter((v): v is number => v !== null).join(" – ");
  return currency ? `${range} ${currency}` : range;
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: activeFilter = "all" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const allRows = await db.query.applications.findMany({
    where: and(
      eq(applications.userId, user.id),
      notInArray(applications.status, [...OPPORTUNITY_STATUSES])
    ),
    with: { company: true },
    orderBy: (applications, { desc }) => [desc(applications.appliedAt)],
  });

  const activeStatuses = FILTERS.find((f) => f.key === activeFilter)?.statuses ?? null;
  const rows = activeStatuses ? allRows.filter((r) => activeStatuses.includes(r.status)) : allRows;

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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Work type</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Fit score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    <Link href={`/applications/${app.id}`} className="hover:underline">
                      {app.company.name}
                    </Link>
                  </TableCell>
                  <TableCell>{app.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.location ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {REMOTE_STATUS_LABEL[app.remoteStatus ?? "unknown"]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatSalary(app.salaryMin, app.salaryMax, app.salaryCurrency)}
                  </TableCell>
                  <TableCell>{app.fitScore !== null ? `${app.fitScore}%` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{app.status.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
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
