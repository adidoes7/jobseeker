import Link from "next/link";
import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, OPPORTUNITY_STATUSES } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rows = await db.query.applications.findMany({
    where: and(
      eq(applications.userId, user.id),
      notInArray(applications.status, [...OPPORTUNITY_STATUSES])
    ),
    with: { company: true },
    orderBy: (applications, { desc }) => [desc(applications.appliedAt)],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jobs you&apos;ve applied to and their current status.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No applications yet. Mark an opportunity as applied to see it here.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Fit score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Source</TableHead>
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
                <TableCell>{app.fitScore !== null ? `${app.fitScore}%` : "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{app.status.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell>
                  {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="capitalize">{app.source?.replace(/_/g, " ")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
