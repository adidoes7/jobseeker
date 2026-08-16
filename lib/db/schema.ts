import {
  pgTable,
  pgSchema,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Supabase-managed auth schema — declared minimally here so Drizzle can
// type/emit foreign keys. Never migrate this table ourselves.
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// ---------- Enums ----------
export const workPreferenceEnum = pgEnum("work_preference", [
  "remote",
  "hybrid",
  "onsite",
  "flexible",
]);

export const remoteStatusEnum = pgEnum("remote_status", [
  "remote",
  "hybrid",
  "onsite",
  "unknown",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  // pre-apply (Opportunity)
  "new",
  "reviewing",
  "saved",
  "ready_to_apply",
  "skipped",
  // post-apply (Application pipeline)
  "applied",
  "recruiter_screening",
  "first_interview",
  "interview_process",
  "assignment_case_study",
  "final_interview",
  "offer",
  // terminal
  "rejected",
  "withdrawn",
  "ghosted",
  "abandoned",
  "position_closed",
]);

export const recommendationEnum = pgEnum("recommendation", [
  "strong_apply",
  "apply",
  "consider",
  "low_priority",
  "skip",
]);

export const matchLevelEnum = pgEnum("match_level", [
  "strong",
  "partial",
  "gap",
  "unknown",
]);

export const applicationSourceEnum = pgEnum("application_source", [
  "linkedin",
  "company_website",
  "referral",
  "indeed",
  "recruiter",
  "other",
]);

export const contactRoleEnum = pgEnum("contact_role", [
  "recruiter",
  "hiring_manager",
  "interviewer",
  "referral",
  "other",
]);

export const timelineEventTypeEnum = pgEnum("timeline_event_type", [
  "status_change",
  "note",
  "email",
  "interview",
  "assignment",
  "follow_up",
  "created",
  "custom",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "cv",
  "cover_letter",
  "application_answers",
  "other",
]);

// ---------- profiles (1:1 with auth.users) ----------
export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  currentRole: text("current_role"),
  yearsExperience: integer("years_experience"),
  location: text("location"),
  preferredLocations: jsonb("preferred_locations").$type<string[]>().default([]),
  workPreference: workPreferenceEnum("work_preference"),
  workAuthorization: text("work_authorization"),
  salaryExpectationMin: integer("salary_expectation_min"),
  salaryExpectationMax: integer("salary_expectation_max"),
  salaryCurrency: text("salary_currency").default("USD"),
  targetRoles: jsonb("target_roles").$type<string[]>().default([]),
  targetSeniority: text("target_seniority"),
  preferredIndustries: jsonb("preferred_industries").$type<string[]>().default([]),
  preferredCompanyTypes: jsonb("preferred_company_types").$type<string[]>().default([]),
  preferredCompanySizes: jsonb("preferred_company_sizes").$type<string[]>().default([]),
  avoidRolesIndustries: text("avoid_roles_industries"),
  portfolioUrl: text("portfolio_url"),
  portfolioCaseStudies: jsonb("portfolio_case_studies")
    .$type<{ label: string; url: string }[]>()
    .default([]),
  linkedinUrl: text("linkedin_url"),
  linkedinPdfPath: text("linkedin_pdf_path"),
  skills: jsonb("skills").$type<string[]>().default([]),
  experienceSummary: text("experience_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- cvs (multiple named CV versions, one default) ----------
export const cvs = pgTable("cvs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  storagePath: text("storage_path").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- companies ----------
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  website: text("website"),
  industry: text("industry"),
  size: text("size"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- applications: Job + Application, single record ----------
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),

  // Job / opportunity fields
  title: text("title").notNull(),
  location: text("location"),
  remoteStatus: remoteStatusEnum("remote_status").default("unknown"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency"),
  description: text("description"),
  responsibilities: jsonb("responsibilities").$type<string[]>().default([]),
  requiredSkills: jsonb("required_skills").$type<string[]>().default([]),
  preferredSkills: jsonb("preferred_skills").$type<string[]>().default([]),
  experienceRequirements: text("experience_requirements"),
  jobUrl: text("job_url"),
  applicationUrl: text("application_url"),
  source: applicationSourceEnum("source").default("other"),
  sourceDetail: text("source_detail"),
  externalJobId: text("external_job_id"),
  employmentType: text("employment_type"),

  // Status spans pre-apply -> post-apply -> terminal
  status: applicationStatusEnum("status").default("new").notNull(),

  // AI Job Review
  fitScore: integer("fit_score"),
  fitRecommendation: recommendationEnum("fit_recommendation"),
  fitSummary: text("fit_summary"),
  fitReview: jsonb("fit_review").$type<{
    strongMatches: { requirement: string; evidence: string }[];
    partialMatches: { requirement: string; evidence: string }[];
    gaps: { requirement: string; evidence: string }[];
    unknown: { requirement: string; evidence: string }[];
    requirementMatrix: {
      requirement: string;
      matchLevel: "strong" | "partial" | "gap" | "unknown";
      evidence: string;
    }[];
  }>(),
  fitReviewedAt: timestamp("fit_reviewed_at", { withTimezone: true }),

  // Application-specific (populated on Mark as Applied)
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  cvId: uuid("cv_id").references(() => cvs.id),
  coverLetter: text("cover_letter"),
  portfolioSent: boolean("portfolio_sent").default(false),
  applicationQuestions: jsonb("application_questions")
    .$type<{ question: string; answer: string }[]>()
    .default([]),
  salaryDiscussed: text("salary_discussed"),
  notes: text("notes"),

  // Imported external tracking data (e.g. a manually-kept spreadsheet/tracker).
  // Kept separate from fitScore/fitReview above, which are this app's own
  // AI-generated review on a 0-100 scale — imported fit data may use a
  // different rubric/scale entirely, so it's not conflated with it.
  fitBreakdown: jsonb("fit_breakdown").$type<Record<string, number | null>>(),
  compensationDetail: jsonb("compensation_detail").$type<{
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
  }>(),
  rejectionDate: timestamp("rejection_date", { withTimezone: true }),
  rejectionReasonCategory: text("rejection_reason_category"),
  rejectionReason: text("rejection_reason"),
  importNotes: jsonb("import_notes").$type<string[]>().default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- timeline_events ----------
export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  eventType: timelineEventTypeEnum("event_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date", { withTimezone: true }).defaultNow().notNull(),
  isAutomatic: boolean("is_automatic").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- interviews (schema now, no UI this slice) ----------
export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  interviewType: text("interview_type"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
  interviewerName: text("interviewer_name"),
  meetingUrl: text("meeting_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- contacts (schema now, no UI this slice) ----------
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: contactRoleEnum("role"),
  email: text("email"),
  linkedinUrl: text("linkedin_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- documents (generated materials — schema now, generation UI later) ----------
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, {
    onDelete: "cascade",
  }),
  type: documentTypeEnum("type").notNull(),
  name: text("name"),
  storagePath: text("storage_path"),
  content: text("content"),
  cvId: uuid("cv_id").references(() => cvs.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- relations ----------
export const applicationsRelations = relations(applications, ({ one, many }) => ({
  company: one(companies, {
    fields: [applications.companyId],
    references: [companies.id],
  }),
  cv: one(cvs, {
    fields: [applications.cvId],
    references: [cvs.id],
  }),
  timelineEvents: many(timelineEvents),
  interviews: many(interviews),
  contacts: many(contacts),
  documents: many(documents),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  application: one(applications, {
    fields: [timelineEvents.applicationId],
    references: [applications.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  application: one(applications, {
    fields: [contacts.applicationId],
    references: [applications.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  application: one(applications, {
    fields: [documents.applicationId],
    references: [applications.id],
  }),
  cv: one(cvs, {
    fields: [documents.cvId],
    references: [cvs.id],
  }),
}));

export const cvsRelations = relations(cvs, ({ many }) => ({
  applications: many(applications),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  applications: many(applications),
}));

// Pre-apply statuses (Opportunity) vs everything else (Application pipeline + terminal)
export const OPPORTUNITY_STATUSES = [
  "new",
  "reviewing",
  "saved",
  "ready_to_apply",
  "skipped",
] as const;

// Application-side status groupings, used for the Applications list filter tabs.
export const APPLIED_STATUSES = ["applied"] as const;
export const PROCEEDED_STATUSES = [
  "recruiter_screening",
  "first_interview",
  "interview_process",
  "assignment_case_study",
  "final_interview",
  "offer",
] as const;
export const REJECTED_STATUSES = [
  "rejected",
  "withdrawn",
  "ghosted",
  "abandoned",
  "position_closed",
] as const;
