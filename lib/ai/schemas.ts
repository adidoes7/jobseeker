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

export const FitReviewSchema = z.object({
  fitScore: z.number().int().min(0).max(100),
  recommendation: z.enum([
    "strong_apply",
    "apply",
    "consider",
    "low_priority",
    "skip",
  ]),
  summary: z.string(),
  strongMatches: z.array(matchItemSchema),
  partialMatches: z.array(matchItemSchema),
  gaps: z.array(matchItemSchema),
  unknown: z.array(matchItemSchema),
  requirementMatrix: z.array(
    z.object({
      requirement: z.string(),
      matchLevel: z.enum(["strong", "partial", "gap", "unknown"]),
      evidence: z.string(),
    })
  ),
});
export type FitReview = z.infer<typeof FitReviewSchema>;
