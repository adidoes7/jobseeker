import { extractRequirements } from "./extract-requirements";
import { matchEvidence } from "./match-evidence";
import { explainFit } from "./explain-fit";
import { computeFitScore } from "@/lib/scoring/fit-score";
import type { Requirement, MatchLevel, Recommendation } from "./schemas";

export type FitReviewJobInput = {
  title: string;
  companyName: string;
  location: string | null;
  remoteStatus: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string | null;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequirements: string | null;
};

export type FitReviewProfileInput = {
  currentRole: string | null;
  yearsExperience: number | null;
  location: string | null;
  workPreference: string | null;
  workAuthorization: string | null;
  salaryExpectationMin: number | null;
  salaryExpectationMax: number | null;
  targetRoles: string[];
  targetSeniority: string | null;
  preferredIndustries: string[];
  skills: string[];
  experienceSummary: string | null;
  portfolioUrl: string | null;
  portfolioCaseStudies: { label: string; url: string }[];
};

export type FitReviewOutcome = {
  requirements: Requirement[];
  fitScore: number;
  recommendation: Recommendation;
  summary: string;
  strongMatches: { requirement: string; evidence: string }[];
  partialMatches: { requirement: string; evidence: string }[];
  gaps: { requirement: string; evidence: string }[];
  unknown: { requirement: string; evidence: string }[];
  requirementMatrix: { requirement: string; matchLevel: MatchLevel; evidence: string }[];
};

/**
 * Fit review pipeline: extraction, matching, and explanation are Claude's
 * job (understanding fuzzy natural language); the actual score is not — it's
 * computed by a fixed, inspectable formula in lib/scoring/fit-score.ts, so
 * the same requirements + evidence always produce the same score, and tuning
 * it means editing a weight there instead of re-wording a prompt.
 *
 * Requirement extraction (stage 2) is candidate-independent, so pass
 * `cachedRequirements` (persisted per job on first run) to skip re-running it.
 */
export async function runFitReview(
  job: FitReviewJobInput,
  profile: FitReviewProfileInput,
  cachedRequirements?: Requirement[]
): Promise<FitReviewOutcome> {
  const requirements =
    cachedRequirements && cachedRequirements.length > 0
      ? cachedRequirements
      : await extractRequirements(job);

  const matches = await matchEvidence(profile, requirements);
  const { score, recommendation } = computeFitScore(requirements, matches);
  const summary = await explainFit(job, requirements, matches, score, recommendation);

  const matchById = new Map(matches.map((m) => [m.requirementId, m]));
  const requirementMatrix = requirements.map((req) => {
    const match = matchById.get(req.id);
    return {
      requirement: req.text,
      matchLevel: match?.matchLevel ?? ("unknown" as const),
      evidence: match?.evidence ?? "No evidence found in candidate profile.",
    };
  });

  const groupBy = (level: MatchLevel) =>
    requirementMatrix
      .filter((r) => r.matchLevel === level)
      .map(({ requirement, evidence }) => ({ requirement, evidence }));

  return {
    requirements,
    fitScore: score,
    recommendation,
    summary,
    strongMatches: groupBy("strong"),
    partialMatches: groupBy("partial"),
    gaps: groupBy("gap"),
    unknown: groupBy("unknown"),
    requirementMatrix,
  };
}
