import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, OPPORTUNITY_STATUSES } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SkipButton } from "./skip-button";

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const opportunities = await db.query.applications.findMany({
    where: and(
      eq(applications.userId, user.id),
      inArray(applications.status, [...OPPORTUNITY_STATUSES])
    ),
    with: { company: true },
    orderBy: (applications, { desc }) => [desc(applications.createdAt)],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Opportunities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jobs you&apos;ve discovered and are considering.
          </p>
        </div>
        <Button render={<Link href="/opportunities/new" />} nativeButton={false}>
          Add Opportunity
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No opportunities yet. Add one to get an AI fit review.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Fit score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium">
                  <Link href={`/opportunities/${opp.id}`} className="hover:underline">
                    {opp.company.name}
                  </Link>
                </TableCell>
                <TableCell>{opp.title}</TableCell>
                <TableCell>
                  {opp.fitScore !== null ? `${opp.fitScore}%` : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{opp.status.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {opp.status !== "skipped" && <SkipButton id={opp.id} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
