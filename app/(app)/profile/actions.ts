"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, cvs } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/schemas";
import {
  parseCommaList,
  parseNullableString,
  parseNullableInt,
  parseCaseStudies,
} from "@/lib/validation/parse";
import { extractCvSkills } from "@/lib/ai/extract-cv-skills";

export type ProfileFormState = { error?: string; success?: boolean } | undefined;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    fullName: parseNullableString(formData.get("fullName")),
    currentRole: parseNullableString(formData.get("currentRole")),
    yearsExperience: parseNullableInt(formData.get("yearsExperience")),
    location: parseNullableString(formData.get("location")),
    preferredLocations: parseCommaList(formData.get("preferredLocations")),
    workPreference: (() => {
      const v = parseNullableString(formData.get("workPreference"));
      return v && v !== "unset"
        ? (v as "remote" | "hybrid" | "onsite" | "flexible")
        : null;
    })(),
    workAuthorization: parseNullableString(formData.get("workAuthorization")),
    salaryExpectationMin: parseNullableInt(formData.get("salaryExpectationMin")),
    salaryExpectationMax: parseNullableInt(formData.get("salaryExpectationMax")),
    salaryCurrency: parseNullableString(formData.get("salaryCurrency")),
    targetRoles: parseCommaList(formData.get("targetRoles")),
    targetSeniority: parseNullableString(formData.get("targetSeniority")),
    preferredIndustries: parseCommaList(formData.get("preferredIndustries")),
    preferredCompanyTypes: parseCommaList(formData.get("preferredCompanyTypes")),
    preferredCompanySizes: parseCommaList(formData.get("preferredCompanySizes")),
    avoidRolesIndustries: parseNullableString(formData.get("avoidRolesIndustries")),
    portfolioUrl: parseNullableString(formData.get("portfolioUrl")),
    portfolioCaseStudies: parseCaseStudies(formData.get("portfolioCaseStudies")),
    linkedinUrl: parseNullableString(formData.get("linkedinUrl")),
    skills: parseCommaList(formData.get("skills")),
    experienceSummary: parseNullableString(formData.get("experienceSummary")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db
    .update(profiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(profiles.userId, user.id));

  revalidatePath("/profile");
  return { success: true };
}

export async function registerCv(input: {
  name: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const user = await requireUser();

  const existing = await db.query.cvs.findMany({
    where: eq(cvs.userId, user.id),
    columns: { id: true },
  });

  await db.insert(cvs).values({
    userId: user.id,
    name: input.name,
    storagePath: input.storagePath,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    isDefault: existing.length === 0,
  });

  revalidatePath("/profile");
}

export async function setDefaultCv(cvId: string) {
  const user = await requireUser();

  await db.transaction(async (tx) => {
    await tx
      .update(cvs)
      .set({ isDefault: false })
      .where(eq(cvs.userId, user.id));
    await tx
      .update(cvs)
      .set({ isDefault: true })
      .where(and(eq(cvs.id, cvId), eq(cvs.userId, user.id)));
  });

  revalidatePath("/profile");
}

export async function extractCvSkillsAction(cvId: string) {
  const user = await requireUser();

  const cv = await db.query.cvs.findFirst({
    where: and(eq(cvs.id, cvId), eq(cvs.userId, user.id)),
  });
  if (!cv) throw new Error("CV not found");

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("cvs").download(cv.storagePath);
  if (error || !data) throw new Error("Failed to download CV file");

  const buffer = Buffer.from(await data.arrayBuffer());
  const base64 = buffer.toString("base64");

  const extracted = await extractCvSkills(base64);

  await db
    .update(profiles)
    .set({
      skills: extracted.skills,
      experienceSummary: extracted.experienceSummary,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, user.id));

  revalidatePath("/profile");
}
