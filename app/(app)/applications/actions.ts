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

// Statuses that represent a scheduled event (an interview, a screening call,
// a take-home assignment) rather than a plain state — the caller is prompted
// for that event's date, which becomes the timeline entry's eventDate so it
// can show up in the dashboard's upcoming-events widget instead of just
// logging "changed at the moment you clicked."
const EVENT_TYPE_BY_STATUS: Partial<Record<Status, "interview" | "assignment">> = {
  recruiter_screening: "interview",
  first_interview: "interview",
  hr_interview: "interview",
  technical_interview: "interview",
  interview_process: "interview",
  final_interview: "interview",
  assignment_case_study: "assignment",
};

export async function updateStatus(applicationId: string, status: Status, eventDate?: Date) {
  const user = await requireUser();

  const eventType = EVENT_TYPE_BY_STATUS[status] ?? "status_change";

  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)));

    await tx.insert(timelineEvents).values({
      applicationId,
      eventType,
      title: `Status changed to ${status.replace(/_/g, " ")}`,
      eventDate: eventDate ?? new Date(),
      isAutomatic: true,
    });
  });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
  revalidatePath("/dashboard");
}

export async function deleteApplication(applicationId: string) {
  const user = await requireUser();

  await db
    .delete(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, user.id)));

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
