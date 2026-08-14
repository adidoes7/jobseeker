"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, timelineEvents, applicationStatusEnum } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { parseNullableString } from "@/lib/validation/parse";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function markAsApplied(applicationId: string, formData: FormData) {
  const user = await requireUser();

  const cvId = parseNullableString(formData.get("cvId"));
  const coverLetter = parseNullableString(formData.get("coverLetter"));
  const notes = parseNullableString(formData.get("notes"));

  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({
        status: "applied",
        appliedAt: new Date(),
        cvId: cvId ?? undefined,
        coverLetter,
        notes,
        updatedAt: new Date(),
      })
      .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)));

    await tx.insert(timelineEvents).values({
      applicationId,
      eventType: "status_change",
      title: "Applied",
      description: "Application submitted",
      isAutomatic: true,
    });
  });

  redirect(`/applications/${applicationId}`);
}

const STATUS_VALUES = applicationStatusEnum.enumValues;
type Status = (typeof STATUS_VALUES)[number];

export async function updateStatus(applicationId: string, status: Status) {
  const user = await requireUser();

  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)));

    await tx.insert(timelineEvents).values({
      applicationId,
      eventType: "status_change",
      title: `Status changed to ${status.replace(/_/g, " ")}`,
      isAutomatic: true,
    });
  });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
}

export async function addTimelineEvent(applicationId: string, formData: FormData) {
  const user = await requireUser();

  const title = parseNullableString(formData.get("title"));
  if (!title) return;
  const description = parseNullableString(formData.get("description"));

  const owned = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, user.id)),
    columns: { id: true },
  });
  if (!owned) throw new Error("Not found");

  await db.insert(timelineEvents).values({
    applicationId,
    eventType: "note",
    title,
    description,
    isAutomatic: false,
  });

  revalidatePath(`/applications/${applicationId}`);
}
