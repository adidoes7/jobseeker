/**
 * One-off importer for a JSON export of externally-tracked job applications
 * (e.g. a manually-kept spreadsheet). Upserts by (user, company name, role
 * title) so re-running is safe — existing rows are updated, not duplicated.
 *
 * Usage: npx tsx scripts/import-applications.ts <path-to-json> <user-email>
 */
import { readFileSync } from "fs";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql, and, eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";

config({ path: ".env.local" });

const { applications, companies } = schema;

type ImportJob = {
  company: string;
  role: string;
  status: "applied" | "rejected" | "skipped" | "abandoned";
  appliedDate?: string;
  reviewedDate?: string;
  rejectionDate?: string;
  rejectionReasonCategory?: string;
  rejectionReason?: string;
  location: string | null;
  workMode: string | null;
  employmentType: string | null;
  fit: Record<string, number | null>;
  compensation: {
    employerPublished: boolean | null;
    min: number | null;
    max: number | null;
    currency: string | null;
    period: string | null;
    grossNet: string | null;
    equity: boolean | null;
    bonus: string | null;
    text: string | null;
    candidateExpectation: Record<string, unknown> | null;
    thirdPartyEstimate: Record<string, unknown> | null;
  };
  source: string | null;
  jobUrl: string | null;
  externalJobId: string | null;
  notes: string[];
};

// Fixes UTF-8 text that was mis-decoded as Latin-1 upstream (e.g. "€" -> "â¬").
function fixMojibake(text: string | null): string | null {
  if (!text) return text;
  if (!/[Â-Ã][-¿]/.test(text)) return text;
  const fixed = Buffer.from(text, "latin1").toString("utf8");
  return fixed.includes("�") ? text : fixed;
}

const STATUS_MAP: Record<ImportJob["status"], "applied" | "rejected" | "skipped" | "abandoned"> = {
  applied: "applied",
  rejected: "rejected",
  skipped: "skipped",
  abandoned: "abandoned",
};

function mapRemoteStatus(workMode: string | null): "remote" | "hybrid" | "onsite" | "unknown" {
  if (!workMode) return "unknown";
  const w = workMode.toLowerCase();
  if (w.includes("hybrid")) return "hybrid";
  if (w.includes("remote")) return "remote";
  if (w.includes("on-site") || w.includes("onsite")) return "onsite";
  return "unknown";
}

function mapSource(
  source: string | null
): "linkedin" | "company_website" | "referral" | "indeed" | "recruiter" | "other" {
  if (!source) return "other";
  const s = source.toLowerCase();
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("indeed")) return "indeed";
  if (s.includes("greenhouse") || s.includes("ashby") || s.includes("rippling") || s.includes("breezy") || s.includes("tally") || s.includes("company application"))
    return "company_website";
  return "other";
}

async function main() {
  const [, , jsonPath, userEmail] = process.argv;
  if (!jsonPath || !userEmail) {
    console.error("Usage: npx tsx scripts/import-applications.ts <path-to-json> <user-email>");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });

  const [{ id: userId } = { id: undefined }] = await client<{ id: string }[]>`
    select id from auth.users where email = ${userEmail} limit 1
  `;
  if (!userId) {
    console.error(`No auth user found for email ${userEmail}`);
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(jsonPath, "utf8")) as { jobs: ImportJob[] };

  let inserted = 0;
  let updated = 0;

  for (const job of data.jobs) {
    const existingCompany = await db.query.companies.findFirst({
      where: sql`lower(${companies.name}) = lower(${job.company})`,
    });
    const companyId = existingCompany
      ? existingCompany.id
      : (await db.insert(companies).values({ name: job.company }).returning({ id: companies.id }))[0].id;

    // Matched by company only (not title too): the existing Canonical/INFUSE
    // rows in the app were seeded with slightly different title wording than
    // this export, and this dataset has one role per company anyway.
    const existingRows = await db.query.applications.findMany({
      where: and(eq(applications.userId, userId), eq(applications.companyId, companyId)),
    });

    // If a company has more than one existing row (a pre-existing duplicate),
    // update the one whose status best matches this import and delete the rest.
    const targetStatus = STATUS_MAP[job.status];
    const existingApplication =
      existingRows.find((r) => r.status === targetStatus) ??
      existingRows.find((r) => r.status !== "new" && r.status !== "skipped") ??
      existingRows[0];
    const staleRows = existingRows.filter((r) => r.id !== existingApplication?.id);
    for (const stale of staleRows) {
      await db.delete(applications).where(eq(applications.id, stale.id));
      console.log(`Deleted stale duplicate: ${job.company} — ${stale.title} (${stale.status})`);
    }

    const appliedDate = job.appliedDate ? new Date(job.appliedDate) : null;
    const reviewedDate = job.reviewedDate ? new Date(job.reviewedDate) : null;

    const values = {
      userId,
      companyId,
      title: job.role,
      location: job.location,
      remoteStatus: mapRemoteStatus(job.workMode),
      salaryMin: job.compensation.min,
      salaryMax: job.compensation.max,
      salaryCurrency: job.compensation.currency,
      jobUrl: job.jobUrl,
      source: mapSource(job.source),
      sourceDetail: job.source,
      externalJobId: job.externalJobId,
      employmentType: job.employmentType,
      status: STATUS_MAP[job.status],
      appliedAt: appliedDate,
      fitBreakdown: job.fit,
      compensationDetail: {
        ...job.compensation,
        text: fixMojibake(job.compensation.text),
      },
      rejectionDate: job.rejectionDate ? new Date(job.rejectionDate) : null,
      rejectionReasonCategory: job.rejectionReasonCategory ?? null,
      rejectionReason: job.rejectionReason ? fixMojibake(job.rejectionReason) : null,
      importNotes: job.notes.map((n) => fixMojibake(n) as string),
      updatedAt: new Date(),
    };

    if (existingApplication) {
      await db.update(applications).set(values).where(eq(applications.id, existingApplication.id));
      updated++;
      console.log(`Updated: ${job.company} — ${job.role}`);
    } else {
      await db.insert(applications).values({
        ...values,
        createdAt: appliedDate ?? reviewedDate ?? new Date(),
      });
      inserted++;
      console.log(`Inserted: ${job.company} — ${job.role}`);
    }
  }

  console.log(`\nDone. ${inserted} inserted, ${updated} updated.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
