"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, companies, profiles, timelineEvents } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { opportunitySchema } from "@/lib/validation/schemas";
import {
  parseNullableString,
  parseNullableInt,
  parseCommaList,
  parseLineList,
} from "@/lib/validation/parse";
import { fetchJobPageText } from "@/lib/scrape/fetch-job-page";
import { extractJobFromText } from "@/lib/ai/extract-job";
import { runFitReview } from "@/lib/ai/review-fit";
import { isProfileReadyForReview } from "@/lib/profile-readiness";
import type { ExtractedJob } from "@/lib/ai/schemas";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export type ExtractJobResult =
  | { ok: true; data: ExtractedJob }
  | { ok: false; reason: "fetch_failed" | "insufficient_content" | "extraction_failed" };

export async function extractJobFromUrl(url: string): Promise<ExtractJobResult> {
  await requireUser();

  const page = await fetchJobPageText(url);
  if (!page.ok) {
    return { ok: false, reason: page.reason };
  }

  try {
    const data = await extractJobFromText(page.text, url);
    return { ok: true, data };
  } catch {
    return { ok: false, reason: "extraction_failed" };
  }
}

export type SaveOpportunityState = { error?: string } | undefined;

export async function saveOpportunity(
  _prevState: SaveOpportunityState,
  formData: FormData
): Promise<SaveOpportunityState> {
  const user = await requireUser();

  const parsed = opportunitySchema.safeParse({
    company: parseNullableString(formData.get("company")) ?? "",
    title: parseNullableString(formData.get("title")) ?? "",
    location: parseNullableString(formData.get("location")),
    remoteStatus:
      (parseNullableString(formData.get("remoteStatus")) as
        | "remote"
        | "hybrid"
        | "onsite"
        | "unknown"
        | null) ?? "unknown",
    salaryMin: parseNullableInt(formData.get("salaryMin")),
    salaryMax: parseNullableInt(formData.get("salaryMax")),
    salaryCurrency: parseNullableString(formData.get("salaryCurrency")),
    description: parseNullableString(formData.get("description")),
    responsibilities: parseLineList(formData.get("responsibilities")),
    requiredSkills: parseCommaList(formData.get("requiredSkills")),
    preferredSkills: parseCommaList(formData.get("preferredSkills")),
    experienceRequirements: parseNullableString(formData.get("experienceRequirements")),
    jobUrl: parseNullableString(formData.get("jobUrl")),
    applicationUrl: parseNullableString(formData.get("applicationUrl")),
    source:
      (parseNullableString(formData.get("source")) as
        | "linkedin"
        | "company_website"
        | "referral"
        | "indeed"
        | "recruiter"
        | "other"
        | null) ?? "other",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { company: companyName, ...jobFields } = parsed.data;

  let applicationId: string;

  await db.transaction(async (tx) => {
    const existingCompany = await tx.query.companies.findFirst({
      where: sql`lower(${companies.name}) = lower(${companyName})`,
    });

    const companyId = existingCompany
      ? existingCompany.id
      : (await tx.insert(companies).values({ name: companyName }).returning({ id: companies.id }))[0]
          .id;

    const inserted = await tx
      .insert(applications)
      .values({
        userId: user.id,
        companyId,
        status: "new",
        ...jobFields,
      })
      .returning({ id: applications.id });

    applicationId = inserted[0].id;

    await tx.insert(timelineEvents).values({
      applicationId,
      eventType: "created",
      title: "Opportunity added",
      isAutomatic: true,
    });
  });

  redirect(`/opportunities/${applicationId!}`);
}

export async function skipOpportunity(id: string) {
  const user = await requireUser();
  await db
    .update(applications)
    .set({ status: "skipped", updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)));
  revalidatePath("/opportunities");
}

export async function runFitReviewAction(applicationId: string) {
  const user = await requireUser();

  const [application, profile] = await Promise.all([
    db.query.applications.findFirst({
      where: and(eq(applications.id, applicationId), eq(applications.userId, user.id)),
      with: { company: true },
    }),
    db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) }),
  ]);
  if (!application || !profile) throw new Error("Not found");
  if (!isProfileReadyForReview(profile)) {
    throw new Error("Profile is not ready for review");
  }

  const review = await runFitReview(
    {
      title: application.title,
      companyName: application.company.name,
      location: application.location,
      remoteStatus: application.remoteStatus,
      salaryMin: application.salaryMin,
      salaryMax: application.salaryMax,
      description: application.description,
      responsibilities: application.responsibilities ?? [],
      requiredSkills: application.requiredSkills ?? [],
      preferredSkills: application.preferredSkills ?? [],
      experienceRequirements: application.experienceRequirements,
    },
    {
      currentRole: profile.currentRole,
      yearsExperience: profile.yearsExperience,
      location: profile.location,
      workPreference: profile.workPreference,
      workAuthorization: profile.workAuthorization,
      salaryExpectationMin: profile.salaryExpectationMin,
      salaryExpectationMax: profile.salaryExpectationMax,
      targetRoles: profile.targetRoles ?? [],
      targetSeniority: profile.targetSeniority,
      preferredIndustries: profile.preferredIndustries ?? [],
      skills: profile.skills ?? [],
      experienceSummary: profile.experienceSummary,
      portfolioUrl: profile.portfolioUrl,
      portfolioCaseStudies: profile.portfolioCaseStudies ?? [],
    },
    application.structuredRequirements ?? undefined
  );

  await db
    .update(applications)
    .set({
      structuredRequirements: review.requirements,
      fitScore: review.fitScore,
      fitRecommendation: review.recommendation,
      fitSummary: review.summary,
      fitReview: {
        strongMatches: review.strongMatches,
        partialMatches: review.partialMatches,
        gaps: review.gaps,
        unknown: review.unknown,
        requirementMatrix: review.requirementMatrix,
      },
      fitReviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));

  revalidatePath(`/opportunities/${applicationId}`);
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/opportunities");
  revalidatePath("/applications");

  return { fitScore: review.fitScore, recommendation: review.recommendation };
}
