import { z } from "zod";

export const ExtractedJobSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string().nullable(),
  remoteStatus: z.enum(["remote", "hybrid", "onsite", "unknown"]),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  salaryCurrency: z.string().nullable(),
  description: z.string().nullable(),
  responsibilities: z.array(z.string()),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  experienceRequirements: z.string().nullable(),
  applicationUrl: z.string().nullable(),
  source: z.enum([
    "linkedin",
    "company_website",
    "referral",
    "indeed",
    "recruiter",
    "other",
  ]),
});
export type ExtractedJob = z.infer<typeof ExtractedJobSchema>;

export const CvExtractionSchema = z.object({
  skills: z.array(z.string()),
  experienceSummary: z.string(),
});
export type CvExtraction = z.infer<typeof CvExtractionSchema>;

const matchItemSchema = z.object({
  requirement: z.string(),
  evidence: z.string(),
});

export const matchLevelEnumSchema = z.enum(["strong", "partial", "gap", "unknown"]);
export type MatchLevel = z.infer<typeof matchLevelEnumSchema>;

export const requirementMatrixRowSchema = z.object({
  requirement: z.string(),
  matchLevel: matchLevelEnumSchema,
  evidence: z.string(),
});

export const recommendationEnumSchema = z.enum([
  "strong_apply",
  "apply",
  "consider",
  "low_priority",
  "skip",
]);
export type Recommendation = z.infer<typeof recommendationEnumSchema>;

// The assembled result of the fit-review pipeline (see review-fit.ts) —
// not parsed directly from a single Claude call anymore, but built in code
// from the requirements/evidence-matching/scoring/explanation stages.
export const FitReviewSchema = z.object({
  fitScore: z.number().int().min(0).max(100),
  recommendation: recommendationEnumSchema,
  summary: z.string(),
  strongMatches: z.array(matchItemSchema),
  partialMatches: z.array(matchItemSchema),
  gaps: z.array(matchItemSchema),
  unknown: z.array(matchItemSchema),
  requirementMatrix: z.array(requirementMatrixRowSchema),
});
export type FitReview = z.infer<typeof FitReviewSchema>;

// ---------- Stage 2: structured job requirements ----------
export const requirementTypeSchema = z.enum([
  "skill",
  "experience",
  "domain",
  "seniority",
  "location",
  "work_authorization",
  "salary",
  "other",
]);

export const requirementImportanceSchema = z.enum(["required", "preferred"]);

export const RequirementSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: requirementTypeSchema,
  importance: requirementImportanceSchema,
});
export type Requirement = z.infer<typeof RequirementSchema>;

export const RequirementsExtractionSchema = z.object({
  requirements: z.array(RequirementSchema),
});

// ---------- Stage 3: evidence matching ----------
export const matchBasisSchema = z.enum(["direct", "transferable", "inferred"]);
export type MatchBasis = z.infer<typeof matchBasisSchema>;

export const EvidenceMatchSchema = z.object({
  requirementId: z.string(),
  matchLevel: matchLevelEnumSchema,
  matchBasis: matchBasisSchema.nullable(),
  evidence: z.string(),
  confidence: z.number().min(0).max(1),
});
export type EvidenceMatch = z.infer<typeof EvidenceMatchSchema>;

export const EvidenceMatchingSchema = z.object({
  matches: z.array(EvidenceMatchSchema),
});

// ---------- Stage 5: explanation ----------
export const FitExplanationSchema = z.object({
  summary: z.string(),
});
