import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, MODEL } from "./client";
import { FitReviewSchema, type FitReview } from "./schemas";

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
};

const SYSTEM_PROMPT = `You review a job posting against a candidate's career profile and produce a fit assessment.

Do not simply count matching keywords. Weigh:
- Relevant experience and role seniority
- Required vs preferred skills
- Domain experience, product type, B2B/B2C, SaaS experience
- Location and work authorization compatibility
- Salary alignment
- Portfolio relevance
- Preferred working conditions

Classify every distinct requirement you can identify from the job into exactly one of: a strong match (clearly supported by the candidate's background), a partial match (related experience exists but doesn't fully meet the requirement), a gap (requirement appears unmet), or unknown (cannot be determined from the available information). Populate the requirement matrix with one row per requirement you evaluated.

Give one overall recommendation — strong_apply, apply, consider, low_priority, or skip — with a short (2-3 sentence) explanation grounded in the specific matches and gaps.`;

export async function runFitReview(
  job: FitReviewJobInput,
  profile: FitReviewProfileInput
): Promise<FitReview> {
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      format: zodOutputFormat(FitReviewSchema),
      effort: "medium",
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## Job\n${JSON.stringify(job, null, 2)}\n\n## Candidate Career Profile\n${JSON.stringify(profile, null, 2)}`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("Failed to generate fit review");
  }
  return response.parsed_output;
}
